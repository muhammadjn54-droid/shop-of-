import { Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../common/notifications.service';
import { PermissionsGuard, RequirePermissions } from '../common/permissions.guard';
import { clampLimit, clampPage } from '../common/utils';

@ApiTags('Notifications')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/notifications')
export class NotificationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Get()
  async list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = clampPage(page);
    const pageSize = clampLimit(limit, 30, 100);
    const where: any = { userId: user.id };
    if (unreadOnly === 'true') where.isRead = false;
    if (type && type !== 'all') where.type = type;
    const [total, unread, rows] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId: user.id, isRead: false } }),
      this.prisma.notification.findMany({ where, orderBy: { id: 'desc' }, skip: (pageNum - 1) * pageSize, take: pageSize }),
    ]);
    return {
      count: total,
      unread,
      page: pageNum,
      limit: pageSize,
      results: rows.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        link: n.link || '',
        createdAt: n.createdAt,
      })),
    };
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: CurrentUserPayload) {
    const count = await this.prisma.notification.count({ where: { userId: user.id, isRead: false } });
    return { count };
  }

  @Patch(':id/read')
  async markRead(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    await this.prisma.notification.updateMany({ where: { id, userId: user.id }, data: { isRead: true } });
    return { success: true };
  }

  @Post('read-all')
  async markAllRead(@CurrentUser() user: CurrentUserPayload) {
    const result = await this.prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
    return { success: true, updated: result.count };
  }

  @Delete(':id')
  async remove(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    await this.prisma.notification.deleteMany({ where: { id, userId: user.id } });
    return { success: true };
  }

  @Post('check')
  @RequirePermissions('stock.read')
  @ApiOperation({ summary: 'Сформировать уведомления о низком остатке и сроках годности' })
  async check(@CurrentUser() user: CurrentUserPayload) {
    const products = await this.prisma.product.findMany({ where: { userId: user.id } });
    let lowStock = 0;
    let expiry = 0;
    const now = Date.now();
    for (const p of products) {
      const remaining = p.quantityReceived - p.quantitySold;
      if (remaining <= p.minStock) {
        const created = await this.notifications.lowStock(user.id, user.username, {
          id: p.id,
          name: p.name,
          remaining,
          minStock: p.minStock,
        });
        if (created) lowStock++;
      }
      if (p.expiryDate) {
        const days = Math.ceil((new Date(p.expiryDate).getTime() - now) / 86400000);
        if (days <= 30) {
          const created = await this.notifications.expiryWarning(user.id, p.name, new Date(p.expiryDate), days, p.id);
          if (created) expiry++;
        }
      }
    }
    return { success: true, lowStock, expiry };
  }
}
