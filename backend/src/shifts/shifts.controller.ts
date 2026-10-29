import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
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
import { BranchService } from '../common/branch.service';
import { PermissionsGuard, RequirePermissions } from '../common/permissions.guard';
import { clampLimit, clampPage, intVal, money, toNum } from '../common/utils';

class OpenShiftDto {
  @IsOptional() openingCash?: number | string;
  @IsOptional() branchId?: number | string;
  @IsOptional() @IsString() notes?: string;
}

class CloseShiftDto {
  @IsOptional() closingCash?: number | string;
  @IsOptional() @IsString() notes?: string;
}

class MovementDto {
  @IsString() type: string;
  @IsOptional() amount?: number | string;
  @IsOptional() @IsString() reason?: string;
}

@ApiTags('Shifts')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/shifts')
export class ShiftsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly branches: BranchService,
  ) {}

  @Get('current')
  @RequirePermissions('shifts.read')
  @ApiOperation({ summary: 'Текущая открытая смена' })
  async current(@CurrentUser() user: CurrentUserPayload) {
    const shift = await this.prisma.cashierShift.findFirst({
      where: { userId: user.id, status: 'open' },
      orderBy: { id: 'desc' },
      include: { movements: { orderBy: { id: 'desc' } } },
    });
    if (!shift) return { open: false, shift: null };
    return { open: true, shift: this.format(shift) };
  }

  @Get()
  @RequirePermissions('shifts.read')
  async list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = clampPage(page);
    const pageSize = clampLimit(limit, 20, 100);
    const where: any = { userId: user.id };
    if (status && status !== 'all') where.status = status;
    if (from || to) {
      where.openedAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(`${to}T23:59:59.999`) } : {}),
      };
    }
    const [total, rows] = await Promise.all([
      this.prisma.cashierShift.count({ where }),
      this.prisma.cashierShift.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { count: total, page: pageNum, limit: pageSize, results: rows.map((s) => this.format(s)) };
  }

  @Get(':id')
  @RequirePermissions('shifts.read')
  async detail(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    const shift = await this.prisma.cashierShift.findFirst({
      where: { id, userId: user.id },
      include: { movements: { orderBy: { id: 'desc' } } },
    });
    if (!shift) throw new NotFoundException('Смена не найдена');
    return this.format(shift);
  }

  @Post('open')
  @RequirePermissions('shifts.manage')
  @ApiOperation({ summary: 'Открыть кассовую смену' })
  async open(@CurrentUser() user: CurrentUserPayload, @Body() dto: OpenShiftDto) {
    const existing = await this.prisma.cashierShift.findFirst({ where: { userId: user.id, status: 'open' } });
    if (existing) throw new BadRequestException('У вас уже есть открытая смена');
    const branchId = await this.branches.resolveBranchId(user.id, dto.branchId ? parseInt(String(dto.branchId), 10) : null);
    const shift = await this.prisma.cashierShift.create({
      data: {
        userId: user.id,
        branchId,
        cashierName: user.username,
        openingCash: money(toNum(dto.openingCash)),
        status: 'open',
        notes: dto.notes?.trim() || null,
      },
      include: { movements: true },
    });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'shift.open', entity: 'shift', entityId: shift.id, details: { openingCash: money(toNum(dto.openingCash)) } });
    return this.format(shift);
  }

  @Post(':id/movement')
  @RequirePermissions('shifts.manage')
  @ApiOperation({ summary: 'Внесение/изъятие наличных' })
  async movement(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MovementDto,
  ) {
    const shift = await this.prisma.cashierShift.findFirst({ where: { id, userId: user.id } });
    if (!shift) throw new NotFoundException('Смена не найдена');
    if (shift.status !== 'open') throw new BadRequestException('Смена уже закрыта');
    const amount = Math.abs(toNum(dto.amount));
    if (amount <= 0) throw new BadRequestException('Сумма должна быть больше нуля');
    const type = dto.type === 'drop' || dto.type === 'out' ? 'cash_out' : 'cash_in';
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.cashMovement.create({
        data: { shiftId: shift.id, type, amount: money(amount), reason: dto.reason?.trim() || null, cashierName: user.username },
      });
      return tx.cashierShift.update({
        where: { id: shift.id },
        data: type === 'cash_in' ? { cashAdditions: { increment: money(amount) } } : { cashDrops: { increment: money(amount) } },
        include: { movements: { orderBy: { id: 'desc' } } },
      });
    });
    await this.audit.log({ userId: user.id, userName: user.username, action: `shift.${type}`, entity: 'shift', entityId: shift.id, details: { amount: money(amount), reason: dto.reason } });
    return this.format(result);
  }

  @Post(':id/close')
  @RequirePermissions('shifts.manage')
  @ApiOperation({ summary: 'Закрыть смену и рассчитать кассу' })
  async close(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CloseShiftDto,
  ) {
    const shift = await this.prisma.cashierShift.findFirst({ where: { id, userId: user.id } });
    if (!shift) throw new NotFoundException('Смена не найдена');
    if (shift.status !== 'open') throw new BadRequestException('Смена уже закрыта');

    const [orders, expenses] = await Promise.all([
      this.prisma.order.findMany({
        where: { shiftId: shift.id, status: { not: 'cancelled' } },
        select: { totalAmount: true, paymentMethod: true, cardAmount: true, isReturn: true },
      }),
      this.prisma.expense.findMany({ where: { shiftId: shift.id } }),
    ]);

    let cashSales = 0;
    let cardSales = 0;
    let debtSales = 0;
    let returnsCash = 0;
    let returnsCard = 0;
    let salesCount = 0;
    for (const o of orders) {
      const amount = toNum(o.totalAmount);
      if (o.isReturn) {
        if (o.paymentMethod === 'card') returnsCard += amount;
        else if (o.paymentMethod === 'cash') returnsCash += amount;
        continue;
      }
      salesCount++;
      if (o.paymentMethod === 'card') cardSales += amount;
      else if (o.paymentMethod === 'debt') debtSales += amount;
      else if (o.paymentMethod === 'mixed') {
        const card = Math.min(amount, toNum(o.cardAmount));
        cardSales += card;
        cashSales += amount - card;
      } else if (o.paymentMethod === 'cash') cashSales += amount;
    }
    cardSales = Math.max(0, cardSales - returnsCard);
    const expensesCash = expenses
      .filter((e) => e.paymentMethod === 'cash')
      .reduce((s, e) => s + toNum(e.amount), 0);
    const opening = toNum(shift.openingCash);
    const additions = toNum(shift.cashAdditions);
    const drops = toNum(shift.cashDrops);
    const collections = toNum(shift.debtCollections);
    const expected = opening + cashSales - returnsCash + additions + collections - drops - expensesCash;
    const closingCash = dto.closingCash !== undefined && dto.closingCash !== null && String(dto.closingCash) !== ''
      ? money(toNum(dto.closingCash))
      : money(expected);

    const updated = await this.prisma.cashierShift.update({
      where: { id: shift.id },
      data: {
        status: 'closed',
        closedAt: new Date(),
        closingCash,
        expectedCash: money(expected),
        variance: money(closingCash - expected),
        cashSales: money(cashSales),
        cardSales: money(cardSales),
        debtSales: money(debtSales),
        returnsCash: money(returnsCash),
        expensesCash: money(expensesCash),
        salesCount,
        notes: dto.notes?.trim() || shift.notes,
      },
      include: { movements: { orderBy: { id: 'desc' } } },
    });
    await this.audit.log({
      userId: user.id,
      userName: user.username,
      action: 'shift.close',
      entity: 'shift',
      entityId: shift.id,
      details: { expected: money(expected), closingCash, variance: money(closingCash - expected) },
    });
    return this.format(updated);
  }

  private format(s: any) {
    return {
      id: s.id,
      userId: s.userId,
      branchId: s.branchId,
      cashierName: s.cashierName,
      status: s.status,
      openingCash: money(toNum(s.openingCash)),
      closingCash: s.closingCash != null ? money(toNum(s.closingCash)) : null,
      expectedCash: s.expectedCash != null ? money(toNum(s.expectedCash)) : null,
      variance: s.variance != null ? money(toNum(s.variance)) : null,
      cashSales: money(toNum(s.cashSales)),
      cardSales: money(toNum(s.cardSales)),
      debtSales: money(toNum(s.debtSales)),
      debtCollections: money(toNum(s.debtCollections)),
      cashAdditions: money(toNum(s.cashAdditions)),
      cashDrops: money(toNum(s.cashDrops)),
      returnsCash: money(toNum(s.returnsCash)),
      expensesCash: money(toNum(s.expensesCash)),
      salesCount: s.salesCount,
      notes: s.notes || '',
      openedAt: s.openedAt,
      closedAt: s.closedAt,
      movements: (s.movements || []).map((m: any) => ({
        id: m.id,
        type: m.type,
        amount: money(toNum(m.amount)),
        reason: m.reason || '',
        cashierName: m.cashierName || '',
        createdAt: m.createdAt,
      })),
    };
  }
}
