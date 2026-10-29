import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { BranchService } from '../common/branch.service';
import { PermissionsGuard, RequirePermissions } from '../common/permissions.guard';
import { clampLimit, clampPage, money, nextNumber, toNum } from '../common/utils';

class CreateCountDto {
  @IsOptional() branchId?: number | string;
  @IsString() title: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsArray() items?: Array<{ productId: number | string; actualQuantity: number | string; reason?: string }>;
}

class UpdateCountItemsDto {
  @IsArray() items: Array<{ itemId: number | string; actualQuantity: number | string; reason?: string }>;
}

class TransferDto {
  @IsOptional() fromBranchId?: number | string;
  @IsOptional() toBranchId?: number | string;
  @IsOptional() @IsString() notes?: string;
  @IsArray() items: Array<{ productId: number | string; quantity: number | string }>;
}

@ApiTags('Inventory')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/inventory')
export class InventoryController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly branches: BranchService,
  ) {}

  @Get('counts')
  @RequirePermissions('stock.read')
  async counts(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = clampPage(page);
    const pageSize = clampLimit(limit, 20, 100);
    const where: any = { userId: user.id };
    if (status && status !== 'all') where.status = status;
    const [total, rows] = await Promise.all([
      this.prisma.inventoryCount.count({ where }),
      this.prisma.inventoryCount.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        include: { items: true },
      }),
    ]);
    return {
      count: total,
      page: pageNum,
      limit: pageSize,
      results: rows.map((c) => this.formatCount(c)),
    };
  }

  @Get('counts/:id')
  @RequirePermissions('stock.read')
  async count(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    const count = await this.prisma.inventoryCount.findFirst({
      where: { id, userId: user.id },
      include: { items: { include: { product: { select: { name: true, barcode: true } } } } },
    });
    if (!count) throw new NotFoundException('Инвентаризация не найдена');
    return this.formatCount(count);
  }

  @Post('counts')
  @RequirePermissions('inventory.manage')
  @ApiOperation({ summary: 'Создать инвентаризацию' })
  async createCount(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateCountDto) {
    if (!dto.title?.trim()) throw new BadRequestException('Укажите название инвентаризации');
    const branchId = dto.branchId ? await this.branches.resolveBranchId(user.id, parseInt(String(dto.branchId), 10)) : null;
    const productWhere: any = { userId: user.id };
    if (branchId) productWhere.branchId = branchId;
    const products = await this.prisma.product.findMany({ where: productWhere, orderBy: { name: 'asc' } });
    if (products.length === 0) throw new BadRequestException('Нет товаров для инвентаризации');

    const provided = new Map<number, { qty: number; reason?: string }>();
    for (const item of dto.items || []) {
      provided.set(parseInt(String(item.productId), 10), { qty: Math.max(0, Math.floor(toNum(item.actualQuantity))), reason: item.reason });
    }

    const items = products.map((p) => {
      const system = p.quantityReceived - p.quantitySold;
      const actual = provided.has(p.id) ? provided.get(p.id)!.qty : system;
      return {
        productId: p.id,
        systemQuantity: system,
        actualQuantity: actual,
        difference: actual - system,
        reason: provided.get(p.id)?.reason || null,
      };
    });

    const count = await this.prisma.inventoryCount.create({
      data: {
        userId: user.id,
        branchId,
        title: dto.title.trim(),
        notes: dto.notes?.trim() || null,
        status: 'in_progress',
        items: { create: items },
      },
      include: { items: true },
    });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'inventory.create', entity: 'inventory_count', entityId: count.id, details: { title: count.title } });
    return this.formatCount(count);
  }

  @Patch('counts/:id/items')
  @RequirePermissions('inventory.manage')
  @ApiOperation({ summary: 'Внести фактические количества' })
  async updateCountItems(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCountItemsDto,
  ) {
    const count = await this.prisma.inventoryCount.findFirst({
      where: { id, userId: user.id },
      include: { items: true },
    });
    if (!count) throw new NotFoundException('Инвентаризация не найдена');
    if (count.status !== 'in_progress') throw new BadRequestException('Инвентаризация уже завершена');

    await this.prisma.$transaction(async (tx) => {
      for (const raw of dto.items || []) {
        const itemId = parseInt(String(raw.itemId), 10);
        const item = count.items.find((i) => i.id === itemId);
        if (!item) continue;
        if (item.adjusted) throw new BadRequestException('Позиция уже скорректирована');
        const actual = Math.max(0, Math.floor(toNum(raw.actualQuantity)));
        await tx.inventoryCountItem.update({
          where: { id: itemId },
          data: { actualQuantity: actual, difference: actual - item.systemQuantity, reason: raw.reason?.trim() || item.reason },
        });
      }
    });
    return this.count(user, id);
  }

  @Post('counts/:id/complete')
  @RequirePermissions('inventory.manage')
  @ApiOperation({ summary: 'Подтвердить инвентаризацию и применить расхождения' })
  async completeCount(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    const count = await this.prisma.inventoryCount.findFirst({
      where: { id, userId: user.id },
      include: { items: true },
    });
    if (!count) throw new NotFoundException('Инвентаризация не найдена');
    if (count.status === 'completed') throw new BadRequestException('Инвентаризация уже завершена');

    const differences = count.items.filter((i) => !i.adjusted && i.difference !== 0);
    for (const item of differences) {
      if (!item.reason || !item.reason.trim()) {
        throw new BadRequestException('Для каждой позиции с расхождением укажите причину');
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      for (const item of differences) {
        const product = await tx.product.findFirst({ where: { id: item.productId, userId: user.id } });
        if (!product) continue;
        const before = product.quantityReceived - product.quantitySold;
        const after = before + item.difference;
        if (after < 0) throw new BadRequestException(`Корректировка по «${product.name}» привела бы к отрицательному остатку`);
        await tx.product.update({
          where: { id: product.id },
          data: { quantityReceived: { increment: item.difference } },
        });
        await tx.stockMovement.create({
          data: {
            userId: user.id,
            productId: product.id,
            branchId: count.branchId,
            type: item.difference > 0 ? 'inventory_surplus' : 'inventory_shortage',
            quantity: item.difference,
            quantityBefore: before,
            quantityAfter: after,
            costPrice: toNum(product.purchasePrice),
            sellingPrice: toNum(product.sellingPrice),
            reason: item.reason || 'Инвентаризация',
            referenceId: String(count.id),
            userName: user.username,
          },
        });
        await tx.inventoryCountItem.update({ where: { id: item.id }, data: { adjusted: true } });
      }
      return tx.inventoryCount.update({
        where: { id },
        data: { status: 'completed', completedAt: new Date() },
        include: { items: { include: { product: { select: { name: true, barcode: true } } } } },
      });
    });

    await this.audit.log({
      userId: user.id,
      userName: user.username,
      action: 'inventory.complete',
      entity: 'inventory_count',
      entityId: id,
      details: { adjustments: differences.map((d) => ({ productId: d.productId, diff: d.difference })) },
    });
    return this.formatCount(result);
  }

  @Get('transfers')
  @RequirePermissions('stock.read')
  async transfers(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = clampPage(page);
    const pageSize = clampLimit(limit, 20, 100);
    const where: any = { userId: user.id };
    if (status && status !== 'all') where.status = status;
    const [total, rows] = await Promise.all([
      this.prisma.inventoryTransfer.count({ where }),
      this.prisma.inventoryTransfer.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        include: { items: { include: { product: { select: { name: true, barcode: true } } } } },
      }),
    ]);
    const branches = await this.prisma.branch.findMany({ where: { userId: user.id } });
    const branchName = (id: number) => branches.find((b) => b.id === id)?.name || `#${id}`;
    return {
      count: total,
      page: pageNum,
      limit: pageSize,
      results: rows.map((t) => ({
        id: t.id,
        transferNumber: t.transferNumber,
        fromBranchId: t.fromBranchId,
        fromBranchName: branchName(t.fromBranchId),
        toBranchId: t.toBranchId,
        toBranchName: branchName(t.toBranchId),
        status: t.status,
        notes: t.notes || '',
        shippedAt: t.shippedAt,
        receivedAt: t.receivedAt,
        createdAt: t.createdAt,
        items: t.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          productName: i.product?.name || '',
          barcode: i.product?.barcode || '',
          quantity: i.quantity,
        })),
      })),
    };
  }

  @Post('transfers')
  @RequirePermissions('inventory.manage')
  @ApiOperation({ summary: 'Создать перемещение между филиалами' })
  async createTransfer(@CurrentUser() user: CurrentUserPayload, @Body() dto: TransferDto) {
    const fromBranchId = parseInt(String(dto.fromBranchId), 10);
    const toBranchId = parseInt(String(dto.toBranchId), 10);
    if (!fromBranchId || !toBranchId) throw new BadRequestException('Выберите исходный и принимающий филиал');
    if (fromBranchId === toBranchId) throw new BadRequestException('Филиалы должны отличаться');
    const [from, to] = await Promise.all([
      this.prisma.branch.findFirst({ where: { id: fromBranchId, userId: user.id } }),
      this.prisma.branch.findFirst({ where: { id: toBranchId, userId: user.id } }),
    ]);
    if (!from || !to) throw new BadRequestException('Филиал не найден или принадлежит другому аккаунту');
    if (!dto.items?.length) throw new BadRequestException('Добавьте товары для перемещения');

    const items: any[] = [];
    for (const raw of dto.items) {
      const productId = parseInt(String(raw.productId), 10);
      const product = await this.prisma.product.findFirst({ where: { id: productId, userId: user.id } });
      if (!product) throw new BadRequestException(`Товар #${productId} не найден`);
      const qty = Math.max(1, Math.floor(toNum(raw.quantity)));
      const remaining = product.quantityReceived - product.quantitySold;
      if (qty > remaining) throw new BadRequestException(`По «${product.name}» недостаточно остатка (${remaining})`);
      items.push({ productId, quantity: qty });
    }

    const transfer = await this.prisma.inventoryTransfer.create({
      data: {
        transferNumber: nextNumber('TR'),
        userId: user.id,
        fromBranchId,
        toBranchId,
        status: 'draft',
        notes: dto.notes?.trim() || null,
        items: { create: items },
      },
      include: { items: true },
    });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'transfer.create', entity: 'inventory_transfer', entityId: transfer.id });
    return transfer;
  }

  @Post('transfers/:id/ship')
  @RequirePermissions('inventory.manage')
  @ApiOperation({ summary: 'Подтвердить отправку (товар уходит из исходного филиала)' })
  async ship(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    const transfer = await this.prisma.inventoryTransfer.findFirst({
      where: { id, userId: user.id },
      include: { items: true },
    });
    if (!transfer) throw new NotFoundException('Перемещение не найдено');
    if (transfer.status !== 'draft') throw new BadRequestException('Отправить можно только черновик');

    const result = await this.prisma.$transaction(async (tx) => {
      for (const item of transfer.items) {
        const product = await tx.product.findFirst({ where: { id: item.productId, userId: user.id } });
        if (!product) throw new BadRequestException('Товар не найден');
        const before = product.quantityReceived - product.quantitySold;
        if (item.quantity > before) throw new BadRequestException(`По «${product.name}» недостаточно остатка`);
        const after = before - item.quantity;
        await tx.product.update({ where: { id: product.id }, data: { quantityReceived: { decrement: item.quantity } } });
        await tx.stockMovement.create({
          data: {
            userId: user.id,
            productId: product.id,
            branchId: transfer.fromBranchId,
            type: 'transfer_out',
            quantity: -item.quantity,
            quantityBefore: before,
            quantityAfter: after,
            reason: `Перемещение ${transfer.transferNumber}`,
            referenceId: String(transfer.id),
            userName: user.username,
          },
        });
      }
      return tx.inventoryTransfer.update({
        where: { id },
        data: { status: 'shipped', shippedAt: new Date() },
        include: { items: true },
      });
    });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'transfer.ship', entity: 'inventory_transfer', entityId: id });
    return result;
  }

  @Post('transfers/:id/receive')
  @RequirePermissions('inventory.manage')
  @ApiOperation({ summary: 'Подтвердить получение (товар появляется в принимающем филиале)' })
  async receive(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    const transfer = await this.prisma.inventoryTransfer.findFirst({
      where: { id, userId: user.id },
      include: { items: true },
    });
    if (!transfer) throw new NotFoundException('Перемещение не найдено');
    if (transfer.status !== 'shipped') throw new BadRequestException('Получить можно только отправленное перемещение');

    const result = await this.prisma.$transaction(async (tx) => {
      for (const item of transfer.items) {
        const product = await tx.product.findFirst({ where: { id: item.productId, userId: user.id } });
        if (!product) throw new BadRequestException('Товар не найден');
        const before = product.quantityReceived - product.quantitySold;
        const after = before + item.quantity;
        await tx.product.update({
          where: { id: product.id },
          data: { quantityReceived: { increment: item.quantity }, branchId: transfer.toBranchId },
        });
        await tx.stockMovement.create({
          data: {
            userId: user.id,
            productId: product.id,
            branchId: transfer.toBranchId,
            type: 'transfer_in',
            quantity: item.quantity,
            quantityBefore: before,
            quantityAfter: after,
            reason: `Получение перемещения ${transfer.transferNumber}`,
            referenceId: String(transfer.id),
            userName: user.username,
          },
        });
      }
      return tx.inventoryTransfer.update({
        where: { id },
        data: { status: 'received', receivedAt: new Date() },
        include: { items: true },
      });
    });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'transfer.receive', entity: 'inventory_transfer', entityId: id });
    return result;
  }

  @Post('transfers/:id/cancel')
  @RequirePermissions('inventory.manage')
  async cancel(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    const transfer = await this.prisma.inventoryTransfer.findFirst({ where: { id, userId: user.id } });
    if (!transfer) throw new NotFoundException('Перемещение не найдено');
    if (transfer.status !== 'draft') throw new BadRequestException('Отменить можно только черновик. Для отправленного оформите компенсирующее перемещение.');
    const updated = await this.prisma.inventoryTransfer.update({ where: { id }, data: { status: 'cancelled' } });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'transfer.cancel', entity: 'inventory_transfer', entityId: id });
    return updated;
  }

  private formatCount(c: any) {
    const items = (c.items || []).map((i: any) => ({
      id: i.id,
      productId: i.productId,
      productName: i.product?.name || '',
      barcode: i.product?.barcode || '',
      systemQuantity: i.systemQuantity,
      actualQuantity: i.actualQuantity,
      difference: i.difference,
      reason: i.reason || '',
      adjusted: i.adjusted,
    }));
    return {
      id: c.id,
      title: c.title,
      branchId: c.branchId,
      status: c.status,
      notes: c.notes || '',
      createdAt: c.createdAt,
      completedAt: c.completedAt,
      items,
      summary: {
        total: items.length,
        differences: items.filter((i: any) => i.difference !== 0).length,
        surplus: items.reduce((s: number, i: any) => s + Math.max(0, i.difference), 0),
        shortage: items.reduce((s: number, i: any) => s + Math.max(0, -i.difference), 0),
      },
    };
  }
}
