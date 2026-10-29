import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEDUPE_WINDOW_MS = 6 * 60 * 60 * 1000;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async isEnabled(userId: number, type: string): Promise<boolean> {
    const rows = await this.prisma.appSetting.findMany({
      where: { userId, key: { in: ['telegram_notifications', `notify_${type}`] } },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    if (map.get('telegram_notifications') === 'false') return false;
    if (map.get(`notify_${type}`) === 'false') return false;
    return true;
  }

  async create(params: {
    userId: number;
    type: string;
    title: string;
    message: string;
    link?: string;
    dedupe?: boolean;
    sendTelegram?: boolean;
  }) {
    try {
      if (params.dedupe !== false) {
        const existing = await this.prisma.notification.findFirst({
          where: {
            userId: params.userId,
            type: params.type,
            title: params.title,
            isRead: false,
            createdAt: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) },
          },
        });
        if (existing) return existing;
      }

      const notification = await this.prisma.notification.create({
        data: {
          userId: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          link: params.link || null,
        },
      });

      if (params.sendTelegram !== false && (await this.isEnabled(params.userId, params.type))) {
        void this.sendTelegram(params.userId, `🔔 <b>${params.title}</b>\n${params.message}`);
      }
      return notification;
    } catch (err) {
      this.logger.warn(`Notification create failed: ${(err as Error).message}`);
      return null;
    }
  }

  async sendTelegram(userId: number, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return false;
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user?.telegramChatId) return false;
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: user.telegramChatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });
      return res.ok;
    } catch (err) {
      this.logger.warn(`Telegram send failed: ${(err as Error).message}`);
      return false;
    }
  }

  async lowStock(userId: number, userName: string | null, product: { name: string; remaining: number; minStock: number; id: number }) {
    return this.create({
      userId,
      type: 'low_stock',
      title: 'Низкий остаток товара',
      message: `«${product.name}»: осталось ${product.remaining} шт. (минимум ${product.minStock}).`,
      link: `/products`,
      dedupe: true,
    });
  }

  async expiryWarning(userId: number, productName: string, date: Date, days: number, productId: number) {
    return this.create({
      userId,
      type: 'expiry',
      title: 'Приближается срок годности',
      message: `«${productName}» истекает ${date.toLocaleDateString('ru-RU')} (${days} дн.).`,
      link: `/expiry`,
      dedupe: true,
    });
  }
}
