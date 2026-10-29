import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
import { NotificationsService } from '../common/notifications.service';
import { BranchService } from '../common/branch.service';
import { PermissionsGuard, RequirePermissions } from '../common/permissions.guard';
import { clampLimit, clampPage, money, nextNumber, toNum } from '../common/utils';

class PurchaseItemDto {
  @IsOptional() productId?: number | string;
  @IsOptional() @IsString() productName?: string;
  @IsOptional() quantity?: number | string;
  @IsOptional() costPrice?: number | string;
}

class CreatePurchaseDto {
  @IsOptional() supplierId?: number | string;
  @IsOptional() branchId?: number | string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() status?: string;
  @IsArray() items: PurchaseItemDto[];
}

class ReceiveDto {
  @IsOptional() @IsArray() items?: Array<{ itemId: number | string; quantity: number | string }>;
  @IsOptional() @IsString() note?: string;
}

class PurchasePaymentDto {
  @IsOptional() amount?: number | string;
  @IsOptional() @IsString() paymentMethod?: string;
  @IsOptional() @IsString() note?: string;
}

@ApiTags('Purchases')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/purchases')
export class PurchasesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly branches: BranchService,
  ) {}

  @Get()
  @RequirePermissions('purchases.read')
  @ApiOperation({ summary: 'Список закупок с фильтрами' })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('supplierId') supplierId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = clampPage(page);
    const pageSize = clampLimit(limit, 20, 100);
    const where: any = { userId: user.id };
    if (status && status !== 'all') where.status = status;
    if (supplierId) where.supplierId = parseInt(supplierId, 10);
    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { purchaseNumber: { contains: q, mode: 'insensitive' } },
        { supplier: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }
    const [total, rows] = await Promise.all([
      this.prisma.purchaseOrder.count({ where }),
      this.prisma.purchaseOrder.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        include: { supplier: true, items: true },
      }),
    ]);
    return {
      count: total,
      page: pageNum,
      limit: pageSize,
      results: rows.map((p) => this.format(p)),
    };
  }

  @Get(':id')
  @RequirePermissions('purchases.read')
  async findOne(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    const purchase = await this.prisma.purchaseOrder.findFirst({
      where: { id, userId: user.id },
      include: { supplier: true, items: { include: { product: { select: { name: true, barcode: true } } } } },
    });
    if (!purchase) throw new NotFoundException('Закупка не найдена');
    return this.format(purchase);
  }

  @Post()
  @RequirePermissions('purchases.write')
  @ApiOperation({ summary: 'Создать черновик закупки' })
  async create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreatePurchaseDto) {
    const supplierId = parseInt(String(dto.supplierId), 10);
    if (!supplierId) throw new BadRequestException('Выберите поставщика');
    const supplier = await this.prisma.supplier.findFirst({ where: { id: supplierId, userId: user.id } });
    if (!supplier) throw new BadRequestException('Поставщик не найден');
    if (!Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('Добавьте хотя бы один товар');
    }
    const branchId = dto.branchId ? await this.branches.resolveBranchId(user.id, parseInt(String(dto.branchId), 10)) : await this.branches.resolveBranchId(user.id);
    const items = await this.buildItems(user.id, dto.items);
    const total = items.reduce((sum, i) => sum + i.total, 0);

    const purchase = await this.prisma.purchaseOrder.create({
      data: {
        purchaseNumber: nextNumber('PO'),
        userId: user.id,
        supplierId,
        branchId,
        status: dto.status === 'ordered' ? 'ordered' : 'draft',
        totalAmount: total,
        notes: dto.notes?.trim() || null,
        items: { create: items },
      },
      include: { supplier: true, items: true },
    });

    if (purchase.status === 'ordered') {
      await this.prisma.supplier.update({ where: { id: supplierId }, data: { totalDebt: { increment: total } } });
    }
    await this.audit.log({ userId: user.id, userName: user.username, action: 'purchase.create', entity: 'purchase', entityId: purchase.id, details: { total, supplierId } });
    return this.format(purchase);
  }

  @Patch(':id')
  @RequirePermissions('purchases.write')
  @ApiOperation({ summary: 'Обновить черновик закупки' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreatePurchaseDto>,
  ) {
    const existing = await this.prisma.purchaseOrder.findFirst({ where: { id, userId: user.id }, include: { items: true } });
    if (!existing) throw new NotFoundException('Закупка не найдена');
    if (existing.status !== 'draft') throw new BadRequestException('Редактировать можно только черновик');

    const supplierId = dto.supplierId ? parseInt(String(dto.supplierId), 10) : existing.supplierId;
    if (dto.supplierId) {
      const supplier = await this.prisma.supplier.findFirst({ where: { id: supplierId, userId: user.id } });
      if (!supplier) throw new BadRequestException('Поставщик не найден');
    }
    const items = dto.items ? await this.buildItems(user.id, dto.items) : null;
    const total = items ? items.reduce((sum, i) => sum + i.total, 0) : toNum(existing.totalAmount);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (items) {
        await tx.purchaseOrderItem.deleteMany({ where: { purchaseId: id } });
      }
      return tx.purchaseOrder.update({
        where: { id },
        data: {
          supplierId,
          totalAmount: total,
          ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
          ...(dto.branchId ? { branchId: await this.branches.resolveBranchId(user.id, parseInt(String(dto.branchId), 10)) } : {}),
          ...(items ? { items: { create: items } } : {}),
        },
        include: { supplier: true, items: true },
      });
    });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'purchase.update', entity: 'purchase', entityId: id, details: { total } });
    return this.format(updated);
  }

  @Post(':id/order')
  @RequirePermissions('purchases.write')
  @ApiOperation({ summary: 'Подтвердить заказ поставщику (draft -> ordered)' })
  async order(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    const purchase = await this.prisma.purchaseOrder.findFirst({ where: { id, userId: user.id } });
    if (!purchase) throw new NotFoundException('Закупка не найдена');
    if (purchase.status !== 'draft') throw new BadRequestException('Подтвердить можно только черновик');
    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.purchaseOrder.update({ where: { id }, data: { status: 'ordered' } });
      await tx.supplier.update({ where: { id: purchase.supplierId }, data: { totalDebt: { increment: toNum(purchase.totalAmount) } } });
      return p;
    });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'purchase.order', entity: 'purchase', entityId: id });
    return updated;
  }

  @Post(':id/receive')
  @RequirePermissions('purchases.write')
  @ApiOperation({ summary: 'Зарегистрировать фактическое поступление товара (ровно один раз на партию)' })
  async receive(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReceiveDto,
  ) {
    const purchase = await this.prisma.purchaseOrder.findFirst({
      where: { id, userId: user.id },
      include: { items: true },
    });
    if (!purchase) throw new NotFoundException('Закупка не найдена');
    if (!['ordered', 'partially_received'].includes(purchase.status)) {
      throw new BadRequestException('Поступление возможно только для заказанной закупки');
    }

    const requested = new Map<number, number>();
    if (dto.items && dto.items.length > 0) {
      for (const raw of dto.items) {
        const itemId = parseInt(String(raw.itemId), 10);
        const qty = Math.max(0, Math.floor(toNum(raw.quantity)));
        if (!itemId || qty <= 0) continue;
        requested.set(itemId, (requested.get(itemId) || 0) + qty);
      }
    } else {
      for (const item of purchase.items) {
        const remaining = item.quantity - item.receivedQuantity;
        if (remaining > 0) requested.set(item.id, remaining);
      }
    }

    if (requested.size === 0) throw new BadRequestException('Нет позиций для поступления (возможно, закупка уже получена)');

    for (const [itemId, qty] of requested) {
      const item = purchase.items.find((i) => i.id === itemId);
      if (!item) throw new BadRequestException(`Позиция ${itemId} не принадлежит закупке`);
      if (qty > item.quantity - item.receivedQuantity) {
        throw new BadRequestException(`По «${item.productName}» нельзя получить больше заказанного остатка`);
      }
      if (!item.productId) throw new BadRequestException(`Для позиции «${item.productName}» не указан товар склада`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      for (const [itemId, qty] of requested) {
        const item = purchase.items.find((i) => i.id === itemId)!;
        const product = await tx.product.findFirst({ where: { id: item.productId!, userId: user.id } });
        if (!product) throw new BadRequestException(`Товар позиции «${item.productName}» не найден`);

        const before = product.quantityReceived - product.quantitySold;
        const after = before + qty;
        await tx.product.update({
          where: { id: product.id },
          data: {
            quantityReceived: { increment: qty },
            purchasePrice: toNum(item.costPrice),
            ...(product.branchId ? {} : { branchId: purchase.branchId }),
          },
        });
        await tx.stockMovement.create({
          data: {
            userId: user.id,
            productId: product.id,
            branchId: purchase.branchId,
            type: 'purchase_receipt',
            quantity: qty,
            quantityBefore: before,
            quantityAfter: after,
            costPrice: toNum(item.costPrice),
            sellingPrice: toNum(product.sellingPrice),
            reason: `Поступление по закупке ${purchase.purchaseNumber}`,
            referenceId: String(purchase.id),
            userName: user.username,
          },
        });
        if (product.hasBatches || product.expiryDate) {
          await tx.productBatch.create({
            data: {
              productId: product.id,
              batchNumber: `${purchase.purchaseNumber}-${item.id}`,
              quantity: qty,
              purchasePrice: toNum(item.costPrice),
              sellingPrice: toNum(product.sellingPrice),
              expiryDate: product.expiryDate,
            },
          });
        }
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { receivedQuantity: { increment: qty } },
        });
      }

      const items = await tx.purchaseOrderItem.findMany({ where: { purchaseId: id } });
      const fully = items.every((i) => i.receivedQuantity >= i.quantity);
      const partial = items.some((i) => i.receivedQuantity > 0);
      const status = fully ? 'received' : partial ? 'partially_received' : purchase.status;
      return tx.purchaseOrder.update({
        where: { id },
        data: { status, receivedAt: purchase.receivedAt || now },
        include: { supplier: true, items: true },
      });
    });

    await this.audit.log({
      userId: user.id,
      userName: user.username,
      action: 'purchase.receive',
      entity: 'purchase',
      entityId: id,
      details: { items: [...requested.entries()] },
    });
    await this.notifications.create({
      userId: user.id,
      type: 'purchase',
      title: 'Поступление товара',
      message: `Закупка ${purchase.purchaseNumber}: товар оприходован на склад.`,
      link: '/purchases',
      dedupe: false,
    });
    return this.format(result);
  }

  @Post(':id/payments')
  @RequirePermissions('suppliers.write')
  @ApiOperation({ summary: 'Оплата поставщику по закупке' })
  async pay(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PurchasePaymentDto,
  ) {
    const purchase = await this.prisma.purchaseOrder.findFirst({ where: { id, userId: user.id }, include: { supplier: true } });
    if (!purchase) throw new NotFoundException('Закупка не найдена');
    if (purchase.status === 'cancelled') throw new BadRequestException('Нельзя оплатить отменённую закупку');
    const amount = money(toNum(dto.amount));
    if (amount <= 0) throw new BadRequestException('Сумма платежа должна быть больше нуля');
    const remaining = Math.max(0, toNum(purchase.totalAmount) - toNum(purchase.paidAmount));
    if (amount > remaining + 0.009) throw new BadRequestException(`Сумма превышает остаток по закупке (${money(remaining)})`);

    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.supplierPayment.create({
        data: {
          supplierId: purchase.supplierId,
          amount,
          paymentMethod: (dto.paymentMethod || 'cash').trim(),
          note: dto.note?.trim() || `Оплата по ${purchase.purchaseNumber}`,
          createdBy: user.username,
        },
      });
      const paid = toNum(purchase.paidAmount) + amount;
      await tx.purchaseOrder.update({
        where: { id },
        data: {
          paidAmount: paid,
          status: paid >= toNum(purchase.totalAmount) ? (purchase.status === 'received' ? 'received' : purchase.status) : 'partially_paid',
        },
      });
      await tx.supplier.update({
        where: { id: purchase.supplierId },
        data: { totalPaid: { increment: amount }, totalDebt: { decrement: amount } },
      });
      return payment;
    });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'purchase.payment', entity: 'purchase', entityId: id, details: { amount } });
    return result;
  }

  @Post(':id/cancel')
  @RequirePermissions('purchases.write')
  @ApiOperation({ summary: 'Отменить закупку (только до поступления)' })
  async cancel(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    const purchase = await this.prisma.purchaseOrder.findFirst({ where: { id, userId: user.id } });
    if (!purchase) throw new NotFoundException('Закупка не найдена');
    if (['received', 'partially_received', 'cancelled'].includes(purchase.status)) {
      throw new BadRequestException('Отмена возможна только до фактического поступления. Оформите компенсирующие операции.');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      if (purchase.status === 'ordered' || purchase.status === 'partially_paid') {
        const outstanding = Math.max(0, toNum(purchase.totalAmount) - toNum(purchase.paidAmount));
        if (outstanding > 0) {
          await tx.supplier.update({ where: { id: purchase.supplierId }, data: { totalDebt: { decrement: outstanding } } });
        }
      }
      return tx.purchaseOrder.update({ where: { id }, data: { status: 'cancelled' } });
    });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'purchase.cancel', entity: 'purchase', entityId: id });
    return updated;
  }

  @Delete(':id')
  @RequirePermissions('purchases.write')
  async remove(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    const purchase = await this.prisma.purchaseOrder.findFirst({ where: { id, userId: user.id } });
    if (!purchase) throw new NotFoundException('Закупка не найдена');
    if (purchase.status !== 'draft') throw new BadRequestException('Удалить можно только черновик');
    await this.prisma.purchaseOrder.delete({ where: { id } });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'purchase.delete', entity: 'purchase', entityId: id });
    return { success: true };
  }

  private async buildItems(userId: number, raw: PurchaseItemDto[]) {
    const result: Array<{ productId: number | null; productName: string; quantity: number; costPrice: number; total: number }> = [];
    for (const item of raw) {
      const productId = item.productId ? parseInt(String(item.productId), 10) : null;
      let name = item.productName?.trim() || '';
      let product: any = null;
      if (productId) {
        product = await this.prisma.product.findFirst({ where: { id: productId, userId } });
        if (!product) throw new BadRequestException(`Товар #${productId} не найден`);
        name = name || product.name;
      }
      if (!name) throw new BadRequestException('Укажите название или товар для каждой позиции');
      const quantity = Math.max(1, Math.floor(toNum(item.quantity, 1)));
      const costPrice = money(toNum(item.costPrice, product ? toNum(product.purchasePrice) : 0));
      result.push({ productId: productId || null, productName: name, quantity, costPrice, total: money(quantity * costPrice) });
    }
    return result;
  }

  private format(p: any) {
    const items = (p.items || []).map((i: any) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      barcode: i.product?.barcode || null,
      quantity: i.quantity,
      receivedQuantity: i.receivedQuantity,
      remainingQuantity: Math.max(0, i.quantity - i.receivedQuantity),
      costPrice: money(toNum(i.costPrice)),
      total: money(toNum(i.total)),
    }));
    return {
      id: p.id,
      purchaseNumber: p.purchaseNumber,
      supplierId: p.supplierId,
      supplierName: p.supplier?.name || '',
      branchId: p.branchId,
      status: p.status,
      totalAmount: money(toNum(p.totalAmount)),
      paidAmount: money(toNum(p.paidAmount)),
      remainingAmount: money(Math.max(0, toNum(p.totalAmount) - toNum(p.paidAmount))),
      notes: p.notes || '',
      receivedAt: p.receivedAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      items,
    };
  }
}
