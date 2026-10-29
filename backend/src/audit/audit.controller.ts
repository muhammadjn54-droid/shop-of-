import { Controller, Delete, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsGuard, RequirePermissions } from '../common/permissions.guard';
import { clampLimit, clampPage } from '../common/utils';

@ApiTags('Audit')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/audit')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions('audit.read')
  @ApiOperation({ summary: 'Журнал действий сотрудников' })
  async list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = clampPage(page);
    const pageSize = clampLimit(limit, 50, 200);
    const where: any = { userId: user.id };
    if (action && action !== 'all') where.action = { contains: action, mode: 'insensitive' };
    if (entity && entity !== 'all') where.entity = entity;
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(`${to}T23:59:59.999`) } : {}),
      };
    }
    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { action: { contains: q, mode: 'insensitive' } },
        { userName: { contains: q, mode: 'insensitive' } },
        { details: { contains: q, mode: 'insensitive' } },
      ];
    }
    const [total, rows] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      count: total,
      page: pageNum,
      limit: pageSize,
      results: rows.map((a) => ({
        id: a.id,
        userName: a.userName || '',
        action: a.action,
        entity: a.entity,
        entityId: a.entityId || '',
        details: a.details || '',
        createdAt: a.createdAt,
      })),
    };
  }

  @Delete('clear')
  @RequirePermissions('audit.read')
  @ApiOperation({ summary: 'Очистить журнал действий' })
  async clear(@CurrentUser() user: CurrentUserPayload) {
    const res = await this.prisma.auditLog.deleteMany({ where: { userId: user.id } });
    return { success: true, deleted: res.count };
  }
}
