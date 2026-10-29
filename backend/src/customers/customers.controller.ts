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
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { PermissionsGuard, RequirePermissions } from '../common/permissions.guard';
import { clampLimit, clampPage, money, toNum } from '../common/utils';

class CustomerDto {
  @IsString() name: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() discountPercent?: number | string;
}

class LoyaltyDto {
  @IsOptional() points?: number | string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() description?: string;
}

@ApiTags('Customers')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/customers')
export class CustomersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermissions('customers.read')
  async list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('withDebt') withDebt?: string,
    @Query('sort') sort?: string,
  ) {
    const pageNum = clampPage(page);
    const pageSize = clampLimit(limit, 30, 200);
    const where: any = { userId: user.id };
    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (withDebt === 'true') where.totalDebt = { gt: 0 };
    const orderBy: any = sort === 'debt' ? { totalDebt: 'desc' } : sort === 'purchases' ? { totalPurchases: 'desc' } : { id: 'desc' };
    const [total, rows] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        orderBy,
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { orders: true } },
          orders: { orderBy: { id: 'desc' }, take: 1, select: { createdAt: true } },
        },
      }),
    ]);
    return {
      count: total,
      page: pageNum,
      limit: pageSize,
      results: rows.map((c) => ({
        ...this.format(c),
        orderCount: c._count.orders,
        lastVisit: c.orders[0]?.createdAt || null,
      })),
    };
  }

  @Get('stats')
  @RequirePermissions('customers.read')
  async stats(@CurrentUser() user: CurrentUserPayload) {
    const customers = await this.prisma.customer.findMany({
      where: { userId: user.id },
      select: { totalPurchases: true, totalDebt: true, bonusPoints: true, createdAt: true },
    });
    const totalPurchases = customers.reduce((s, c) => s + toNum(c.totalPurchases), 0);
    return {
      customers: customers.length,
      totalPurchases: money(totalPurchases),
      totalDebt: money(customers.reduce((s, c) => s + toNum(c.totalDebt), 0)),
      bonusPoints: customers.reduce((s, c) => s + c.bonusPoints, 0),
      avgPurchase: customers.length ? money(totalPurchases / customers.length) : 0,
      withDebt: customers.filter((c) => toNum(c.totalDebt) > 0).length,
      newThisMonth: customers.filter((c) => {
        const d = new Date(c.createdAt);
        const now = new Date();
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }).length,
    };
  }

  @Get(':id')
  @RequirePermissions('customers.read')
  async detail(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, userId: user.id },
      include: {
        orders: { orderBy: { id: 'desc' }, take: 50, include: { items: true } },
        debts: { orderBy: { id: 'desc' }, include: { payments: { orderBy: { id: 'desc' } } } },
        loyalty: { orderBy: { id: 'desc' }, take: 100 },
      },
    });
    if (!customer) throw new NotFoundException('Клиент не найден');
    const completed = customer.orders.filter((o) => !o.isReturn && o.status !== 'cancelled');
    return {
      ...this.format(customer),
      orderCount: completed.length,
      orders: customer.orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        totalAmount: money(toNum(o.totalAmount)),
        paymentMethod: o.paymentMethod,
        isReturn: o.isReturn,
        status: o.status,
        createdAt: o.createdAt,
        itemsCount: o.items.length,
      })),
      debts: customer.debts.map((d) => ({
        id: d.id,
        customerName: d.customerName,
        totalAmount: money(toNum(d.totalAmount)),
        paidAmount: money(toNum(d.paidAmount)),
        remaining: money(toNum(d.totalAmount) - toNum(d.paidAmount)),
        status: d.status,
        description: d.description || '',
        createdAt: d.createdAt,
        payments: d.payments.map((p) => ({ id: p.id, amount: money(toNum(p.amount)), note: p.note || '', createdAt: p.createdAt })),
      })),
      loyalty: customer.loyalty.map((l) => ({
        id: l.id,
        points: l.points,
        type: l.type,
        description: l.description || '',
        orderId: l.orderId,
        createdAt: l.createdAt,
      })),
    };
  }

  @Post()
  @RequirePermissions('customers.write')
  @ApiOperation({ summary: 'Создать клиента' })
  async create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CustomerDto) {
    const name = (dto.name || '').trim();
    if (!name) throw new BadRequestException('Укажите имя клиента');
    const phone = dto.phone?.trim() || null;
    if (phone) {
      const exists = await this.prisma.customer.findFirst({ where: { userId: user.id, phone } });
      if (exists) throw new BadRequestException('Клиент с таким телефоном уже существует');
    }
    const discount = Math.max(0, Math.min(100, toNum(dto.discountPercent)));
    const customer = await this.prisma.customer.create({
      data: {
        userId: user.id,
        name,
        phone,
        email: dto.email?.trim() || null,
        address: dto.address?.trim() || null,
        notes: dto.notes?.trim() || null,
        discountPercent: money(discount),
      },
    });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'customer.create', entity: 'customer', entityId: customer.id, details: { name } });
    return this.format(customer);
  }

  @Patch(':id')
  @RequirePermissions('customers.write')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CustomerDto,
  ) {
    const customer = await this.prisma.customer.findFirst({ where: { id, userId: user.id } });
    if (!customer) throw new NotFoundException('Клиент не найден');
    const phone = dto.phone !== undefined ? dto.phone?.trim() || null : customer.phone;
    if (phone && phone !== customer.phone) {
      const exists = await this.prisma.customer.findFirst({ where: { userId: user.id, phone, id: { not: id } } });
      if (exists) throw new BadRequestException('Клиент с таким телефоном уже существует');
    }
    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        phone,
        ...(dto.email !== undefined ? { email: dto.email?.trim() || null } : {}),
        ...(dto.address !== undefined ? { address: dto.address?.trim() || null } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
        ...(dto.discountPercent !== undefined ? { discountPercent: money(Math.max(0, Math.min(100, toNum(dto.discountPercent)))) } : {}),
      },
    });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'customer.update', entity: 'customer', entityId: id });
    return this.format(updated);
  }

  @Delete(':id')
  @RequirePermissions('customers.write')
  async remove(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, userId: user.id },
      include: { _count: { select: { orders: true, debts: true } } },
    });
    if (!customer) throw new NotFoundException('Клиент не найден');
    if (customer._count.orders > 0) throw new BadRequestException('Нельзя удалить клиента с историей покупок. Добавьте примечание вместо удаления.');
    if (toNum(customer.totalDebt) > 0) throw new BadRequestException('Нельзя удалить клиента с задолженностью');
    await this.prisma.customer.delete({ where: { id } });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'customer.delete', entity: 'customer', entityId: id });
    return { success: true };
  }

  @Get(':id/loyalty')
  @RequirePermissions('customers.read')
  async loyaltyHistory(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    const customer = await this.prisma.customer.findFirst({ where: { id, userId: user.id } });
    if (!customer) throw new NotFoundException('Клиент не найден');
    const rows = await this.prisma.loyaltyTransaction.findMany({
      where: { customerId: id },
      orderBy: { id: 'desc' },
      take: 200,
    });
    return {
      bonusPoints: customer.bonusPoints,
      results: rows.map((l) => ({ id: l.id, points: l.points, type: l.type, description: l.description || '', orderId: l.orderId, createdAt: l.createdAt })),
    };
  }

  @Post(':id/loyalty')
  @RequirePermissions('loyalty.manage')
  @ApiOperation({ summary: 'Начислить или списать бонусы вручную' })
  async loyalty(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number, @Body() dto: LoyaltyDto) {
    const customer = await this.prisma.customer.findFirst({ where: { id, userId: user.id } });
    if (!customer) throw new NotFoundException('Клиент не найден');
    let points = Math.floor(toNum(dto.points));
    if (points === 0) throw new BadRequestException('Укажите количество бонусов');
    const type = dto.type === 'redeem' || points < 0 ? 'redeem' : dto.type === 'adjust' ? 'adjust' : 'earn';
    if (type === 'redeem') points = -Math.abs(points);
    else points = Math.abs(points);
    if (customer.bonusPoints + points < 0) throw new BadRequestException('Недостаточно бонусов у клиента');
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.customer.update({
        where: { id },
        data: { bonusPoints: { increment: points } },
      });
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          customerId: id,
          points,
          type,
          description: dto.description?.trim() || (points > 0 ? 'Ручное начисление' : 'Ручное списание'),
        },
      });
      return { customer: updated, transaction };
    });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'loyalty.manual', entity: 'customer', entityId: id, details: { points, type } });
    return {
      bonusPoints: result.customer.bonusPoints,
      transaction: {
        id: result.transaction.id,
        points: result.transaction.points,
        type: result.transaction.type,
        description: result.transaction.description,
        createdAt: result.transaction.createdAt,
      },
    };
  }

  private format(c: any) {
    return {
      id: c.id,
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      notes: c.notes || '',
      bonusPoints: c.bonusPoints,
      discountPercent: toNum(c.discountPercent),
      totalPurchases: money(toNum(c.totalPurchases)),
      totalDebt: money(toNum(c.totalDebt)),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }
}
