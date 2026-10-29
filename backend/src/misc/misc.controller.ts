import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Dashboard & Statistics')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('api')
export class MiscController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Сводка для дашборда (выручка, остатки, прибыль)' })
  async getDashboard(@CurrentUser() user: CurrentUserPayload) {
    const products = await this.prisma.product.findMany({
      where: { userId: user.id },
      orderBy: { quantitySold: 'desc' },
    });

    let totalRemaining = 0;
    let totalSold = 0;
    let totalRevenue = 0;
    let totalCost = 0;

    for (const p of products) {
      const rec = Number(p.quantityReceived || 0);
      const sold = Number(p.quantitySold || 0);
      const sPrice = Number(p.sellingPrice || 0);
      const pPrice = Number(p.purchasePrice || 0);

      totalRemaining += Math.max(0, rec - sold);
      totalSold += sold;
      totalRevenue += sold * sPrice;
      totalCost += sold * pPrice;
    }

    const totalProfit = Math.max(0, totalRevenue - totalCost);
    const totalLoss = totalCost > totalRevenue ? totalCost - totalRevenue : 0;

    const topProducts = products.slice(0, 5).map((p) => {
      const sold = Number(p.quantitySold || 0);
      const rev = sold * Number(p.sellingPrice || 0);
      const prof = Math.max(0, rev - (sold * Number(p.purchasePrice || 0)));
      return {
        id: p.id,
        name: p.name,
        remaining_quantity: Math.max(0, Number(p.quantityReceived || 0) - sold),
        quantity_sold: sold,
        total_sold: sold,
        profit: prof.toFixed(2),
        revenue: rev.toFixed(2),
      };
    });

    const recentSales = products
      .filter((p) => Number(p.quantitySold || 0) > 0)
      .slice(0, 5)
      .map((p) => {
        const sold = Number(p.quantitySold || 0);
        const rev = sold * Number(p.sellingPrice || 0);
        const prof = Math.max(0, rev - (sold * Number(p.purchasePrice || 0)));
        return {
          id: p.id,
          product_name: p.name,
          quantity: sold,
          total_amount: rev.toFixed(2),
          profit: prof.toFixed(2),
          sold_at: p.updatedAt.toISOString(),
        };
      });

    return {
      total_products: products.length,
      total_remaining: totalRemaining,
      total_sold: totalSold,
      total_revenue: totalRevenue.toFixed(2),
      total_profit: totalProfit.toFixed(2),
      total_loss: totalLoss.toFixed(2),
      recent_sales: recentSales,
      top_products: topProducts,
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Общая статистика магазина' })
  async getStatistics(@CurrentUser() user: CurrentUserPayload) {
    const products = await this.prisma.product.findMany({
      where: { userId: user.id },
    });

    let totalReceived = 0;
    let totalSold = 0;
    let totalRemaining = 0;
    let totalRevenue = 0;
    let totalCost = 0;

    for (const p of products) {
      const rec = Number(p.quantityReceived || 0);
      const sold = Number(p.quantitySold || 0);
      const sPrice = Number(p.sellingPrice || 0);
      const pPrice = Number(p.purchasePrice || 0);

      totalReceived += rec;
      totalSold += sold;
      totalRemaining += Math.max(0, rec - sold);
      totalRevenue += sold * sPrice;
      totalCost += sold * pPrice;
    }

    const totalProfit = Math.max(0, totalRevenue - totalCost);
    const totalLoss = totalCost > totalRevenue ? totalCost - totalRevenue : 0;

    return {
      products_count: products.length,
      total_items_received: totalReceived,
      total_items_sold: totalSold,
      total_items_remaining: totalRemaining,
      total_revenue: totalRevenue.toFixed(2),
      total_cost_of_sold_goods: totalCost.toFixed(2),
      total_profit: totalProfit.toFixed(2),
      total_loss: totalLoss.toFixed(2),
    };
  }

  @Get('sales')
  @ApiOperation({ summary: 'Список всех продаж с фильтрацией, пагинацией и итоговым балансом' })
  @ApiQuery({ name: 'search', required: false, description: 'Поиск по названию товара или штрихкоду' })
  @ApiQuery({ name: 'barcode', required: false, description: 'Поиск по штрихкоду' })
  @ApiQuery({ name: 'ordering', required: false, description: 'Сортировка: sold_at, -sold_at' })
  @ApiQuery({ name: 'page', required: false, description: 'Номер страницы' })
  @ApiQuery({ name: 'limit', required: false, description: 'Количество на странице (или 10000 для скачивания всех данных)' })
  @ApiQuery({ name: 'period', required: false, description: 'Фильтр по периоду: today, week, month' })
  async getSales(
    @CurrentUser() user: CurrentUserPayload,
    @Query('search') search?: string,
    @Query('barcode') barcode?: string,
    @Query('ordering') ordering?: string,
    @Query('page') page?: string | number,
    @Query('limit') limit?: string | number,
    @Query('period') period?: string,
  ) {
    const where: any = {
      userId: user.id,
      quantitySold: { gt: 0 },
    };

    if (period === 'today') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      where.updatedAt = { gte: todayStart };
    } else if (period === 'week') {
      const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      where.updatedAt = { gte: weekStart };
    } else if (period === 'month') {
      const monthStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      where.updatedAt = { gte: monthStart };
    }

    if (barcode && barcode.trim() !== '') {
      where.barcode = { contains: barcode.trim(), mode: 'insensitive' };
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { barcode: { contains: q, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { updatedAt: 'desc' };
    if (ordering && typeof ordering === 'string') {
      const isDesc = ordering.startsWith('-');
      const field = isDesc ? ordering.slice(1) : ordering;
      const dir: 'asc' | 'desc' = isDesc ? 'desc' : 'asc';
      if (field === 'sold_at' || field === 'date') orderBy = { updatedAt: dir };
      else if (field === 'name') orderBy = { name: dir };
      else if (field === 'barcode') orderBy = { barcode: dir };
      else if (field === 'quantity') orderBy = { quantitySold: dir };
      else if (field === 'price') orderBy = { sellingPrice: dir };
    }

    const products = await this.prisma.product.findMany({
      where,
      orderBy,
    });

    let totalQuantity = 0;
    let totalReturned = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalLoss = 0;

    const allSalesList = products.map((p) => {
      const sold = Number(p.quantitySold || 0);
      const pPrice = Number(p.purchasePrice || 0);
      const sPrice = Number(p.sellingPrice || 0);
      const rev = sold * sPrice;
      const cost = sold * pPrice;
      const profit = Math.max(0, rev - cost);
      const loss = cost > rev ? cost - rev : 0;
      const ret = p.returnsCount || 0;

      totalQuantity += sold;
      totalReturned += ret;
      totalRevenue += rev;
      totalCost += cost;
      totalProfit += profit;
      totalLoss += loss;

      return {
        id: p.id,
        product: p.id,
        product_name: p.name,
        barcode: p.barcode,
        quantity: sold,
        returned_quantity: ret,
        net_quantity: sold,
        price_per_item: sPrice.toFixed(2),
        purchase_price_per_item: pPrice.toFixed(2),
        total_amount: rev.toFixed(2),
        net_total_amount: rev.toFixed(2),
        cost_amount: cost.toFixed(2),
        profit: profit.toFixed(2),
        loss: loss.toFixed(2),
        sold_at: p.updatedAt.toISOString(),
      };
    });

    const isExportOrAll = limit === 'all' || (limit && parseInt(String(limit), 10) >= 1000);
    const pageNum = Math.max(1, parseInt(String(page || 1), 10));
    const pageSize = isExportOrAll
      ? allSalesList.length
      : Math.max(1, parseInt(String(limit || 10), 10));
    const skip = (pageNum - 1) * pageSize;

    const results = isExportOrAll
      ? allSalesList
      : allSalesList.slice(skip, skip + pageSize);

    return {
      count: allSalesList.length,
      next: !isExportOrAll && skip + pageSize < allSalesList.length ? `?page=${pageNum + 1}` : null,
      previous: !isExportOrAll && pageNum > 1 ? `?page=${pageNum - 1}` : null,
      results,
      summary: {
        total_quantity: totalQuantity,
        total_returned: totalReturned,
        total_revenue: totalRevenue.toFixed(2),
        total_cost: totalCost.toFixed(2),
        total_profit: totalProfit.toFixed(2),
        total_loss: totalLoss.toFixed(2),
      },
    };
  }

  @Get('sales/:id')
  @ApiOperation({ summary: 'Получение данных продажи по ID товара' })
  async getSale(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id, userId: user.id, quantitySold: { gt: 0 } },
    });
    if (!product) {
      throw new NotFoundException('Запись продажи не найдена');
    }
    const sold = Number(product.quantitySold || 0);
    const pPrice = Number(product.purchasePrice || 0);
    const sPrice = Number(product.sellingPrice || 0);
    const rev = sold * sPrice;
    const cost = sold * pPrice;
    const profit = Math.max(0, rev - cost);
    const loss = cost > rev ? cost - rev : 0;
    const ret = product.returnsCount || 0;

    return {
      id: product.id,
      product: product.id,
      product_name: product.name,
      barcode: product.barcode,
      quantity: sold,
      returned_quantity: ret,
      net_quantity: sold,
      price_per_item: sPrice.toFixed(2),
      purchase_price_per_item: pPrice.toFixed(2),
      total_amount: rev.toFixed(2),
      net_total_amount: rev.toFixed(2),
      cost_amount: cost.toFixed(2),
      profit: profit.toFixed(2),
      loss: loss.toFixed(2),
      sold_at: product.updatedAt.toISOString(),
    };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Список категорий товаров' })
  getCategories() {
    return [
      {
        id: 'stationery',
        labelTg: 'Конставар',
        labelRu: 'Канцтовары',
        labelEn: 'Stationery',
        icon: '✏️',
        descriptionTg: 'Дафтарҳо, ручкаҳо, қалам ва лавозимоти хониш',
        descriptionRu: 'Тетради, ручки, бумага и школьные принадлежности',
      },
      {
        id: 'toys',
        labelTg: 'Игрушка',
        labelRu: 'Игрушки',
        labelEn: 'Toys',
        icon: '🧸',
        descriptionTg: 'Бозичаҳои бачагона, моделҳо, бозиҳо',
        descriptionRu: 'Детские игрушки, развивающие игры',
      },
      {
        id: 'perfumery',
        labelTg: 'Порфимерия',
        labelRu: 'Парфюмерия',
        labelEn: 'Perfumery',
        icon: '🧴',
        descriptionTg: 'Атр, хушбӯйкунандаҳо, косметика',
        descriptionRu: 'Духи, парфюмерия, косметика',
      },
      {
        id: 'accessories',
        labelTg: 'Зарядмонакҳо',
        labelRu: 'Зарядники и аксессуары',
        labelEn: 'Accessories & Chargers',
        icon: '🔌',
        descriptionTg: 'Наушникҳо, зарядмонакҳо, кабелҳо ва ғайра',
        descriptionRu: 'Наушники, зарядные устройства, кабели и прочее',
      },
    ];
  }
}

