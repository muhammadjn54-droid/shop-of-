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
import { IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { BranchService } from '../common/branch.service';
import { PermissionsGuard, RequirePermissions } from '../common/permissions.guard';
import { clampLimit, clampPage, money, toNum } from '../common/utils';

class ExpenseDto {
  @IsString() category: string;
  @IsOptional() amount?: number | string;
  @IsOptional() @IsString() paymentMethod?: string;
  @IsOptional() @IsString() recipient?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() expenseDate?: string;
  @IsOptional() branchId?: number | string;
  @IsOptional() shiftId?: number | string;
}

class CategoryDto {
  @IsString() name: string;
}

@ApiTags('Expenses')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/expenses')
export class ExpensesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly branches: BranchService,
  ) {}

  @Get()
  @RequirePermissions('expenses.read')
  async list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('category') category?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = clampPage(page);
    const pageSize = clampLimit(limit, 30, 200);
    const where: any = { userId: user.id };
    if (category && category !== 'all') where.category = category;
    if (paymentMethod && paymentMethod !== 'all') where.paymentMethod = paymentMethod;
    if (from || to) {
      where.expenseDate = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(`${to}T23:59:59.999`) } : {}),
      };
    }
    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { recipient: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ];
    }
    const [total, rows, all] = await Promise.all([
      this.prisma.expense.count({ where }),
      this.prisma.expense.findMany({
        where,
        orderBy: [{ expenseDate: 'desc' }, { id: 'desc' }],
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.expense.findMany({ where, select: { amount: true, category: true, paymentMethod: true } }),
    ]);
    const byCategory: Record<string, number> = {};
    const byMethod: Record<string, number> = {};
    for (const e of all) {
      byCategory[e.category] = money((byCategory[e.category] || 0) + toNum(e.amount));
      byMethod[e.paymentMethod] = money((byMethod[e.paymentMethod] || 0) + toNum(e.amount));
    }
    return {
      count: total,
      page: pageNum,
      limit: pageSize,
      totalAmount: money(all.reduce((s, e) => s + toNum(e.amount), 0)),
      byCategory,
      byMethod,
      results: rows.map((e) => this.format(e)),
    };
  }

  @Get('summary')
  @RequirePermissions('expenses.read')
  async summary(@CurrentUser() user: CurrentUserPayload, @Query('from') from?: string, @Query('to') to?: string) {
    const now = new Date();
    const start = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = to ? new Date(`${to}T23:59:59.999`) : now;
    const rows = await this.prisma.expense.findMany({
      where: { userId: user.id, expenseDate: { gte: start, lte: end } },
      orderBy: { expenseDate: 'asc' },
    });
    const byCategory: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    const byMethod: Record<string, number> = {};
    for (const e of rows) {
      const amount = toNum(e.amount);
      byCategory[e.category] = money((byCategory[e.category] || 0) + amount);
      byMethod[e.paymentMethod] = money((byMethod[e.paymentMethod] || 0) + amount);
      const day = e.expenseDate.toISOString().slice(0, 10);
      byDay[day] = money((byDay[day] || 0) + amount);
    }
    return {
      from: start,
      to: end,
      total: money(rows.reduce((s, e) => s + toNum(e.amount), 0)),
      count: rows.length,
      byCategory,
      byMethod,
      byDay,
    };
  }

  @Get('categories')
  @RequirePermissions('expenses.read')
  async categories(@CurrentUser() user: CurrentUserPayload) {
    const [categories, grouped] = await Promise.all([
      this.prisma.expenseCategory.findMany({ where: { userId: user.id }, orderBy: { name: 'asc' } }),
      this.prisma.expense.groupBy({
        by: ['category'],
        where: { userId: user.id },
        _count: { _all: true },
        _sum: { amount: true },
      }),
    ]);
    return categories.map((c) => {
      const stats = grouped.find((g) => g.category === c.name);
      return {
        id: c.id,
        name: c.name,
        count: stats?._count._all || 0,
        total: money(toNum(stats?._sum.amount)),
      };
    });
  }

  @Post('categories')
  @RequirePermissions('expenses.write')
  async createCategory(@CurrentUser() user: CurrentUserPayload, @Body() dto: CategoryDto) {
    const name = (dto.name || '').trim();
    if (!name) throw new BadRequestException('Укажите название категории');
    const exists = await this.prisma.expenseCategory.findFirst({ where: { userId: user.id, name } });
    if (exists) throw new BadRequestException('Такая категория уже существует');
    return this.prisma.expenseCategory.create({ data: { userId: user.id, name } });
  }

  @Delete('categories/:id')
  @RequirePermissions('expenses.write')
  async deleteCategory(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    const category = await this.prisma.expenseCategory.findFirst({ where: { id, userId: user.id } });
    if (!category) throw new NotFoundException('Категория не найдена');
    const used = await this.prisma.expense.count({ where: { userId: user.id, category: category.name } });
    if (used > 0) throw new BadRequestException('Категория используется в расходах и не может быть удалена');
    await this.prisma.expenseCategory.delete({ where: { id } });
    return { success: true };
  }

  @Post()
  @RequirePermissions('expenses.write')
  @ApiOperation({ summary: 'Добавить расход' })
  async create(@CurrentUser() user: CurrentUserPayload, @Body() dto: ExpenseDto) {
    const category = (dto.category || '').trim();
    if (!category) throw new BadRequestException('Укажите категорию расхода');
    const amount = money(toNum(dto.amount));
    if (amount <= 0) throw new BadRequestException('Сумма расхода должна быть больше нуля');
    const paymentMethod = ['cash', 'card', 'transfer'].includes(dto.paymentMethod || '') ? dto.paymentMethod! : 'cash';
    const branchId = await this.branches.resolveBranchId(user.id, dto.branchId ? parseInt(String(dto.branchId), 10) : null);
    let shiftId: number | null = dto.shiftId ? parseInt(String(dto.shiftId), 10) : null;
    if (shiftId) {
      const shift = await this.prisma.cashierShift.findFirst({ where: { id: shiftId, userId: user.id, status: 'open' } });
      if (!shift) throw new BadRequestException('Смена не найдена или закрыта');
    } else if (paymentMethod === 'cash') {
      const openShift = await this.prisma.cashierShift.findFirst({ where: { userId: user.id, status: 'open' } });
      if (openShift) shiftId = openShift.id;
    }
    const expense = await this.prisma.expense.create({
      data: {
        userId: user.id,
        branchId,
        shiftId,
        category,
        amount,
        paymentMethod,
        recipient: dto.recipient?.trim() || null,
        notes: dto.notes?.trim() || null,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : new Date(),
      },
    });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'expense.create', entity: 'expense', entityId: expense.id, details: { category, amount } });
    return this.format(expense);
  }

  @Patch(':id')
  @RequirePermissions('expenses.write')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ExpenseDto,
  ) {
    const expense = await this.prisma.expense.findFirst({ where: { id, userId: user.id } });
    if (!expense) throw new NotFoundException('Расход не найден');
    const amount = dto.amount !== undefined ? money(toNum(dto.amount)) : toNum(expense.amount);
    if (amount <= 0) throw new BadRequestException('Сумма расхода должна быть больше нуля');
    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        ...(dto.category ? { category: dto.category.trim() } : {}),
        amount,
        ...(dto.paymentMethod ? { paymentMethod: dto.paymentMethod } : {}),
        ...(dto.recipient !== undefined ? { recipient: dto.recipient?.trim() || null } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
        ...(dto.expenseDate ? { expenseDate: new Date(dto.expenseDate) } : {}),
      },
    });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'expense.update', entity: 'expense', entityId: id, details: { amount } });
    return this.format(updated);
  }

  @Delete(':id')
  @RequirePermissions('expenses.write')
  async remove(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    const expense = await this.prisma.expense.findFirst({ where: { id, userId: user.id } });
    if (!expense) throw new NotFoundException('Расход не найден');
    await this.prisma.expense.delete({ where: { id } });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'expense.delete', entity: 'expense', entityId: id, details: { amount: toNum(expense.amount), category: expense.category } });
    return { success: true };
  }

  private format(e: any) {
    return {
      id: e.id,
      branchId: e.branchId,
      shiftId: e.shiftId,
      category: e.category,
      amount: money(toNum(e.amount)),
      paymentMethod: e.paymentMethod,
      recipient: e.recipient || '',
      notes: e.notes || '',
      expenseDate: e.expenseDate,
      createdAt: e.createdAt,
    };
  }
}
