import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { PermissionsGuard, RequirePermissions } from '../common/permissions.guard';
import { clampLimit, clampPage, money, toNum } from '../common/utils';

class SyncDto {
  @IsArray() operations: Array<{ clientTransactionId: string; type: 'sale' | 'return'; payload: any }>;
}

@ApiTags('Offline Sync')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/sync')
export class SyncController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
  ) {}

  @Get('bootstrap')
  @RequirePermissions('pos')
  @ApiOperation({ summary: 'Данные для офлайн-режима кассы' })
  async bootstrap(@CurrentUser() user: CurrentUserPayload) {
    const [products, categories, customers, settings, shift, branches] = await Promise.all([
      this.prisma.product.findMany({ where: { userId: user.id }, orderBy: { name: 'asc' } }),
      this.prisma.category.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.customer.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
        take: 1000,
        select: { id: true, name: true, phone: true, bonusPoints: true, discountPercent: true, totalDebt: true },
      }),
      this.prisma.appSetting.findMany({ where: { userId: user.id } }),
      this.prisma.cashierShift.findFirst({ where: { userId: user.id, status: 'open' }, orderBy: { id: 'desc' } }),
      this.prisma.branch.findMany({ where: { userId: user.id } }),
    ]);
    const settingsMap: Record<string, string> = {};
    for (const s of settings) settingsMap[s.key] = s.value;
    return {
      serverTime: new Date().toISOString(),
      version: Date.now(),
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        category: p.category,
        purchase_price: money(toNum(p.purchasePrice)),
        selling_price: money(toNum(p.sellingPrice)),
        quantity_received: p.quantityReceived,
        quantity_sold: p.quantitySold,
        remaining_quantity: Math.max(0, p.quantityReceived - p.quantitySold),
        min_stock: p.minStock,
        lead_time_days: p.leadTimeDays,
        expiry_date: p.expiryDate,
        supplier_id: p.supplierId,
        branch_id: p.branchId,
        image: p.file || null,
        file: p.file,
      })),
      categories: categories.length
        ? categories.map((c) => ({ id: c.key, labelRu: c.nameRu, labelTg: c.nameTg, labelEn: c.nameEn, icon: c.icon }))
        : [
            { id: 'stationery', labelRu: 'Канцтовары', labelTg: 'Конставар', labelEn: 'Stationery', icon: '✏️' },
            { id: 'toys', labelRu: 'Игрушки', labelTg: 'Игрушка', labelEn: 'Toys', icon: '🧸' },
            { id: 'perfumery', labelRu: 'Парфюмерия', labelTg: 'Порфимерия', labelEn: 'Perfumery', icon: '🧴' },
            { id: 'accessories', labelRu: 'Аксессуары', labelTg: 'Зарядмонакҳо', labelEn: 'Accessories', icon: '🔌' },
          ],
      customers: customers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone || '',
        bonus_points: c.bonusPoints,
        discount_percent: toNum(c.discountPercent),
        total_debt: money(toNum(c.totalDebt)),
      })),
      settings: {
        shop_name: settingsMap.shop_name || 'Мой магазин',
        currency: settingsMap.currency || 'TJS',
        receipt_footer: settingsMap.receipt_footer || 'Спасибо за покупку!',
        loyalty_point_value: toNum(settingsMap.loyalty_point_value || '0.01'),
        loyalty_points_per_unit: toNum(settingsMap.loyalty_points_per_unit || '0.1'),
      },
      shift: shift ? { id: shift.id, openedAt: shift.openedAt, openingCash: money(toNum(shift.openingCash)) } : null,
      branches,
      user: { id: user.id, username: user.username, role: user.role || 'owner' },
    };
  }

  @Get('offline')
  @RequirePermissions('sales.read')
  async list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = clampPage(page);
    const pageSize = clampLimit(limit, 50, 200);
    const where: any = { userId: user.id };
    if (status && status !== 'all') where.status = status;
    const [total, rows] = await Promise.all([
      this.prisma.offlineSyncOperation.count({ where }),
      this.prisma.offlineSyncOperation.findMany({ where, orderBy: { id: 'desc' }, skip: (pageNum - 1) * pageSize, take: pageSize }),
    ]);
    return {
      count: total,
      page: pageNum,
      limit: pageSize,
      results: rows.map((o) => ({
        id: o.id,
        clientTransactionId: o.clientTransactionId,
        status: o.status,
        error: o.error || '',
        payload: o.payload,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      })),
    };
  }

  @Post('offline')
  @RequirePermissions('pos')
  @ApiOperation({ summary: 'Синхронизировать офлайн-операции (продажи/возвраты)' })
  async sync(@CurrentUser() user: CurrentUserPayload, @Body() dto: SyncDto) {
    if (!dto.operations?.length) throw new BadRequestException('Нет операций для синхронизации');
    if (dto.operations.length > 200) throw new BadRequestException('Максимум 200 операций за один запрос');
    const results: Array<{ clientTransactionId: string; status: string; orderId?: number; duplicate?: boolean; error?: string }> = [];

    for (const op of dto.operations) {
      const clientTransactionId = (op.clientTransactionId || '').trim();
      if (!clientTransactionId) {
        results.push({ clientTransactionId: '', status: 'failed', error: 'Не указан clientTransactionId' });
        continue;
      }
      if (op.type !== 'sale' && op.type !== 'return') {
        results.push({ clientTransactionId, status: 'failed', error: `Неизвестный тип операции: ${op.type}` });
        continue;
      }
      try {
        const existingOp = await this.prisma.offlineSyncOperation.findUnique({ where: { clientTransactionId } });
        if (existingOp && existingOp.userId !== user.id) {
          results.push({ clientTransactionId, status: 'failed', error: 'Конфликт идентификатора операции' });
          continue;
        }
        if (existingOp?.status === 'succeeded') {
          const order = await this.prisma.order.findFirst({
            where: { clientTransactionId, userId: user.id },
          });
          results.push({ clientTransactionId, status: 'succeeded', orderId: order?.id, duplicate: true });
          continue;
        }
        if (existingOp) {
          await this.prisma.offlineSyncOperation.updateMany({
            where: { id: existingOp.id, userId: user.id },
            data: { status: 'processing', payload: op.payload as any, error: null },
          });
        } else {
          await this.prisma.offlineSyncOperation.create({
            data: { userId: user.id, clientTransactionId, status: 'processing', payload: op.payload as any },
          });
        }

        let order: any;
        if (op.type === 'sale') {
          const result = await this.orders.checkout(user, { ...op.payload, clientTransactionId, isOffline: true });
          order = result.order;
        } else {
          const parentId = parseInt(String(op.payload?.orderId ?? op.payload?.parentOrderId), 10);
          if (!parentId) throw new BadRequestException('Для возврата укажите orderId исходной продажи');
          const result = await this.orders.returnOrder(user, parentId, { ...op.payload, clientTransactionId });
          order = result.order;
        }
        await this.prisma.offlineSyncOperation.updateMany({
          where: { clientTransactionId, userId: user.id },
          data: { status: 'succeeded', error: null },
        });
        results.push({ clientTransactionId, status: 'succeeded', orderId: order.id });
      } catch (err) {
        const message = (err as Error).message || 'Ошибка синхронизации';
        await this.prisma.offlineSyncOperation.updateMany({
          where: { clientTransactionId, userId: user.id },
          data: { status: 'failed', error: message, payload: op.payload as any },
        });
        results.push({ clientTransactionId, status: 'failed', error: message });
      }
    }

    return {
      total: results.length,
      succeeded: results.filter((r) => r.status === 'succeeded').length,
      failed: results.filter((r) => r.status === 'failed').length,
      results,
    };
  }

  @Post('offline/:id/retry')
  @RequirePermissions('pos')
  async retry(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    const op = await this.prisma.offlineSyncOperation.findFirst({ where: { id, userId: user.id } });
    if (!op) throw new NotFoundException('Операция не найдена');
    if (op.status === 'succeeded') return { success: true, message: 'Операция уже синхронизирована' };
    const payload = op.payload as any;
    const type = payload?.type || (payload?.parentOrderId || payload?.orderId ? 'return' : 'sale');
    const result = await this.sync(user, {
      operations: [{ clientTransactionId: op.clientTransactionId, type: type === 'return' ? 'return' : 'sale', payload }],
    });
    return result;
  }

  @Delete('offline/:id')
  @RequirePermissions('pos')
  async remove(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    await this.prisma.offlineSyncOperation.deleteMany({ where: { id, userId: user.id, status: 'failed' } });
    return { success: true };
  }
}
