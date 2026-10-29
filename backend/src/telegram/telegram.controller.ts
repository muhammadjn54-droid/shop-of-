import { BadRequestException, Body, Controller, Get, Headers, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { randomBytes } from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { PermissionsGuard, RequirePermissions } from '../common/permissions.guard';
import { money, toNum } from '../common/utils';

@ApiTags('Telegram')
@Controller('api/telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get('status')
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('telegram.manage')
  async status(@CurrentUser() user: CurrentUserPayload) {
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id }, select: { telegramChatId: true, telegramCode: true } });
    return {
      configured: !!process.env.TELEGRAM_BOT_TOKEN,
      webhookConfigured: !!process.env.PUBLIC_URL,
      chatId: dbUser?.telegramChatId || '',
      linkCode: dbUser?.telegramCode || '',
      instructions: dbUser?.telegramChatId
        ? 'Аккаунт привязан. Отправьте боту /help для списка команд.'
        : 'Откройте бота, отправьте /link и ваш код привязки.',
    };
  }

  @Post('code')
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('telegram.manage')
  @ApiOperation({ summary: 'Сгенерировать код привязки Telegram' })
  async generateCode(@CurrentUser() user: CurrentUserPayload) {
    const code = randomBytes(4).toString('hex').toUpperCase();
    await this.prisma.user.update({ where: { id: user.id }, data: { telegramCode: code } });
    return {
      code,
      instructions: `Отправьте боту сообщение: /link ${code}`,
      botConfigured: !!process.env.TELEGRAM_BOT_TOKEN,
    };
  }

  @Post('unlink')
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('telegram.manage')
  async unlink(@CurrentUser() user: CurrentUserPayload) {
    await this.prisma.user.update({ where: { id: user.id }, data: { telegramChatId: null } });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'telegram.unlink', entity: 'user', entityId: user.id });
    return { success: true };
  }

  @Post('set-webhook')
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('telegram.manage')
  @ApiOperation({ summary: 'Зарегистрировать webhook бота (нужен PUBLIC_URL)' })
  async setWebhook(@CurrentUser() user: CurrentUserPayload, @Body() body: { url?: string }) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new BadRequestException('TELEGRAM_BOT_TOKEN не задан в .env');
    const base = (body?.url || process.env.PUBLIC_URL || '').replace(/\/+$/, '');
    if (!base) throw new BadRequestException('Укажите PUBLIC_URL в .env или URL в запросе (https://домен)');
    const webhookUrl = `${base}/api/telegram/webhook`;
    const payload: any = { url: webhookUrl, allowed_updates: ['message'] };
    if (process.env.TELEGRAM_WEBHOOK_SECRET) payload.secret_token = process.env.TELEGRAM_WEBHOOK_SECRET;
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new BadRequestException(data.description || 'Не удалось установить webhook');
    await this.audit.log({ userId: user.id, userName: user.username, action: 'telegram.webhook', entity: 'settings', details: { url: webhookUrl } });
    return { success: true, url: webhookUrl, description: data.description };
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Telegram webhook (публичный, защищён secret_token)' })
  async webhook(@Headers('x-telegram-bot-api-secret-token') secret: string, @Body() update: any) {
    const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (expected && secret !== expected) {
      this.logger.warn('Rejected Telegram webhook with invalid secret');
      return { ok: true };
    }
    const message = update?.message;
    const chatId = message?.chat?.id;
    const text = (message?.text || '').trim();
    if (!chatId || !text) return { ok: true };

    const user = await this.prisma.user.findFirst({ where: { telegramChatId: String(chatId) } });
    const [command, ...args] = text.split(/\s+/);
    const cmd = command.split('@')[0].toLowerCase();

    if (cmd === '/start' || cmd === '/help') {
      await this.reply(chatId, user
        ? '👋 <b>Shop ERP</b>\nДоступные команды:\n/sales — продажи за сегодня\n/stock — низкие остатки\n/debt — долги клиентов\n/status — сводка\n/unlink — отвязать аккаунт'
        : '👋 <b>Shop ERP</b>\nЧтобы привязать аккаунт, получите код в настройках приложения и отправьте:\n<code>/link ВАШ_КОД</code>');
      return { ok: true };
    }

    if (cmd === '/link') {
      const code = (args[0] || '').trim().toUpperCase();
      if (!code) {
        await this.reply(chatId, 'Укажите код: <code>/link ВАШ_КОД</code>');
        return { ok: true };
      }
      const target = await this.prisma.user.findFirst({ where: { telegramCode: code } });
      if (!target) {
        await this.reply(chatId, '❌ Код не найден или устарел. Сгенерируйте новый в настройках.');
        return { ok: true };
      }
      await this.prisma.user.update({ where: { id: target.id }, data: { telegramChatId: String(chatId), telegramCode: null } });
      await this.reply(chatId, `✅ Аккаунт «${target.username}» привязан. Отправьте /help для списка команд.`);
      return { ok: true };
    }

    if (cmd === '/unlink') {
      if (user) await this.prisma.user.update({ where: { id: user.id }, data: { telegramChatId: null } });
      await this.reply(chatId, 'Аккаунт отвязан.');
      return { ok: true };
    }

    if (!user) {
      await this.reply(chatId, 'Аккаунт не привязан. Получите код в настройках и отправьте /link КОД.');
      return { ok: true };
    }

    if (cmd === '/sales') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const orders = await this.prisma.order.findMany({
        where: { userId: user.id, createdAt: { gte: start }, status: { not: 'cancelled' } },
        select: { totalAmount: true, isReturn: true, paymentMethod: true },
      });
      const sales = orders.filter((o) => !o.isReturn).reduce((s, o) => s + toNum(o.totalAmount), 0);
      const returns = orders.filter((o) => o.isReturn).reduce((s, o) => s + toNum(o.totalAmount), 0);
      await this.reply(chatId, `📊 <b>Продажи за сегодня</b>\nВыручка: <b>${money(sales).toFixed(2)} TJS</b>\nВозвраты: ${money(returns).toFixed(2)} TJS\nЧеков: ${orders.filter((o) => !o.isReturn).length}`);
      return { ok: true };
    }

    if (cmd === '/stock') {
      const products = await this.prisma.product.findMany({ where: { userId: user.id } });
      const low = products
        .map((p) => ({ name: p.name, remaining: p.quantityReceived - p.quantitySold, minStock: p.minStock }))
        .filter((p) => p.remaining <= p.minStock)
        .sort((a, b) => a.remaining - b.remaining)
        .slice(0, 15);
      await this.reply(chatId, low.length
        ? `📦 <b>Низкие остатки (${low.length})</b>\n` + low.map((p) => `• ${p.name}: ${p.remaining} шт. (мин. ${p.minStock})`).join('\n')
        : '📦 Низких остатков нет.');
      return { ok: true };
    }

    if (cmd === '/debt') {
      const debts = await this.prisma.debt.findMany({ where: { userId: user.id, status: { not: 'paid' } } });
      const outstanding = debts.reduce((s, d) => s + Math.max(0, toNum(d.totalAmount) - toNum(d.paidAmount)), 0);
      await this.reply(chatId, `💳 <b>Долги клиентов</b>\nДолжников: ${debts.length}\nОбщая сумма: <b>${money(outstanding).toFixed(2)} TJS</b>`);
      return { ok: true };
    }

    if (cmd === '/status') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const [orders, products, expenses] = await Promise.all([
        this.prisma.order.findMany({ where: { userId: user.id, createdAt: { gte: start }, status: { not: 'cancelled' } }, select: { totalAmount: true, isReturn: true } }),
        this.prisma.product.findMany({ where: { userId: user.id } }),
        this.prisma.expense.findMany({ where: { userId: user.id, expenseDate: { gte: start } }, select: { amount: true } }),
      ]);
      const sales = orders.filter((o) => !o.isReturn).reduce((s, o) => s + toNum(o.totalAmount), 0);
      const low = products.filter((p) => p.quantityReceived - p.quantitySold <= p.minStock).length;
      const exp = expenses.reduce((s, e) => s + toNum(e.amount), 0);
      await this.reply(chatId, `📈 <b>Сводка за сегодня</b>\nВыручка: ${money(sales).toFixed(2)} TJS\nРасходы: ${money(exp).toFixed(2)} TJS\nЧеков: ${orders.filter((o) => !o.isReturn).length}\nНизких остатков: ${low}`);
      return { ok: true };
    }

    await this.reply(chatId, 'Неизвестная команда. Отправьте /help.');
    return { ok: true };
  }

  private async reply(chatId: number | string, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      });
    } catch (err) {
      this.logger.warn(`Telegram reply failed: ${(err as Error).message}`);
    }
  }
}
