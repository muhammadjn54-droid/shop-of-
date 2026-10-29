import { BadRequestException, Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { NotificationsService } from '../common/notifications.service';
import { PermissionsGuard, RequirePermissions } from '../common/permissions.guard';

class TelegramLinkDto {
  @IsOptional() @IsString() chatId?: string;
}

class TestDto {
  @IsOptional() @IsString() text?: string;
}

const DEFAULTS: Record<string, string> = {
  shop_name: 'Мой магазин',
  shop_phone: '',
  shop_address: '',
  currency: 'TJS',
  receipt_footer: 'Спасибо за покупку!',
  loyalty_points_per_unit: '0.1',
  loyalty_point_value: '0.01',
  low_stock_notifications: 'true',
  expiry_notifications: 'true',
  telegram_notifications: 'true',
  default_lead_time_days: '3',
  tax_percent: '0',
};

@ApiTags('Settings')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/settings')
export class SettingsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  @Get()
  async get(@CurrentUser() user: CurrentUserPayload) {
    const rows = await this.prisma.appSetting.findMany({ where: { userId: user.id } });
    const settings: Record<string, string> = { ...DEFAULTS };
    for (const row of rows) settings[row.key] = row.value;
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id }, select: { telegramChatId: true } });
    return {
      settings,
      telegram: {
        botConfigured: !!process.env.TELEGRAM_BOT_TOKEN,
        chatId: dbUser?.telegramChatId || '',
      },
      ai: {
        configured: !!(process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY),
        model: process.env.AI_MODEL || 'gpt-4o-mini',
      },
    };
  }

  @Post()
  @RequirePermissions('settings.manage')
  @ApiOperation({ summary: 'Сохранить настройки (ключ-значение)' })
  async save(@CurrentUser() user: CurrentUserPayload, @Body() body: Record<string, any>) {
    const payload = (body?.settings && typeof body.settings === 'object') ? body.settings : body;
    const entries = Object.entries(payload || {}).filter(([key]) => key && key !== 'settings');
    if (!entries.length) throw new BadRequestException('Нет настроек для сохранения');
    const saved: Record<string, string> = {};
    for (const [key, rawValue] of entries) {
      if (!/^[a-z0-9_.]{1,64}$/i.test(key)) throw new BadRequestException(`Некорректный ключ настройки: ${key}`);
      const value = rawValue === null || rawValue === undefined ? '' : String(rawValue);
      if (value.length > 5000) throw new BadRequestException(`Слишком длинное значение для ${key}`);
      await this.prisma.appSetting.upsert({
        where: { userId_key: { userId: user.id, key } },
        create: { userId: user.id, key, value },
        update: { value },
      });
      saved[key] = value;
    }
    await this.audit.log({ userId: user.id, userName: user.username, action: 'settings.update', entity: 'settings', details: { keys: Object.keys(saved) } });
    return { success: true, settings: saved };
  }

  @Delete(':key')
  @RequirePermissions('settings.manage')
  async remove(@CurrentUser() user: CurrentUserPayload, @Param('key') key: string) {
    await this.prisma.appSetting.deleteMany({ where: { userId: user.id, key } });
    return { success: true };
  }

  @Post('telegram/link')
  @RequirePermissions('telegram.manage')
  async linkTelegram(@CurrentUser() user: CurrentUserPayload, @Body() dto: TelegramLinkDto) {
    const chatId = (dto.chatId || '').trim();
    await this.prisma.user.update({ where: { id: user.id }, data: { telegramChatId: chatId || null } });
    await this.audit.log({ userId: user.id, userName: user.username, action: 'telegram.link', entity: 'user', entityId: user.id });
    return { success: true, chatId };
  }

  @Post('telegram/test')
  @RequirePermissions('telegram.manage')
  async testTelegram(@CurrentUser() user: CurrentUserPayload, @Body() dto: TestDto) {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      throw new BadRequestException('Telegram-бот не настроен: добавьте TELEGRAM_BOT_TOKEN в .env');
    }
    const sent = await this.notifications.sendTelegram(user.id, dto.text || '🔔 Тестовое уведомление из Shop ERP');
    if (!sent) throw new BadRequestException('Не удалось отправить сообщение. Проверьте chat_id и токен бота.');
    return { success: true };
  }
}
