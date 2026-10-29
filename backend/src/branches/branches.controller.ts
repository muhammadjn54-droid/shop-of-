import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { BranchService } from '../common/branch.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { PermissionsGuard, RequirePermissions } from '../common/permissions.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';

class BranchDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}

class UpdateBranchDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}

@ApiTags('Branches')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/branches')
export class BranchesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly branches: BranchService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Список филиалов с показателями' })
  async list(@CurrentUser() user: CurrentUserPayload) {
    const branches = await this.branches.list(user.id);
    const result = [];
    for (const b of branches) {
      const [products, sales, expenses] = await Promise.all([
        this.prisma.product.aggregate({
          where: { userId: user.id, branchId: b.id },
          _count: { _all: true },
          _sum: { quantityReceived: true, quantitySold: true },
        }),
        this.prisma.order.aggregate({
          where: { userId: user.id, branchId: b.id },
          _count: { _all: true },
          _sum: { totalAmount: true },
        }),
        this.prisma.expense.aggregate({
          where: { userId: user.id, branchId: b.id },
          _sum: { amount: true },
        }),
      ]);
      result.push({
        ...b,
        stats: {
          products: products._count._all,
          stock: Number(products._sum.quantityReceived || 0) - Number(products._sum.quantitySold || 0),
          salesCount: sales._count._all,
          salesTotal: Number(sales._sum.totalAmount || 0),
          expenses: Number(expenses._sum.amount || 0),
        },
      });
    }
    return result;
  }

  @Post()
  @RequirePermissions('branches.manage')
  @ApiOperation({ summary: 'Создать филиал' })
  async create(@CurrentUser() user: CurrentUserPayload, @Body() dto: BranchDto) {
    if (dto.isMain) {
      await this.prisma.branch.updateMany({ where: { userId: user.id }, data: { isMain: false } });
    }
    const branch = await this.prisma.branch.create({
      data: {
        userId: user.id,
        name: dto.name.trim(),
        address: dto.address?.trim() || null,
        phone: dto.phone?.trim() || null,
        isMain: !!dto.isMain,
      },
    });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'branch.create', entity: 'branch', entityId: branch.id, details: dto });
    return branch;
  }

  @Patch(':id')
  @RequirePermissions('branches.manage')
  @ApiOperation({ summary: 'Обновить филиал' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBranchDto,
  ) {
    const existing = await this.prisma.branch.findFirst({ where: { id, userId: user.id } });
    if (!existing) throw new NotFoundException('Филиал не найден');
    if (dto.isMain) {
      await this.prisma.branch.updateMany({ where: { userId: user.id }, data: { isMain: false } });
    }
    const branch = await this.prisma.branch.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.address !== undefined ? { address: dto.address?.trim() || null } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone?.trim() || null } : {}),
        ...(dto.isMain !== undefined ? { isMain: dto.isMain } : {}),
      },
    });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'branch.update', entity: 'branch', entityId: id, details: dto });
    return branch;
  }

  @Delete(':id')
  @RequirePermissions('branches.manage')
  @ApiOperation({ summary: 'Удалить филиал (если нет связанных данных)' })
  async remove(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    const existing = await this.prisma.branch.findFirst({ where: { id, userId: user.id } });
    if (!existing) throw new NotFoundException('Филиал не найден');
    if (existing.isMain) throw new BadRequestException('Нельзя удалить основной филиал');
    const productCount = await this.prisma.product.count({ where: { userId: user.id, branchId: id } });
    if (productCount > 0) throw new BadRequestException('В филиале есть товары. Сначала перенесите их.');
    await this.prisma.branch.delete({ where: { id } });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'branch.delete', entity: 'branch', entityId: id });
    return { success: true };
  }
}
