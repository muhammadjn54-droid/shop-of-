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
import { clampLimit, clampPage, intVal, money, nextNumber, toNum } from '../common/utils';

class AdjustDto {
  @IsOptional() productId?: number | string;
  @IsOptional() newQuantity?: number | string;
  @IsOptional() delta?: number | string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() type?: string;
}

class SerialDto {
  @IsOptional() productId?: number | string;
  @IsOptional() @IsString() serialNumber?: string;
  @IsOptional() @IsString() status?: string;
}

class SmartPurchaseDto {
  @IsOptional() supplierId?: number | string;
  @IsOptional() branchId?: number | string;
  @IsOptional() @IsString() notes?: string;
  @IsArray() items: Array<{ productId: number | string; quantity: number | string; costPrice?: number | string }>;
}

@ApiTags('Stock')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/stock')
export class StockController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly branches: BranchService,
  ) {}

  @Get('movements')
  @RequirePermissions('stock.read')
  @ApiOperation({ summary: 'История движения товаров' })
  async movements(
    @CurrentUser() user: CurrentUserPayload,
    @Query('productId') productId?: string,
    @Query('type') type?: string,
    @Query('branchId') branchId?: string,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = clampPage(page);
    const pageSize = clampLimit(limit, 30, 200);
    const where: any = { userId: user.id };
    if (productId) where.productId = parseInt(productId, 10);
    if (type && type !== 'all') where.type = type;
    if (branchId) where.branchId = parseInt(branchId, 10);
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(`${to}T23:59:59.999`) } : {}),
      };
    }
    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { reason: { contains: q, mode: 'insensitive' } },
        { userName: { contains: q, mode: 'insensitive' } },
        { product: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }
    const [total, rows] = await Promise.all([
      this.prisma.stockMovement.count({ where }),
      this.prisma.stockMovement.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        include: { product: { select: { name: true, barcode: true } } },
      }),
    ]);
    return {
      count: total,
      page: pageNum,
      limit: pageSize,
      results: rows.map((m) => ({
        id: m.id,
        productId: m.productId,
        productName: m.product?.name || '',
        barcode: m.product?.barcode || '',
        branchId: m.branchId,
        type: m.type,
        quantity: m.quantity,
        quantityBefore: m.quantityBefore,
        quantityAfter: m.quantityAfter,
        costPrice: m.costPrice != null ? money(toNum(m.costPrice)) : null,
        reason: m.reason || '',
        referenceId: m.referenceId,
        userName: m.userName || '',
        createdAt: m.createdAt,
      })),
    };
  }

  @Delete('movements/clear')
  @RequirePermissions('stock.adjust')
  @ApiOperation({ summary: 'Очистить историю движения товаров' })
  async clearMovements(@CurrentUser() user: CurrentUserPayload) {
    const res = await this.prisma.stockMovement.deleteMany({ where: { userId: user.id } });
    return { success: true, deleted: res.count };
  }

  @Post('adjust')
  @RequirePermissions('stock.adjust')
  @ApiOperation({ summary: 'Ручная корректировка остатка (с аудитом и движением)' })
  async adjust(@CurrentUser() user: CurrentUserPayload, @Body() dto: AdjustDto) {
    const productId = parseInt(String(dto.productId), 10);
    const product = await this.prisma.product.findFirst({ where: { id: productId, userId: user.id } });
    if (!product) throw new NotFoundException('Товар не найден');
    if (!dto.reason || !dto.reason.trim()) throw new BadRequestException('Укажите причину корректировки');

    const before = product.quantityReceived - product.quantitySold;
    let after: number;
    if (dto.newQuantity !== undefined && dto.newQuantity !== null && String(dto.newQuantity) !== '') {
      after = Math.max(0, Math.floor(toNum(dto.newQuantity)));
    } else {
      after = Math.max(0, before + Math.floor(toNum(dto.delta)));
    }
    const delta = after - before;
    if (delta === 0) throw new BadRequestException('Остаток не изменился');

    const type = dto.type || (delta > 0 ? 'manual_increase' : 'manual_decrease');
    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id: product.id },
        data: { quantityReceived: { increment: delta } },
      });
      await tx.stockMovement.create({
        data: {
          userId: user.id,
          productId: product.id,
          branchId: product.branchId,
          type,
          quantity: delta,
          quantityBefore: before,
          quantityAfter: after,
          costPrice: toNum(product.purchasePrice),
          sellingPrice: toNum(product.sellingPrice),
          reason: dto.reason!.trim(),
          userName: user.username,
        },
      });
      return p;
    });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'stock.adjust', entity: 'product', entityId: product.id, details: { before, after, delta, reason: dto.reason, type } });
    return { success: true, productId: product.id, before, after, delta, type };
  }

  @Get('batches')
  @RequirePermissions('stock.read')
  async batches(@CurrentUser() user: CurrentUserPayload, @Query('productId') productId?: string) {
    const where: any = { product: { userId: user.id } };
    if (productId) where.productId = parseInt(productId, 10);
    return this.prisma.productBatch.findMany({
      where,
      orderBy: [{ expiryDate: 'asc' }, { id: 'desc' }],
      include: { product: { select: { name: true, barcode: true } } },
    });
  }

  @Get('expiry')
  @RequirePermissions('stock.read')
  @ApiOperation({ summary: 'Товары и партии с истекающим сроком годности' })
  async expiry(@CurrentUser() user: CurrentUserPayload, @Query('days') days?: string) {
    const horizon = Math.max(1, intVal(days, 30));
    const until = new Date(Date.now() + horizon * 24 * 60 * 60 * 1000);
    const [products, batches] = await Promise.all([
      this.prisma.product.findMany({
        where: { userId: user.id, expiryDate: { not: null, lte: until } },
        orderBy: { expiryDate: 'asc' },
      }),
      this.prisma.productBatch.findMany({
        where: { product: { userId: user.id }, expiryDate: { not: null, lte: until }, quantity: { gt: 0 } },
        orderBy: { expiryDate: 'asc' },
        include: { product: { select: { name: true, barcode: true } } },
      }),
    ]);
    const now = Date.now();
    const items = [
      ...products.map((p) => ({
        kind: 'product',
        productId: p.id,
        name: p.name,
        barcode: p.barcode,
        expiryDate: p.expiryDate,
        remaining: p.quantityReceived - p.quantitySold,
        daysLeft: Math.ceil(((p.expiryDate as Date).getTime() - now) / 86400000),
      })),
      ...batches.map((b) => ({
        kind: 'batch',
        batchId: b.id,
        batchNumber: b.batchNumber,
        productId: b.productId,
        name: b.product?.name || '',
        barcode: b.product?.barcode || '',
        expiryDate: b.expiryDate,
        remaining: b.quantity,
        daysLeft: Math.ceil(((b.expiryDate as Date).getTime() - now) / 86400000),
      })),
    ].sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
    return { days: horizon, count: items.length, results: items };
  }

  @Get('serials')
  @RequirePermissions('stock.read')
  async serials(@CurrentUser() user: CurrentUserPayload, @Query('productId') productId?: string) {
    const where: any = { product: { userId: user.id } };
    if (productId) where.productId = parseInt(productId, 10);
    return this.prisma.productSerial.findMany({
      where,
      orderBy: { id: 'desc' },
      take: 500,
      include: { product: { select: { name: true, barcode: true } } },
    });
  }

  @Post('serials')
  @RequirePermissions('products.write')
  async addSerial(@CurrentUser() user: CurrentUserPayload, @Body() dto: SerialDto) {
    const productId = parseInt(String(dto.productId), 10);
    const product = await this.prisma.product.findFirst({ where: { id: productId, userId: user.id } });
    if (!product) throw new NotFoundException('Товар не найден');
    const serialNumber = (dto.serialNumber || '').trim();
    if (!serialNumber) throw new BadRequestException('Укажите серийный номер');
    const serial = await this.prisma.productSerial.create({
      data: { productId, serialNumber, status: dto.status || 'in_stock', branchId: product.branchId },
    });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'serial.create', entity: 'product_serial', entityId: serial.id, details: { serialNumber } });
    return serial;
  }

  @Patch('serials/:id')
  @RequirePermissions('products.write')
  async updateSerial(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SerialDto,
  ) {
    const serial = await this.prisma.productSerial.findFirst({ where: { id, product: { userId: user.id } } });
    if (!serial) throw new NotFoundException('Серийный номер не найден');
    return this.prisma.productSerial.update({
      where: { id },
      data: { ...(dto.status ? { status: dto.status } : {}), ...(dto.serialNumber ? { serialNumber: dto.serialNumber.trim() } : {}) },
    });
  }

  @Get('summary')
  @RequirePermissions('stock.read')
  async summary(@CurrentUser() user: CurrentUserPayload) {
    const products = await this.prisma.product.findMany({ where: { userId: user.id } });
    let stockValueCost = 0;
    let stockValueRetail = 0;
    let totalRemaining = 0;
    let lowCount = 0;
    let outCount = 0;
    for (const p of products) {
      const remaining = p.quantityReceived - p.quantitySold;
      totalRemaining += remaining;
      stockValueCost += remaining * toNum(p.purchasePrice);
      stockValueRetail += remaining * toNum(p.sellingPrice);
      if (remaining <= 0) outCount++;
      else if (remaining <= p.minStock) lowCount++;
    }
    return {
      products: products.length,
      totalRemaining,
      stockValueCost: money(stockValueCost),
      stockValueRetail: money(stockValueRetail),
      potentialProfit: money(stockValueRetail - stockValueCost),
      lowCount,
      outCount,
    };
  }

  @Get('smart')
  @RequirePermissions('stock.read')
  @ApiOperation({ summary: 'Smart Stock: рекомендации по закупке на основе реальных продаж' })
  async smart(
    @CurrentUser() user: CurrentUserPayload,
    @Query('category') category?: string,
    @Query('supplierId') supplierId?: string,
    @Query('branchId') branchId?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('lookback') lookback?: string,
  ) {
    const days = Math.max(7, Math.min(180, intVal(lookback, 30)));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const productWhere: any = { userId: user.id };
    if (category && category !== 'all') productWhere.category = category;
    if (supplierId) productWhere.supplierId = parseInt(supplierId, 10);
    if (branchId) productWhere.branchId = parseInt(branchId, 10);
    if (search?.trim()) {
      const q = search.trim();
      productWhere.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { barcode: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [products, orders, pending] = await Promise.all([
      this.prisma.product.findMany({ where: productWhere, include: { supplier: { select: { id: true, name: true } } } }),
      this.prisma.order.findMany({
        where: { userId: user.id, createdAt: { gte: since } },
        select: { id: true, isReturn: true, items: { select: { productId: true, quantity: true } } },
      }),
      this.prisma.purchaseOrderItem.findMany({
        where: {
          purchase: { userId: user.id, status: { in: ['ordered', 'partially_received', 'partially_paid'] } },
        },
        select: { productId: true, quantity: true, receivedQuantity: true },
      }),
    ]);

    const soldMap = new Map<number, number>();
    for (const order of orders) {
      for (const item of order.items) {
        if (!item.productId) continue;
        const qty = order.isReturn ? -item.quantity : item.quantity;
        soldMap.set(item.productId, (soldMap.get(item.productId) || 0) + qty);
      }
    }
    const pendingMap = new Map<number, number>();
    for (const p of pending) {
      if (!p.productId) continue;
      pendingMap.set(p.productId, (pendingMap.get(p.productId) || 0) + Math.max(0, p.quantity - p.receivedQuantity));
    }

    const results = products.map((p) => {
      const remaining = Math.max(0, p.quantityReceived - p.quantitySold);
      const sold = Math.max(0, soldMap.get(p.id) || 0);
      const avgDaily = sold / days;
      const lead = Math.max(0, p.leadTimeDays || 3);
      const pendingQty = pendingMap.get(p.id) || 0;
      const safety = Math.max(p.minStock || 0, Math.ceil(avgDaily * Math.max(1, lead) * 0.3));
      let target = Math.ceil(avgDaily * Math.max(1, lead)) + safety;
      target = Math.max(target, p.minStock || 0);
      if (p.maxStock && target > p.maxStock) target = p.maxStock;
      const recommended = Math.max(0, target - remaining - pendingQty);
      const daysLeft = avgDaily > 0 ? Math.round((remaining / avgDaily) * 10) / 10 : null;

      let priority: 'normal' | 'high' | 'critical' = 'normal';
      if (remaining <= 0) priority = 'critical';
      else if (avgDaily > 0 && daysLeft !== null && daysLeft <= lead) priority = 'critical';
      else if (remaining <= p.minStock || (avgDaily > 0 && daysLeft !== null && daysLeft <= lead * 2)) priority = 'high';

      const reasonParts: string[] = [];
      if (remaining <= p.minStock) reasonParts.push(`остаток ${remaining} ≤ минимума ${p.minStock}`);
      if (avgDaily > 0) reasonParts.push(`средние продажи ${avgDaily.toFixed(2)}/день за ${days} дн.`);
      if (daysLeft !== null) reasonParts.push(`хватит примерно на ${daysLeft} дн.`);
      if (pendingQty > 0) reasonParts.push(`уже заказано ${pendingQty}`);
      if (recommended > 0) reasonParts.push(`рекомендуется закупить ${recommended}`);
      else reasonParts.push('запас достаточен');

      return {
        productId: p.id,
        name: p.name,
        barcode: p.barcode,
        category: p.category,
        branchId: p.branchId,
        supplierId: p.supplierId,
        supplierName: p.supplier?.name || '',
        remaining,
        minStock: p.minStock,
        maxStock: p.maxStock,
        leadTimeDays: lead,
        avgDailySales: Math.round(avgDaily * 100) / 100,
        soldInPeriod: Math.round(sold * 100) / 100,
        daysLeft,
        pendingQuantity: pendingQty,
        targetStock: target,
        recommendedQuantity: recommended,
        priority,
        purchasePrice: money(toNum(p.purchasePrice)),
        estimatedCost: money(recommended * toNum(p.purchasePrice)),
        reason: reasonParts.join('; '),
      };
    });

    const filtered = priority && priority !== 'all' ? results.filter((r) => r.priority === priority) : results;
    filtered.sort((a, b) => {
      const rank = { critical: 0, high: 1, normal: 2 };
      return rank[a.priority] - rank[b.priority] || b.recommendedQuantity - a.recommendedQuantity;
    });
    return {
      lookbackDays: days,
      count: filtered.length,
      summary: {
        critical: results.filter((r) => r.priority === 'critical').length,
        high: results.filter((r) => r.priority === 'high').length,
        recommended: results.filter((r) => r.recommendedQuantity > 0).length,
        estimatedCost: money(results.reduce((s, r) => s + r.estimatedCost, 0)),
      },
      results: filtered,
    };
  }

  @Post('smart/purchase')
  @RequirePermissions('purchases.write')
  @ApiOperation({ summary: 'Создать черновик закупки из рекомендаций Smart Stock' })
  async createSmartPurchase(@CurrentUser() user: CurrentUserPayload, @Body() dto: SmartPurchaseDto) {
    const supplierId = parseInt(String(dto.supplierId), 10);
    const supplier = await this.prisma.supplier.findFirst({ where: { id: supplierId, userId: user.id } });
    if (!supplier) throw new BadRequestException('Выберите поставщика');
    if (!dto.items?.length) throw new BadRequestException('Выберите товары для закупки');
    const branchId = await this.branches.resolveBranchId(user.id, dto.branchId ? parseInt(String(dto.branchId), 10) : null);
    const items: any[] = [];
    for (const raw of dto.items) {
      const productId = parseInt(String(raw.productId), 10);
      const product = await this.prisma.product.findFirst({ where: { id: productId, userId: user.id } });
      if (!product) throw new BadRequestException(`Товар #${productId} не найден`);
      const quantity = Math.max(1, Math.floor(toNum(raw.quantity)));
      const costPrice = money(toNum(raw.costPrice, toNum(product.purchasePrice)));
      items.push({ productId, productName: product.name, quantity, costPrice, total: money(quantity * costPrice) });
    }
    const total = items.reduce((s, i) => s + i.total, 0);
    const purchase = await this.prisma.purchaseOrder.create({
      data: {
        purchaseNumber: nextNumber('PO'),
        userId: user.id,
        supplierId,
        branchId,
        status: 'draft',
        totalAmount: total,
        notes: dto.notes?.trim() || 'Создано из рекомендаций Smart Stock',
        items: { create: items },
      },
      include: { supplier: true, items: true },
    });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'purchase.create_smart', entity: 'purchase', entityId: purchase.id, details: { total } });
    return purchase;
  }

  @Get('low-stock')
  @RequirePermissions('stock.read')
  async lowStock(@CurrentUser() user: CurrentUserPayload) {
    const products = await this.prisma.product.findMany({ where: { userId: user.id } });
    const results = products
      .map((p) => ({
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        category: p.category,
        remaining: p.quantityReceived - p.quantitySold,
        minStock: p.minStock,
        supplierId: p.supplierId,
      }))
      .filter((p) => p.remaining <= p.minStock)
      .sort((a, b) => a.remaining - b.remaining);
    return { count: results.length, results };
  }
}
