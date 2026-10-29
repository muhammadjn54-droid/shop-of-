import { BadRequestException, Body, Controller, Get, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsGuard, RequirePermissions } from '../common/permissions.guard';
import { money, toNum } from '../common/utils';

class ChatDto {
  @IsString() message: string;
  @IsOptional() @IsArray() history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

@ApiTags('AI Assistant')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('ai.use')
@Controller('api/ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get('insights')
  @ApiOperation({ summary: 'Автоматические бизнес-инсайты без внешнего AI' })
  async insights(@CurrentUser() user: CurrentUserPayload) {
    const data = await this.collect(user.id);
    return {
      generatedAt: new Date(),
      insights: data.insights,
      metrics: data.metrics,
      recommendations: data.recommendations,
      stats: {
        revenueToday: data.revenueToday,
        revenue30: data.revenue30,
        profit30: data.profit30,
        outstandingDebt: data.outstandingDebt,
        lowStockCount: data.lowStock.length,
        stockValue: data.stockValue,
      },
    };
  }

  @Post('chat')
  @ApiOperation({ summary: 'Чат с AI-ассистентом по данным магазина' })
  async chat(@CurrentUser() user: CurrentUserPayload, @Body() dto: ChatDto) {
    const message = (dto.message || '').trim();
    if (!message) throw new BadRequestException('Введите вопрос');
    const data = await this.collect(user.id);
    const geminiKey = process.env.GEMINI_API_KEY || (process.env.AI_API_KEY?.startsWith('AQ.') || process.env.AI_API_KEY?.startsWith('AIza') ? process.env.AI_API_KEY : undefined);
    const key = geminiKey || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY;
    if (!key) {
      return {
        mode: 'local',
        reply: this.localReply(message, data),
        insights: data.insights,
        note: 'Внешний AI не настроен. Ответ сформирован на основе аналитики магазина.',
      };
    }

    const model = process.env.AI_MODEL || (geminiKey ? 'gemini-3.5-flash-lite' : 'gpt-4o-mini');
    const system = `Ту — ботаҷриба ва ҳушмандтарин AI-ёрдамчии соҳиби мағоза ҳастӣ. Номи ту «AI ёрдамчӣ».
Агар корбар бо забони тоҷикӣ савол диҳад, бо тоҷикии тоза, содда ва фаҳмо ҷавоб деҳ.
Агар бо русӣ савол диҳад, бо русӣ ҷавоб деҳ.
Ҳамеша дар асоси маълумотҳои воқеии мағоза (фурӯш, боқимондаи молҳо, қарзҳо ва хароҷот), ки дар поён оварда шудаанд, ҷавоб ва маслиҳатҳои амалӣ деҳ.
Рақамҳоро бофта набарор. Ҷавобҳоятро бо бандҳо ва рӯйхатҳо зебо пешниҳод кун.
КОНТЕКСТИ МАҒОЗА (JSON):
${JSON.stringify(data.aiContext)}`;

    const history = (dto.history || []).slice(-8).map((h) => ({
      role: h.role === 'assistant' ? 'assistant' : 'user',
      content: String(h.content || '').slice(0, 2000),
    }));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      if (geminiKey) {
        // Native Google Gemini API (gemini-3.5-flash-lite with retry)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        let res: Response | null = null;
        let lastErr: any = null;

        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: system }] },
                contents: [
                  ...history.map((h) => ({
                    role: h.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: h.content }],
                  })),
                  { role: 'user', parts: [{ text: message }] },
                ],
                generationConfig: {
                  temperature: 0.3,
                  maxOutputTokens: 1200,
                },
              }),
              signal: controller.signal,
            });
            if (res.ok) break;
          } catch (e) {
            lastErr = e;
            if (attempt < 2) await new Promise((r) => setTimeout(r, 800));
          }
        }

        if (!res && lastErr) throw lastErr;
        const payload: any = await res!.json().catch(() => ({}));
        if (!res!.ok) throw new Error(payload?.error?.message || `Gemini HTTP ${res!.status}`);
        const reply = payload?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!reply) throw new Error('Пустой ответ от Gemini');
        return { mode: 'ai', model, reply, insights: data.insights };
      }

      // OpenAI / OpenRouter format
      const base = (process.env.AI_BASE_URL || (process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY
        ? 'https://openrouter.ai/api/v1'
        : 'https://api.openai.com/v1')).replace(/\/+$/, '');

      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          ...(base.includes('openrouter') ? { 'HTTP-Referer': process.env.PUBLIC_URL || 'http://localhost', 'X-Title': 'Shop ERP' } : {}),
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          max_tokens: 900,
          messages: [{ role: 'system', content: system }, ...history, { role: 'user', content: message }],
        }),
        signal: controller.signal,
      });

      const payload: any = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error?.message || `HTTP ${res.status}`);
      const reply = payload?.choices?.[0]?.message?.content?.trim();
      if (!reply) throw new Error('Пустой ответ AI');
      return { mode: 'ai', model, reply, insights: data.insights };
    } catch (err) {
      this.logger.warn(`AI request failed: ${(err as Error).message}`);
      return {
        mode: 'local',
        reply: this.localReply(message, data),
        insights: data.insights,
        note: `AI пайваст аст, вале муваққатан аз таҳлили маҳаллӣ истифода шуд (${(err as Error).message}).`,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async collect(userId: number) {
    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const since7 = new Date(now.getTime() - 7 * 86400000);
    const since30 = new Date(now.getTime() - 30 * 86400000);

    const [orders, products, debts, expenses, customers] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId, createdAt: { gte: since30 }, status: { not: 'cancelled' } },
        include: { items: true },
      }),
      this.prisma.product.findMany({ where: { userId } }),
      this.prisma.debt.findMany({ where: { userId } }),
      this.prisma.expense.findMany({ where: { userId, expenseDate: { gte: since30 } } }),
      this.prisma.customer.findMany({ where: { userId }, select: { totalPurchases: true, totalDebt: true, bonusPoints: true } }),
    ]);

    const stats = new Map<number, { name: string; qty30: number; revenue30: number; profit30: number; soldToday: number }>();
    let revenueToday = 0;
    let revenue7 = 0;
    let revenue30 = 0;
    let profit30 = 0;
    let returns30 = 0;
    for (const o of orders) {
      const amount = toNum(o.totalAmount);
      const cost = o.items.reduce((s, i) => s + toNum(i.purchasePrice) * i.quantity, 0);
      if (o.isReturn) {
        if (o.createdAt >= since30) returns30 += amount;
        continue;
      }
      if (o.createdAt >= since30) {
        revenue30 += amount;
        profit30 += amount - cost;
      }
      if (o.createdAt >= since7) revenue7 += amount;
      if (o.createdAt >= startToday) revenueToday += amount;
      for (const item of o.items) {
        if (!item.productId) continue;
        const s = stats.get(item.productId) || { name: item.productName, qty30: 0, revenue30: 0, profit30: 0, soldToday: 0 };
        s.qty30 += item.quantity;
        s.revenue30 += toNum(item.total);
        s.profit30 += toNum(item.total) - toNum(item.purchasePrice) * item.quantity;
        if (o.createdAt >= startToday) s.soldToday += item.quantity;
        stats.set(item.productId, s);
      }
    }

    const lowStock = products
      .map((p) => {
        const remaining = p.quantityReceived - p.quantitySold;
        const s = stats.get(p.id);
        const avgDaily = (s?.qty30 || 0) / 30;
        const lead = Math.max(1, p.leadTimeDays || 3);
        const daysLeft = avgDaily > 0 ? remaining / avgDaily : null;
        const recommended = Math.max(0, Math.ceil(avgDaily * lead) + Math.max(0, p.minStock) - remaining);
        return {
          id: p.id,
          name: p.name,
          remaining,
          minStock: p.minStock,
          avgDaily: Math.round(avgDaily * 100) / 100,
          daysLeft: daysLeft !== null ? Math.round(daysLeft * 10) / 10 : null,
          recommended,
          purchasePrice: toNum(p.purchasePrice),
          stockValue: money(remaining * toNum(p.purchasePrice)),
        };
      })
      .filter((p) => p.remaining <= p.minStock || (p.daysLeft !== null && p.daysLeft <= 7))
      .sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999));

    const expiring = products
      .filter((p) => p.expiryDate)
      .map((p) => ({
        name: p.name,
        daysLeft: Math.ceil((new Date(p.expiryDate as Date).getTime() - now.getTime()) / 86400000),
        remaining: p.quantityReceived - p.quantitySold,
      }))
      .filter((p) => p.daysLeft <= 30)
      .sort((a, b) => a.daysLeft - b.daysLeft);

    const slowMovers = products
      .filter((p) => (p.quantityReceived - p.quantitySold) > 0 && !(stats.get(p.id)?.qty30 > 0))
      .map((p) => ({
        name: p.name,
        remaining: p.quantityReceived - p.quantitySold,
        stockValue: money((p.quantityReceived - p.quantitySold) * toNum(p.purchasePrice)),
      }))
      .sort((a, b) => b.stockValue - a.stockValue)
      .slice(0, 10);

    const topProducts = [...stats.entries()]
      .map(([id, s]) => ({ id, name: s.name, qty30: s.qty30, revenue30: money(s.revenue30), profit30: money(s.profit30) }))
      .sort((a, b) => b.revenue30 - a.revenue30)
      .slice(0, 8);

    const expenses30 = expenses.reduce((s, e) => s + toNum(e.amount), 0);
    const outstandingDebt = debts.reduce((s, d) => s + Math.max(0, toNum(d.totalAmount) - toNum(d.paidAmount)), 0);
    const stockValue = products.reduce((s, p) => s + Math.max(0, p.quantityReceived - p.quantitySold) * toNum(p.purchasePrice), 0);
    const avgDaily30 = revenue30 / 30;
    const todayTrend = avgDaily30 > 0 ? money(((revenueToday - avgDaily30) / avgDaily30) * 100) : 0;

    const insights: Array<{ severity: 'info' | 'warning' | 'critical' | 'success'; title: string; message: string; action?: string }> = [];
    insights.push({
      severity: todayTrend >= 0 ? 'success' : 'warning',
      title: 'Динамика продаж',
      message: `Сегодня ${money(revenueToday).toFixed(2)} TJS, средний день за 30 дней ${money(avgDaily30).toFixed(2)} TJS (${todayTrend > 0 ? '+' : ''}${todayTrend}%).`,
      action: todayTrend < -20 ? 'Проверьте остатки популярных товаров и активность кассиров' : undefined,
    });
    if (lowStock.length) {
      insights.push({
        severity: lowStock.some((p) => p.remaining <= 0) ? 'critical' : 'warning',
        title: 'Требуется пополнение',
        message: `${lowStock.length} SKU на грани дефицита: ${lowStock.slice(0, 5).map((p) => `${p.name} (${p.remaining} шт.)`).join(', ')}.`,
        action: 'Сформируйте закупку из раздела Smart Stock',
      });
    }
    if (expiring.length) {
      insights.push({
        severity: expiring.some((p) => p.daysLeft <= 7) ? 'critical' : 'warning',
        title: 'Сроки годности',
        message: `${expiring.length} позиций истекают в ближайшие 30 дней: ${expiring.slice(0, 5).map((p) => `${p.name} (${p.daysLeft} дн.)`).join(', ')}.`,
        action: 'Запустите распродажу или верните поставщику',
      });
    }
    if (slowMovers.length) {
      insights.push({
        severity: 'info',
        title: 'Неликвидные остатки',
        message: `${slowMovers.length} позиций без продаж 30 дней на ${money(slowMovers.reduce((s, x) => s + x.stockValue, 0)).toFixed(2)} TJS.`,
        action: 'Снизьте цену или проведите акцию',
      });
    }
    if (outstandingDebt > 0) {
      insights.push({
        severity: outstandingDebt > revenue30 * 0.3 ? 'warning' : 'info',
        title: 'Дебиторская задолженность',
        message: `Клиенты должны ${money(outstandingDebt).toFixed(2)} TJS (${debts.filter((d) => d.status !== 'paid').length} долгов).`,
        action: 'Напомните должникам через Telegram/телефон',
      });
    }
    insights.push({
      severity: profit30 - expenses30 > 0 ? 'success' : 'warning',
      title: 'Финансовый результат за 30 дней',
      message: `Валовая прибыль ${money(profit30).toFixed(2)} TJS, расходы ${money(expenses30).toFixed(2)} TJS, чистая ${money(profit30 - expenses30).toFixed(2)} TJS.`,
      action: expenses30 > profit30 * 0.5 ? 'Пересмотрите крупные статьи расходов' : undefined,
    });

    const aiContext = {
      currency: 'TJS',
      today: { revenue: money(revenueToday), orders: orders.filter((o) => !o.isReturn && o.createdAt >= startToday).length },
      last7Days: { revenue: money(revenue7) },
      last30Days: { revenue: money(revenue30), returns: money(returns30), grossProfit: money(profit30), expenses: money(expenses30), netProfit: money(profit30 - expenses30) },
      products: { count: products.length, stockValue: money(stockValue), lowStock: lowStock.slice(0, 10), expiring: expiring.slice(0, 10), slowMovers },
      topProducts,
      debts: { count: debts.filter((d) => d.status !== 'paid').length, outstanding: money(outstandingDebt) },
      customers: { count: customers.length, totalDebt: money(customers.reduce((s, c) => s + toNum(c.totalDebt), 0)), bonusPoints: customers.reduce((s, c) => s + c.bonusPoints, 0) },
    };
    return {
      insights,
      metrics: aiContext,
      recommendations: lowStock.slice(0, 10).map((p) => ({
        productId: p.id,
        name: p.name,
        recommendedQuantity: p.recommended,
        estimatedCost: money(p.recommended * p.purchasePrice),
        reason: p.remaining <= p.minStock ? 'Остаток ниже минимума' : 'Заканчивается при текущем темпе продаж',
      })),
      aiContext,
      lowStock,
      topProducts,
      slowMovers,
      revenueToday,
      revenue30,
      profit30,
      expenses30,
      outstandingDebt,
      stockValue: money(stockValue),
    };
  }

  private localReply(message: string, data: Awaited<ReturnType<AiController['collect']>>) {
    const q = message.toLowerCase();
    const isTg = /[\u04b3\u04b7\u0497\u04e3\u04ef]|чи|мол|кам|карз|қарз|фуруш|фурӯш|савдо|имруз|имрӯз|бихар|харам|бихарам|боки|боқӣ|маслихат|маслиҳат|ёрдам/.test(q);

    const topTg = data.topProducts.slice(0, 5).map((p) => `• ${p.name}: ${p.revenue30.toFixed(2)} сомонӣ (${p.qty30} дона)`).join('\n');
    const topRu = data.topProducts.slice(0, 5).map((p) => `• ${p.name}: ${p.revenue30.toFixed(2)} TJS (${p.qty30} шт.)`).join('\n');

    // 1. Закупки / Молҳои кам / Склад
    if (/закуп|пополн|smart|склад|остат|мол|кам|харид|анбор|чи бихарам|чиро бихарам|чиро харам|бихарам|бокимонда|боқимонда/.test(q)) {
      const restock = data.recommendations.slice(0, 8);
      if (isTg) {
        return restock.length
          ? `Молҳое, ки харидан лозим аст:\n${restock.map((r) => `• ${r.name} — ${r.recommendedQuantity} дона (~${r.estimatedCost.toFixed(2)} сомонӣ): ${r.reason}`).join('\n')}\n\nМаблағи тахминии харид: ${money(data.recommendations.reduce((s, r) => s + r.estimatedCost, 0)).toFixed(2)} сомонӣ.`
          : 'Ҳамаи молҳо дар анбор ба қадри кофӣ ҳастанд. Зарурати хариди таъҷилӣ нест.';
      }
      return restock.length
        ? `Рекомендую закупить:\n${restock.map((r) => `• ${r.name} — ${r.recommendedQuantity} шт. (~${r.estimatedCost.toFixed(2)} TJS): ${r.reason}`).join('\n')}\n\nОбщая оценка закупки: ${money(data.recommendations.reduce((s, r) => s + r.estimatedCost, 0)).toFixed(2)} TJS.`
        : 'Критичных позиций для закупки нет. Остатки в норме.';
    }

    // 2. Долги / Қарзҳо
    if (/долг|дебитор|задолж|карз|қарз|карздор|қарздор/.test(q)) {
      if (isTg) {
        return `Қарзи умумӣ аз муштариён: ${data.outstandingDebt.toFixed(2)} сомонӣ.\nТавсия: Аввал бо қарздорони калон тамос гиред ва санаи баргардонидани маблағро муайян кунед.`;
      }
      return `Дебиторская задолженность: ${data.outstandingDebt.toFixed(2)} TJS. Рекомендую начать с крупнейших должников и зафиксировать обещанные даты оплаты.`;
    }

    // 3. Прибыль / Фоида ва молия
    if (/прибыл|финанс|расход|маржа|фоида|даромад|харочот|хароҷот/.test(q)) {
      if (isTg) {
        const net = money(data.profit30 - data.expenses30);
        return `Натиҷаи молиявии 30 рӯзи охир:\n• Фурӯши умумӣ: ${data.revenue30.toFixed(2)} сомонӣ\n• Фоидаи умумӣ: ${data.profit30.toFixed(2)} сомонӣ\n• Фоидаи соф: ${net.toFixed(2)} сомонӣ\n${data.profit30 > 0 ? 'Нишондиҳандаи фоида мусбат аст!' : 'Лутфан ба хароҷотҳо диққат диҳед.'}`;
      }
      return `За 30 дней: выручка ${data.revenue30.toFixed(2)} TJS, валовая прибыль ${data.profit30.toFixed(2)} TJS, чистая прибыль ${money(data.profit30 - data.expenses30).toFixed(2)} TJS.\n${data.expenses30 > data.profit30 * 0.5 ? 'Расходы съедают больше половины прибыли — проверьте крупнейшие статьи.' : 'Доля расходов под контролем.'}`;
    }

    // 4. Продажи за сегодня / Фурӯши имрӯз
    if (/сегодня|имруз|имрӯз|савдои имруз|савдои имрӯз/.test(q)) {
      if (isTg) {
        return `Фурӯши имрӯз то ҳол: ${data.revenueToday.toFixed(2)} сомонӣ.\nБарои дидани тафсилоти ҳар як чек метавонед ба саҳифаи «Хазина (POS)» ё «Фурӯш» гузаред.`;
      }
      return `Выручка за сегодня: ${data.revenueToday.toFixed(2)} TJS.\nПодробности по чекам доступны в разделе «Продажи» и «POS».`;
    }

    // 5. Топ товаров / Фурӯши беҳтарин
    if (/товар|топ|прода|фуруш|фурӯш|савдо|бехтарин|беҳтарин/.test(q)) {
      if (isTg) {
        return `Фурӯши имрӯз: ${data.revenueToday.toFixed(2)} сомонӣ, 30 рӯзи охир: ${data.revenue30.toFixed(2)} сомонӣ.\nМолҳои серфурӯш (Топ-5):\n${topTg || '• Маълумот дар бораи фурӯш нест'}`;
      }
      return `Сегодня выручка ${data.revenueToday.toFixed(2)} TJS, за 30 дней ${data.revenue30.toFixed(2)} TJS.\nТоп товаров:\n${topRu || '• Нет данных о продажах'}\n\n${data.insights.map((i) => `• ${i.title}: ${i.message}`).join('\n')}`;
    }

    // 6. Общий ответ / Хулоса
    if (isTg) {
      return `Хулосаи ҳолати мағоза:\n${data.insights.map((i) => `• ${i.title}: ${i.message}`).join('\n')}\n\nМан метавонам оид ба молҳои каммонда, қарзҳо, фоида ва фурӯш кӯмак кунам. Саволи худро нависед!`;
    }
    return `Краткая сводка:\n${data.insights.map((i) => `• ${i.title}: ${i.message}`).join('\n')}\n\nМогу подробнее рассказать о закупках, остатках, долгах или прибыли — уточните вопрос.`;
  }
}
