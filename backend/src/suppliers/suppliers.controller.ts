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
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { PermissionsGuard, RequirePermissions } from '../common/permissions.guard';
import { clampLimit, clampPage, money, toNum } from '../common/utils';

class SupplierDto {
  @IsString()
  @MaxLength(160)
  name: string;

  @IsOptional() @IsString() contactPerson?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() notes?: string;
}

class SupplierPaymentDto {
  @IsOptional() @IsString() purchaseId?: string;
  @IsOptional() @IsString() amount?: string;
  @IsOptional() @IsString() paymentMethod?: string;
  @IsOptional() @IsString() note?: string;
}

@ApiTags('Suppliers')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/suppliers')
export class SuppliersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermissions('suppliers.read')
  @ApiOperation({ summary: 'Список поставщиков с задолженностью и статистикой' })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = clampPage(page);
    const pageSize = clampLimit(limit, 20, 100);
    const where: any = { userId: user.id };
    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { contactPerson: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }
    const [total, suppliers] = await Promise.all([
      this.prisma.supplier.count({ where }),
      this.prisma.supplier.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { purchases: true, products: true } },
          purchases: { select: { totalAmount: true, paidAmount: true, status: true } },
        },
      }),
    ]);

    const results = suppliers.map((s) => {
      const activePurchases = s.purchases.filter((p) => p.status !== 'cancelled');
      const obligations = activePurchases.reduce((sum, p) => sum + toNum(p.totalAmount), 0);
      const allocatedPaid = activePurchases.reduce((sum, p) => sum + toNum(p.paidAmount), 0);
      return {
        id: s.id,
        name: s.name,
        contactPerson: s.contactPerson || '',
        phone: s.phone || '',
        email: s.email || '',
        address: s.address || '',
        notes: s.notes || '',
        totalDebt: money(Math.max(0, toNum(s.totalDebt))),
        totalPaid: money(toNum(s.totalPaid)),
        purchasesCount: s._count.purchases,
        productsCount: s._count.products,
        obligations: money(obligations),
        allocatedPaid: money(allocatedPaid),
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      };
    });

    return {
      count: total,
      page: pageNum,
      limit: pageSize,
      results,
    };
  }

  @Get(':id')
  @RequirePermissions('suppliers.read')
  @ApiOperation({ summary: 'Поставщик: закупки, платежи, товары' })
  async findOne(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, userId: user.id },
      include: {
        purchases: { orderBy: { id: 'desc' }, take: 50, include: { items: true } },
        payments: { orderBy: { id: 'desc' }, take: 100 },
        products: { select: { id: true, name: true, barcode: true, quantityReceived: true, quantitySold: true, purchasePrice: true } },
      },
    });
    if (!supplier) throw new NotFoundException('Поставщик не найден');
    const obligations = supplier.purchases
      .filter((p) => p.status !== 'cancelled')
      .reduce((sum, p) => sum + toNum(p.totalAmount), 0);
    return {
      ...supplier,
      totalDebt: money(toNum(supplier.totalDebt)),
      totalPaid: money(toNum(supplier.totalPaid)),
      obligations: money(obligations),
      remaining: money(Math.max(0, obligations - toNum(supplier.totalPaid))),
    };
  }

  @Get(':id/payments')
  @RequirePermissions('suppliers.read')
  async payments(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    const supplier = await this.prisma.supplier.findFirst({ where: { id, userId: user.id } });
    if (!supplier) throw new NotFoundException('Поставщик не найден');
    return this.prisma.supplierPayment.findMany({ where: { supplierId: id }, orderBy: { id: 'desc' } });
  }

  @Post()
  @RequirePermissions('suppliers.write')
  @ApiOperation({ summary: 'Создать поставщика' })
  async create(@CurrentUser() user: CurrentUserPayload, @Body() dto: SupplierDto) {
    const supplier = await this.prisma.supplier.create({
      data: {
        userId: user.id,
        name: dto.name.trim(),
        contactPerson: dto.contactPerson?.trim() || null,
        phone: dto.phone?.trim() || null,
        email: dto.email?.trim() || null,
        address: dto.address?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
    });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'supplier.create', entity: 'supplier', entityId: supplier.id, details: dto });
    return supplier;
  }

  @Patch(':id')
  @RequirePermissions('suppliers.write')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<SupplierDto>,
  ) {
    await this.ensure(user.id, id);
    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.contactPerson !== undefined ? { contactPerson: dto.contactPerson?.trim() || null } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone?.trim() || null } : {}),
        ...(dto.email !== undefined ? { email: dto.email?.trim() || null } : {}),
        ...(dto.address !== undefined ? { address: dto.address?.trim() || null } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
      },
    });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'supplier.update', entity: 'supplier', entityId: id, details: dto });
    return supplier;
  }

  @Delete(':id')
  @RequirePermissions('suppliers.write')
  async remove(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    await this.ensure(user.id, id);
    const purchases = await this.prisma.purchaseOrder.count({ where: { supplierId: id } });
    if (purchases > 0) {
      throw new BadRequestException('Нельзя удалить поставщика с историей закупок');
    }
    await this.prisma.product.updateMany({ where: { supplierId: id, userId: user.id }, data: { supplierId: null } });
    await this.prisma.supplier.delete({ where: { id } });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'supplier.delete', entity: 'supplier', entityId: id });
    return { success: true };
  }

  @Post(':id/payments')
  @RequirePermissions('suppliers.write')
  @ApiOperation({ summary: 'Зафиксировать оплату поставщику (полную или частичную)' })
  async addPayment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SupplierPaymentDto,
  ) {
    const supplier = await this.ensure(user.id, id);
    const amount = money(toNum(dto.amount));
    if (amount <= 0) throw new BadRequestException('Сумма оплаты должна быть больше нуля');
    if (amount > toNum(supplier.totalDebt) + 0.009) {
      throw new BadRequestException(`Сумма превышает задолженность (${money(toNum(supplier.totalDebt))})`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.supplierPayment.create({
        data: {
          supplierId: id,
          amount,
          paymentMethod: (dto.paymentMethod || 'cash').trim(),
          note: dto.note?.trim() || null,
          createdBy: user.username,
        },
      });
      await tx.supplier.update({
        where: { id },
        data: {
          totalPaid: { increment: amount },
          totalDebt: { decrement: amount },
        },
      });
      if (dto.purchaseId) {
        const purchaseId = parseInt(dto.purchaseId, 10);
        const purchase = await tx.purchaseOrder.findFirst({ where: { id: purchaseId, supplierId: id, userId: user.id } });
        if (purchase) {
          const newPaid = Math.min(toNum(purchase.totalAmount), toNum(purchase.paidAmount) + amount);
          await tx.purchaseOrder.update({
            where: { id: purchase.id },
            data: {
              paidAmount: newPaid,
              status: newPaid >= toNum(purchase.totalAmount) ? 'paid' : purchase.status === 'received' ? 'received' : 'partially_paid',
            },
          });
        }
      }
      return payment;
    });

    await this.audit.log({ userId: user.id, userName: user.username, action: 'supplier.payment', entity: 'supplier', entityId: id, details: { amount, method: dto.paymentMethod } });
    return result;
  }

  private async ensure(userId: number, id: number) {
    const supplier = await this.prisma.supplier.findFirst({ where: { id, userId } });
    if (!supplier) throw new NotFoundException('Поставщик не найден');
    return supplier;
  }
}
