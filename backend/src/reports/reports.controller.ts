import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsGuard, RequirePermissions } from '../common/permissions.guard';
import { dateWhere, money, periodBounds, toNum } from '../common/utils';

@ApiTags('Reports')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/reports')
export class ReportsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('summary')
  @RequirePermissions('reports.read')
  @ApiOperation({ summary: 'Сводный отчёт: выручка, прибыль, расходы, долги, склад' })
  async summary(
    @CurrentUser() user: CurrentUserPayload,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
  ) {
    const { start, end } = periodBounds(period, from, to);
    const baseWhere: any = { userId: user.id, status: { not: 'cancelled' }, ...dateWhere('createdAt', start, end) };
    if (branchId) baseWhere.branchId = parseInt(branchId, 10);
    const createdFilter = dateWhere('createdAt', start, end);

    const [orders, products, expenses, customers, debts, suppliers, purchases, branches] = await Promise.all([
      this.prisma.order.findMany({ where: baseWhere, include: { items: true } }),
      this.prisma.product.findMany({ where: { userId: user.id } }),
      this.prisma.expense.findMany({ where: { userId: user.id, ...dateWhere('expenseDate', start, end) } }),
      this.prisma.customer.findMany({ where: { userId: user.id }, select: { totalPurchases: true, totalDebt: true, bonusPoints: true } }),
      this.prisma.debt.findMany({ where: { userId: user.id } }),
      this.prisma.supplier.findMany({ where: { userId: user.id } }),
      this.prisma.purchaseOrder.findMany({ where: { userId: user.id, status: { not: 'cancelled' }, ...createdFilter } }),
      this.prisma.branch.findMany({ where: { userId: user.id } }),
    ]);

    let salesRevenue = 0;
    let returns = 0;
    let salesCost = 0;
    let returnsCost = 0;
    let salesCount = 0;
    let returnsCount = 0;
    let cash = 0;
    let card = 0;
    let debtSales = 0;
    let transfer = 0;
    let soldItems = 0;
    let returnedItems = 0;
    const productStats = new Map<number, { name: string; quantity: number; revenue: number; cost: number }>();
    const byCashier = new Map<string, { count: number; revenue: number }>();
    const byBranch = new Map<number, { count: number; revenue: number }>();
    const byDay = new Map<string, { revenue: number; profit: number; count: number }>();

    for (const o of orders) {
      const total = toNum(o.totalAmount);
      const cost = o.items.reduce((s, i) => s + toNum(i.purchasePrice) * i.quantity, 0);
      const day = o.createdAt.toISOString().slice(0, 10);
      if (o.isReturn) {
        returns += total;
        returnsCost += cost;
        returnsCount++;
        returnedItems += o.items.reduce((s, i) => s + i.quantity, 0);
        const d = byDay.get(day) || { revenue: 0, profit: 0, count: 0 };
        d.revenue -= total;
        d.profit -= total - cost;
        d.count--;
        byDay.set(day, d);
        continue;
      }
      salesRevenue += total;
      salesCost += cost;
      salesCount++;
      soldItems += o.items.reduce((s, i) => s + i.quantity, 0);
      if (o.paymentMethod === 'debt') debtSales += total;
      else if (o.paymentMethod === 'card') card += total;
      else if (o.paymentMethod === 'mixed') {
        card += toNum(o.cardAmount);
        cash += total - toNum(o.cardAmount);
      } else if (o.paymentMethod === 'transfer') transfer += total;
      else cash += total;

      for (const item of o.items) {
        if (!item.productId) continue;
        const stat = productStats.get(item.productId) || { name: item.productName, quantity: 0, revenue: 0, cost: 0 };
        stat.quantity += item.quantity;
        stat.revenue += toNum(item.total);
        stat.cost += toNum(item.purchasePrice) * item.quantity;
        productStats.set(item.productId, stat);
      }
      const cashier = o.cashierName || '—';
      const ch = byCashier.get(cashier) || { count: 0, revenue: 0 };
      ch.count++;
      ch.revenue += total;
      byCashier.set(cashier, ch);
      if (o.branchId) {
        const br = byBranch.get(o.branchId) || { count: 0, revenue: 0 };
        br.count++;
        br.revenue += total;
        byBranch.set(o.branchId, br);
      }
      const d = byDay.get(day) || { revenue: 0, profit: 0, count: 0 };
      d.revenue += total;
      d.profit += total - cost;
      d.count++;
      byDay.set(day, d);
    }

    const netRevenue = salesRevenue - returns;
    const netCost = salesCost - returnsCost;
    const grossProfit = netRevenue - netCost;
    const expensesTotal = expenses.reduce((s, e) => s + toNum(e.amount), 0);
    const netProfit = grossProfit - expensesTotal;
    let stockCost = 0;
    let stockRetail = 0;
    let lowStock = 0;
    let outOfStock = 0;
    for (const p of products) {
      const remaining = Math.max(0, p.quantityReceived - p.quantitySold);
      stockCost += remaining * toNum(p.purchasePrice);
      stockRetail += remaining * toNum(p.sellingPrice);
      if (remaining <= 0) outOfStock++;
      else if (remaining <= p.minStock) lowStock++;
    }

    const topProducts = [...productStats.entries()]
      .map(([id, s]) => ({ productId: id, name: s.name, quantity: s.quantity, revenue: money(s.revenue), profit: money(s.revenue - s.cost) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const series = [...byDay.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, v]) => ({ date, revenue: money(v.revenue), profit: money(v.profit), orders: v.count }));

    const expensesByCategory: Record<string, number> = {};
    for (const e of expenses) expensesByCategory[e.category] = money((expensesByCategory[e.category] || 0) + toNum(e.amount));

    return {
      period: { from: start, to: end, label: period || 'all' },
      sales: {
        revenue: money(salesRevenue),
        returns: money(returns),
        netRevenue: money(salesRevenue - returns),
        cost: money(netCost),
        returnsCost: money(returnsCost),
        grossProfit: money(grossProfit),
        orders: salesCount,
        returnsCount,
        avgCheck: salesCount ? money(salesRevenue / salesCount) : 0,
        itemsSold: soldItems,
        itemsReturned: returnedItems,
      },
      payments: { cash: money(cash), card: money(card), debt: money(debtSales), transfer: money(transfer) },
      expenses: {
        total: money(expensesTotal),
        count: expenses.length,
        byCategory: expensesByCategory,
      },
      netProfit: money(netProfit),
      margin: netRevenue > 0 ? money((grossProfit / netRevenue) * 100) : 0,
      stock: {
        products: products.length,
        quantity: products.reduce((s, p) => s + Math.max(0, p.quantityReceived - p.quantitySold), 0),
        valueCost: money(stockCost),
        valueRetail: money(stockRetail),
        potentialProfit: money(stockRetail - stockCost),
        lowStock,
        outOfStock,
      },
      customers: {
        count: customers.length,
        totalPurchases: money(customers.reduce((s, c) => s + toNum(c.totalPurchases), 0)),
        totalDebt: money(customers.reduce((s, c) => s + toNum(c.totalDebt), 0)),
        bonusPoints: customers.reduce((s, c) => s + c.bonusPoints, 0),
      },
      debts: {
        count: debts.filter((d) => d.status !== 'paid').length,
        outstanding: money(debts.reduce((s, d) => s + Math.max(0, toNum(d.totalAmount) - toNum(d.paidAmount)), 0)),
      },
      suppliers: {
        count: suppliers.length,
        debt: money(suppliers.reduce((s, x) => s + Math.max(0, toNum(x.totalDebt)), 0)),
      },
      purchases: {
        count: purchases.length,
        total: money(purchases.reduce((s, p) => s + toNum(p.totalAmount), 0)),
      },
      topProducts,
      series,
      cashiers: [...byCashier.entries()].map(([name, v]) => ({ name, count: v.count, revenue: money(v.revenue) })).sort((a, b) => b.revenue - a.revenue),
      branches: branches.map((b) => {
        const stat = byBranch.get(b.id) || { count: 0, revenue: 0 };
        return { id: b.id, name: b.name, orders: stat.count, revenue: money(stat.revenue) };
      }),
    };
  }

  @Get('timeseries')
  @RequirePermissions('reports.read')
  async timeseries(
    @CurrentUser() user: CurrentUserPayload,
    @Query('granularity') granularity?: string,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const { start, end } = periodBounds(period || 'month', from, to);
    const orders = await this.prisma.order.findMany({
      where: { userId: user.id, status: { not: 'cancelled' }, ...dateWhere('createdAt', start, end) },
      select: { totalAmount: true, isReturn: true, createdAt: true },
    });
    const buckets = new Map<string, { revenue: number; returns: number; count: number }>();
    const keyOf = (d: Date) => {
      if (granularity === 'month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (granularity === 'week') {
        const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const day = (x.getUTCDay() + 6) % 7;
        x.setUTCDate(x.getUTCDate() - day);
        return x.toISOString().slice(0, 10);
      }
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    for (const o of orders) {
      const k = keyOf(o.createdAt);
      const b = buckets.get(k) || { revenue: 0, returns: 0, count: 0 };
      if (o.isReturn) b.returns += toNum(o.totalAmount);
      else {
        b.revenue += toNum(o.totalAmount);
        b.count++;
      }
      buckets.set(k, b);
    }
    return [...buckets.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([label, v]) => ({
      label,
      revenue: money(v.revenue),
      returns: money(v.returns),
      net: money(v.revenue - v.returns),
      orders: v.count,
    }));
  }

  @Get('products')
  @RequirePermissions('reports.read')
  async productReport(
    @CurrentUser() user: CurrentUserPayload,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sort') sort?: string,
    @Query('limit') limit?: string,
  ) {
    const { start, end } = periodBounds(period, from, to);
    const take = Math.max(1, Math.min(500, parseInt(String(limit || 100), 10) || 100));
    const orders = await this.prisma.order.findMany({
      where: { userId: user.id, status: { not: 'cancelled' }, ...dateWhere('createdAt', start, end) },
      select: { isReturn: true, items: true },
    });
    const stats = new Map<number, { name: string; quantity: number; revenue: number; cost: number; returns: number }>();
    for (const o of orders) {
      const sign = o.isReturn ? -1 : 1;
      for (const item of o.items) {
        if (!item.productId) continue;
        const s = stats.get(item.productId) || { name: item.productName, quantity: 0, revenue: 0, cost: 0, returns: 0 };
        s.quantity += sign * item.quantity;
        s.revenue += sign * toNum(item.total);
        s.cost += sign * toNum(item.purchasePrice) * item.quantity;
        if (o.isReturn) s.returns += item.quantity;
        stats.set(item.productId, s);
      }
    }
    const rows = [...stats.entries()].map(([productId, s]) => ({
      productId,
      name: s.name,
      quantity: s.quantity,
      revenue: money(s.revenue),
      cost: money(s.cost),
      profit: money(s.revenue - s.cost),
      returns: s.returns,
      margin: s.revenue > 0 ? money(((s.revenue - s.cost) / s.revenue) * 100) : 0,
    }));
    rows.sort((a, b) => {
      if (sort === 'quantity') return b.quantity - a.quantity;
      if (sort === 'profit') return b.profit - a.profit;
      return b.revenue - a.revenue;
    });
    return { count: rows.length, results: rows.slice(0, take) };
  }

  @Get('export')
  @RequirePermissions('reports.read')
  @ApiOperation({ summary: 'Экспорт отчёта в Excel' })
  async export(
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
    @Query('type') type?: string,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const kind = type || 'sales';
    const { start, end } = periodBounds(period, from, to);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Shop ERP';
    const sheet = workbook.addWorksheet(this.sheetName(kind));

    if (kind === 'sales' || kind === 'orders') {
      const orders = await this.prisma.order.findMany({
        where: { userId: user.id, ...dateWhere('createdAt', start, end) },
        orderBy: { id: 'desc' },
        include: { items: true, customer: { select: { name: true } } },
      });
      sheet.columns = [
        { header: 'Дата', key: 'date', width: 20 },
        { header: 'Номер', key: 'number', width: 22 },
        { header: 'Тип', key: 'type', width: 12 },
        { header: 'Клиент', key: 'customer', width: 24 },
        { header: 'Кассир', key: 'cashier', width: 20 },
        { header: 'Оплата', key: 'payment', width: 14 },
        { header: 'Скидка', key: 'discount', width: 12 },
        { header: 'Сумма', key: 'total', width: 14 },
        { header: 'Товары', key: 'items', width: 60 },
      ];
      for (const o of orders) {
        sheet.addRow({
          date: o.createdAt.toLocaleString('ru-RU'),
          number: o.orderNumber,
          type: o.isReturn ? 'Возврат' : 'Продажа',
          customer: o.customer?.name || o.debtorName || '',
          cashier: o.cashierName || '',
          payment: o.paymentMethod,
          discount: toNum(o.discountAmount),
          total: toNum(o.totalAmount),
          items: o.items.map((i) => `${i.productName} x${i.quantity}`).join('; '),
        });
      }
    } else if (kind === 'products' || kind === 'stock') {
      const products = await this.prisma.product.findMany({ where: { userId: user.id }, orderBy: { name: 'asc' } });
      sheet.columns = [
        { header: 'Товар', key: 'name', width: 36 },
        { header: 'Штрихкод', key: 'barcode', width: 18 },
        { header: 'Категория', key: 'category', width: 18 },
        { header: 'Поступило', key: 'received', width: 12 },
        { header: 'Продано', key: 'sold', width: 12 },
        { header: 'Остаток', key: 'remaining', width: 12 },
        { header: 'Мин. остаток', key: 'minStock', width: 14 },
        { header: 'Закупка', key: 'purchase', width: 12 },
        { header: 'Продажа', key: 'selling', width: 12 },
        { header: 'Стоимость остатка', key: 'stockValue', width: 18 },
        { header: 'Срок годности', key: 'expiry', width: 16 },
      ];
      for (const p of products) {
        const remaining = Math.max(0, p.quantityReceived - p.quantitySold);
        sheet.addRow({
          name: p.name,
          barcode: p.barcode,
          category: p.category,
          received: p.quantityReceived,
          sold: p.quantitySold,
          remaining,
          minStock: p.minStock,
          purchase: toNum(p.purchasePrice),
          selling: toNum(p.sellingPrice),
          stockValue: money(remaining * toNum(p.purchasePrice)),
          expiry: p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('ru-RU') : '',
        });
      }
    } else if (kind === 'expenses') {
      const rows = await this.prisma.expense.findMany({
        where: { userId: user.id, ...dateWhere('expenseDate', start, end) },
        orderBy: { expenseDate: 'desc' },
      });
      sheet.columns = [
        { header: 'Дата', key: 'date', width: 16 },
        { header: 'Категория', key: 'category', width: 24 },
        { header: 'Сумма', key: 'amount', width: 14 },
        { header: 'Оплата', key: 'payment', width: 14 },
        { header: 'Получатель', key: 'recipient', width: 24 },
        { header: 'Примечание', key: 'notes', width: 40 },
      ];
      for (const e of rows) {
        sheet.addRow({
          date: e.expenseDate.toLocaleDateString('ru-RU'),
          category: e.category,
          amount: toNum(e.amount),
          payment: e.paymentMethod,
          recipient: e.recipient || '',
          notes: e.notes || '',
        });
      }
    } else if (kind === 'debts') {
      const rows = await this.prisma.debt.findMany({ where: { userId: user.id }, orderBy: { id: 'desc' } });
      sheet.columns = [
        { header: 'Клиент', key: 'customer', width: 28 },
        { header: 'Телефон', key: 'phone', width: 18 },
        { header: 'Сумма', key: 'total', width: 14 },
        { header: 'Оплачено', key: 'paid', width: 14 },
        { header: 'Остаток', key: 'remaining', width: 14 },
        { header: 'Статус', key: 'status', width: 14 },
        { header: 'Описание', key: 'description', width: 40 },
        { header: 'Дата', key: 'date', width: 18 },
      ];
      for (const d of rows) {
        sheet.addRow({
          customer: d.customerName,
          phone: d.phone || '',
          total: toNum(d.totalAmount),
          paid: toNum(d.paidAmount),
          remaining: money(toNum(d.totalAmount) - toNum(d.paidAmount)),
          status: d.status,
          description: d.description || '',
          date: d.createdAt.toLocaleDateString('ru-RU'),
        });
      }
    } else if (kind === 'purchases') {
      const rows = await this.prisma.purchaseOrder.findMany({
        where: { userId: user.id, ...dateWhere('createdAt', start, end) },
        orderBy: { id: 'desc' },
        include: { supplier: true, items: true },
      });
      sheet.columns = [
        { header: 'Дата', key: 'date', width: 18 },
        { header: 'Номер', key: 'number', width: 22 },
        { header: 'Поставщик', key: 'supplier', width: 28 },
        { header: 'Статус', key: 'status', width: 18 },
        { header: 'Позиций', key: 'items', width: 12 },
        { header: 'Сумма', key: 'total', width: 14 },
      ];
      for (const p of rows) {
        sheet.addRow({
          date: p.createdAt.toLocaleDateString('ru-RU'),
          number: p.purchaseNumber,
          supplier: p.supplier?.name || '',
          status: p.status,
          items: p.items.length,
          total: toNum(p.totalAmount),
        });
      }
    } else {
      const rows = await this.prisma.stockMovement.findMany({
        where: { userId: user.id, ...dateWhere('createdAt', start, end) },
        orderBy: { id: 'desc' },
        include: { product: { select: { name: true } } },
      });
      sheet.columns = [
        { header: 'Дата', key: 'date', width: 18 },
        { header: 'Товар', key: 'product', width: 32 },
        { header: 'Тип', key: 'type', width: 20 },
        { header: 'Кол-во', key: 'qty', width: 10 },
        { header: 'Было', key: 'before', width: 10 },
        { header: 'Стало', key: 'after', width: 10 },
        { header: 'Причина', key: 'reason', width: 40 },
        { header: 'Сотрудник', key: 'user', width: 20 },
      ];
      for (const m of rows) {
        sheet.addRow({
          date: m.createdAt.toLocaleString('ru-RU'),
          product: m.product?.name || `#${m.productId}`,
          type: m.type,
          qty: m.quantity,
          before: m.quantityBefore,
          after: m.quantityAfter,
          reason: m.reason || '',
          user: m.userName || '',
        });
      }
    }

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `report-${kind}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(Buffer.from(buffer as ArrayBuffer));
  }

  private sheetName(kind: string) {
    return (
      {
        sales: 'Продажи',
        orders: 'Продажи',
        products: 'Товары',
        stock: 'Склад',
        expenses: 'Расходы',
        debts: 'Долги',
        purchases: 'Закупки',
      } as Record<string, string>
    )[kind] || 'Движения';
  }
}
