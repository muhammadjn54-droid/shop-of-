import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { BranchService } from '../common/branch.service';
import { CurrentUserPayload } from '../auth/current-user.decorator';
import { clampLimit, clampPage, money, nextNumber, periodBounds, toNum } from '../common/utils';

export interface CheckoutInput {
  items: Array<{ productId: number | string; quantity: number | string; price?: number | string }>;
  paymentMethod?: string;
  cashGiven?: number | string;
  cardAmount?: number | string;
  customerId?: number | string;
  debtorName?: string;
  discountAmount?: number | string;
  discountPercent?: number | string;
  pointsSpent?: number | string;
  clientTransactionId?: string;
  branchId?: number | string;
  shiftId?: number | string;
  isOffline?: boolean;
}

export interface ReturnInput {
  items: Array<{ orderItemId?: number | string; productId?: number | string; quantity: number | string }>;
  paymentMethod?: string;
  reason?: string;
  clientTransactionId?: string;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly branches: BranchService,
  ) {}

  async list(
    user: CurrentUserPayload,
    q: {
      period?: string;
      from?: string;
      to?: string;
      paymentMethod?: string;
      status?: string;
      isReturn?: string;
      customerId?: string;
      cashierName?: string;
      search?: string;
      page?: string;
      limit?: string;
    },
  ) {
    const pageNum = clampPage(q.page);
    const pageSize = clampLimit(q.limit, 30, 500);
    const { start, end } = periodBounds(q.period, q.from, q.to);
    const where: any = { userId: user.id };
    if (start || end) where.createdAt = { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) };
    if (q.paymentMethod && q.paymentMethod !== 'all') where.paymentMethod = q.paymentMethod;
    if (q.status && q.status !== 'all') where.status = q.status;
    if (q.isReturn === 'true') where.isReturn = true;
    if (q.isReturn === 'false') where.isReturn = false;
    if (q.customerId) where.customerId = parseInt(q.customerId, 10);
    if (q.cashierName) where.cashierName = { contains: q.cashierName, mode: 'insensitive' };
    if (q.search?.trim()) {
      const term = q.search.trim();
      where.OR = [
        { orderNumber: { contains: term, mode: 'insensitive' } },
        { debtorName: { contains: term, mode: 'insensitive' } },
        { cashierName: { contains: term, mode: 'insensitive' } },
        { customer: { name: { contains: term, mode: 'insensitive' } } },
        { items: { some: { productName: { contains: term, mode: 'insensitive' } } } },
      ];
    }

    const [total, rows, summaryRows] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        include: { items: true, customer: { select: { name: true, phone: true } } },
      }),
      this.prisma.order.findMany({
        where,
        select: { totalAmount: true, isReturn: true, paymentMethod: true, cardAmount: true },
      }),
    ]);

    let sales = 0;
    let returns = 0;
    let cash = 0;
    let card = 0;
    let debt = 0;
    for (const o of summaryRows) {
      const amount = toNum(o.totalAmount);
      if (o.isReturn) returns += amount;
      else {
        sales += amount;
        if (o.paymentMethod === 'debt') debt += amount;
        else if (o.paymentMethod === 'card') card += amount;
        else if (o.paymentMethod === 'mixed') {
          card += toNum(o.cardAmount);
          cash += amount - toNum(o.cardAmount);
        } else cash += amount;
      }
    }

    return {
      count: total,
      page: pageNum,
      limit: pageSize,
      summary: {
        sales: money(sales),
        returns: money(returns),
        net: money(sales - returns),
        cash: money(cash),
        card: money(card),
        debt: money(debt),
      },
      results: rows.map((o) => this.format(o)),
    };
  }

  async detail(user: CurrentUserPayload, id: number) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId: user.id },
      include: { items: true, customer: true },
    });
    if (!order) throw new NotFoundException('Продажа не найдена');
    return this.format(order);
  }

  async checkout(user: CurrentUserPayload, dto: CheckoutInput) {
    const clientTransactionId = (dto.clientTransactionId || '').trim() || null;
    if (clientTransactionId) {
      const existing = await this.prisma.order.findUnique({
        where: { clientTransactionId },
        include: { items: true, customer: true },
      });
      if (existing) {
        if (existing.userId !== user.id) throw new BadRequestException('Транзакция принадлежит другому аккаунту');
        return { duplicate: true, order: this.format(existing) };
      }
    }
    if (!dto.items?.length) throw new BadRequestException('Корзина пуста');

    const grouped = new Map<number, number>();
    const requestedPrices = new Map<number, number>();
    for (const raw of dto.items) {
      const productId = parseInt(String(raw.productId), 10);
      const quantity = Math.floor(toNum(raw.quantity));
      if (!productId || quantity <= 0) throw new BadRequestException('Некорректное количество товара');
      grouped.set(productId, (grouped.get(productId) || 0) + quantity);
      if (raw.price !== undefined) requestedPrices.set(productId, money(toNum(raw.price)));
    }
    if (grouped.size > 300) throw new BadRequestException('Слишком много позиций в чеке');

    const products = await this.prisma.product.findMany({ where: { userId: user.id, id: { in: [...grouped.keys()] } } });
    if (products.length !== grouped.size) throw new BadRequestException('Один или несколько товаров не найдены');
    const productMap = new Map(products.map((p) => [p.id, p]));

    const paymentMethod = ['cash', 'card', 'transfer', 'debt', 'mixed'].includes(dto.paymentMethod || '')
      ? dto.paymentMethod!
      : 'cash';

    const customer = dto.customerId
      ? await this.prisma.customer.findFirst({ where: { id: parseInt(String(dto.customerId), 10), userId: user.id } })
      : null;
    if (dto.customerId && !customer) throw new BadRequestException('Клиент не найден');

    const lineItems: Array<{
      productId: number;
      productName: string;
      barcode: string;
      price: number;
      purchasePrice: number;
      quantity: number;
      total: number;
      quantityBefore: number;
      quantityAfter: number;
      branchId: number | null;
    }> = [];
    let subtotal = 0;
    for (const [productId, quantity] of grouped) {
      const product = productMap.get(productId)!;
      const remaining = product.quantityReceived - product.quantitySold;
      if (quantity > remaining) {
        throw new BadRequestException(`Недостаточно товара «${product.name}»: осталось ${remaining} шт.`);
      }
      const override = requestedPrices.get(productId);
      const price = override !== undefined && override >= 0 ? override : money(toNum(product.sellingPrice));
      const lineTotal = money(price * quantity);
      subtotal += lineTotal;
      lineItems.push({
        productId,
        productName: product.name,
        barcode: product.barcode,
        price,
        purchasePrice: money(toNum(product.purchasePrice)),
        quantity,
        total: lineTotal,
        quantityBefore: remaining,
        quantityAfter: remaining - quantity,
        branchId: product.branchId,
      });
    }
    subtotal = money(subtotal);

    let discountAmount = 0;
    if (dto.discountAmount !== undefined && dto.discountAmount !== null && String(dto.discountAmount) !== '') {
      discountAmount = toNum(dto.discountAmount);
    } else if (dto.discountPercent !== undefined && dto.discountPercent !== null && String(dto.discountPercent) !== '') {
      discountAmount = (subtotal * toNum(dto.discountPercent)) / 100;
    } else if (customer && toNum(customer.discountPercent) > 0) {
      discountAmount = (subtotal * toNum(customer.discountPercent)) / 100;
    }
    discountAmount = money(Math.max(0, Math.min(subtotal, discountAmount)));

    const pointValue = money(toNum(await this.setting(user.id, 'loyalty_point_value', '0.01')));
    const earnRate = toNum(await this.setting(user.id, 'loyalty_points_per_unit', '0.1'));
    let pointsSpent = Math.floor(toNum(dto.pointsSpent));
    if (pointsSpent < 0) pointsSpent = 0;
    if (pointsSpent > 0) {
      if (!customer) throw new BadRequestException('Для списания бонусов выберите клиента');
      if (pointsSpent > customer.bonusPoints) throw new BadRequestException('Недостаточно бонусов у клиента');
    }
    const maxPointsValue = Math.max(0, subtotal - discountAmount);
    let pointsValue = money(pointsSpent * pointValue);
    if (pointsValue > maxPointsValue) {
      pointsValue = maxPointsValue;
      pointsSpent = pointValue > 0 ? Math.floor(pointsValue / pointValue) : 0;
    }
    const total = money(Math.max(0, subtotal - discountAmount - pointsValue));
    const pointsEarned = customer ? Math.floor(total * Math.max(0, earnRate)) : 0;

    if (paymentMethod === 'debt' && !customer && !dto.debtorName?.trim()) {
      throw new BadRequestException('Укажите имя должника или выберите клиента');
    }

    let cashGiven: number | null = null;
    let changeAmount: number | null = null;
    let cardAmount = 0;
    if (paymentMethod === 'cash') {
      cashGiven = dto.cashGiven !== undefined && dto.cashGiven !== null && String(dto.cashGiven) !== '' ? money(toNum(dto.cashGiven)) : total;
      if (cashGiven < total) throw new BadRequestException(`Недостаточно наличных: нужно ${total.toFixed(2)}`);
      changeAmount = money(cashGiven - total);
    } else if (paymentMethod === 'card') {
      cardAmount = total;
    } else if (paymentMethod === 'mixed') {
      cardAmount = money(Math.max(0, Math.min(total, toNum(dto.cardAmount))));
      const cashNeeded = money(total - cardAmount);
      cashGiven = dto.cashGiven !== undefined && dto.cashGiven !== null && String(dto.cashGiven) !== '' ? money(toNum(dto.cashGiven)) : cashNeeded;
      if (cashGiven < cashNeeded) throw new BadRequestException(`Недостаточно наличных: нужно ${cashNeeded.toFixed(2)}`);
      changeAmount = money(cashGiven - cashNeeded);
    } else {
      cashGiven = 0;
      changeAmount = 0;
    }

    const shiftId = await this.resolveShift(user.id, dto.shiftId ? parseInt(String(dto.shiftId), 10) : null);
    const branchId = await this.branches.resolveBranchId(
      user.id,
      dto.branchId ? parseInt(String(dto.branchId), 10) : lineItems.find((i) => i.branchId)?.branchId || null,
    );

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: nextNumber('ORD'),
          userId: user.id,
          totalAmount: total,
          paymentMethod,
          cashGiven,
          changeAmount,
          cardAmount: money(cardAmount),
          debtorName: paymentMethod === 'debt' ? customer?.name || dto.debtorName?.trim() || null : dto.debtorName?.trim() || null,
          cashierName: user.username,
          branchId,
          clientTransactionId,
          customerId: customer?.id || null,
          discountAmount,
          pointsEarned,
          pointsSpent,
          shiftId,
          status: 'completed',
          isOffline: !!dto.isOffline,
          items: {
            create: lineItems.map((i) => ({
              productId: i.productId,
              productName: i.productName,
              barcode: i.barcode,
              price: i.price,
              purchasePrice: i.purchasePrice,
              quantity: i.quantity,
              total: i.total,
            })),
          },
        },
        include: { items: true, customer: true },
      });

      for (const item of lineItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantitySold: { increment: item.quantity }, salesCount: { increment: 1 } },
        });
        await tx.stockMovement.create({
          data: {
            userId: user.id,
            productId: item.productId,
            branchId,
            type: 'sale',
            quantity: -item.quantity,
            quantityBefore: item.quantityBefore,
            quantityAfter: item.quantityAfter,
            costPrice: item.purchasePrice,
            sellingPrice: item.price,
            reason: `Продажа ${created.orderNumber}`,
            referenceId: String(created.id),
            userName: user.username,
          },
        });
      }

      if (customer) {
        const bonusPoints = Math.max(0, customer.bonusPoints - pointsSpent + pointsEarned);
        await tx.customer.update({
          where: { id: customer.id },
          data: {
            bonusPoints,
            totalPurchases: { increment: total },
            ...(paymentMethod === 'debt' ? { totalDebt: { increment: total } } : {}),
          },
        });
        if (pointsEarned > 0) {
          await tx.loyaltyTransaction.create({
            data: { customerId: customer.id, points: pointsEarned, type: 'earn', description: `Начисление за ${created.orderNumber}`, orderId: created.id },
          });
        }
        if (pointsSpent > 0) {
          await tx.loyaltyTransaction.create({
            data: { customerId: customer.id, points: -pointsSpent, type: 'redeem', description: `Списание по ${created.orderNumber}`, orderId: created.id },
          });
        }
      }

      if (paymentMethod === 'debt') {
        await tx.debt.create({
          data: {
            userId: user.id,
            customerId: customer?.id || null,
            customerName: customer?.name || dto.debtorName?.trim() || 'Клиент',
            phone: customer?.phone || null,
            totalAmount: total,
            paidAmount: 0,
            description: `Продажа ${created.orderNumber}`,
            status: 'active',
          },
        });
      }

      if (shiftId) {
        const cashPart = paymentMethod === 'cash' ? total : paymentMethod === 'mixed' ? money(total - cardAmount) : 0;
        const cardPart = paymentMethod === 'card' ? total : paymentMethod === 'mixed' ? cardAmount : 0;
        await tx.cashierShift.update({
          where: { id: shiftId },
          data: {
            salesCount: { increment: 1 },
            cashSales: { increment: cashPart },
            cardSales: { increment: cardPart },
            debtSales: { increment: paymentMethod === 'debt' ? total : 0 },
          },
        });
      }

      return created;
    });

    await this.audit.log({
      userId: user.id,
      userName: user.username,
      action: 'order.checkout',
      entity: 'order',
      entityId: order.id,
      details: { total, paymentMethod, items: lineItems.length, offline: !!dto.isOffline },
    });
    return { duplicate: false, order: this.format(order) };
  }

  async returnOrder(user: CurrentUserPayload, id: number, dto: ReturnInput) {
    const clientTransactionId = (dto.clientTransactionId || '').trim() || null;
    if (clientTransactionId) {
      const existing = await this.prisma.order.findUnique({ where: { clientTransactionId }, include: { items: true, customer: true } });
      if (existing) {
        if (existing.userId !== user.id) throw new BadRequestException('Транзакция принадлежит другому аккаунту');
        return { duplicate: true, order: this.format(existing) };
      }
    }
    const parent = await this.prisma.order.findFirst({
      where: { id, userId: user.id },
      include: { items: true, customer: true },
    });
    if (!parent) throw new NotFoundException('Продажа не найдена');
    if (parent.isReturn) throw new BadRequestException('Нельзя оформить возврат по возврату');
    if (parent.status === 'cancelled') throw new BadRequestException('Продажа отменена');
    if (!dto.items?.length) throw new BadRequestException('Укажите товары для возврата');

    const already = await this.prisma.order.findMany({
      where: { userId: user.id, parentOrderId: parent.id, isReturn: true, status: { not: 'cancelled' } },
      include: { items: true },
    });
    const returnedMap = new Map<number, number>();
    for (const r of already) for (const i of r.items) if (i.productId) returnedMap.set(i.productId, (returnedMap.get(i.productId) || 0) + i.quantity);

    const parentSubtotal = parent.items.reduce((s, i) => s + toNum(i.total), 0);
    const ratio = parentSubtotal > 0 ? toNum(parent.totalAmount) / parentSubtotal : 1;

    const returnLines: Array<{ item: any; quantity: number; lineTotal: number }> = [];
    for (const raw of dto.items) {
      const qty = Math.floor(toNum(raw.quantity));
      if (qty <= 0) continue;
      const parentItem = raw.orderItemId
        ? parent.items.find((i) => i.id === parseInt(String(raw.orderItemId), 10))
        : parent.items.find((i) => i.productId === parseInt(String(raw.productId), 10));
      if (!parentItem) throw new BadRequestException('Товар не найден в исходной продаже');
      const alreadyQty = parentItem.productId ? returnedMap.get(parentItem.productId) || 0 : 0;
      const available = parentItem.quantity - alreadyQty;
      if (qty > available) throw new BadRequestException(`По «${parentItem.productName}» можно вернуть не более ${available} шт.`);
      if (parentItem.productId) returnedMap.set(parentItem.productId, alreadyQty + qty);
      const lineBase = (toNum(parentItem.total) * qty) / parentItem.quantity;
      returnLines.push({ item: parentItem, quantity: qty, lineTotal: money(lineBase) });
    }
    if (!returnLines.length) throw new BadRequestException('Укажите корректное количество для возврата');

    const itemsSum = money(returnLines.reduce((s, l) => s + l.lineTotal, 0));
    const refundTotal = money(itemsSum * ratio);
    const returnDiscount = money(Math.max(0, itemsSum - refundTotal));

    let method = dto.paymentMethod;
    if (!method) method = parent.paymentMethod === 'mixed' ? 'cash' : parent.paymentMethod;
    if (!['cash', 'card', 'transfer'].includes(method!)) method = 'cash';

    const shiftId = await this.resolveShift(user.id, null);
    const branchId = parent.branchId;

    const returnOrder = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: nextNumber('RET'),
          userId: user.id,
          totalAmount: refundTotal,
          paymentMethod: method!,
          cashGiven: method === 'cash' ? refundTotal : 0,
          changeAmount: 0,
          cashierName: user.username,
          branchId,
          clientTransactionId,
          customerId: parent.customerId,
          discountAmount: returnDiscount,
          isReturn: true,
          parentOrderId: parent.id,
          shiftId,
          status: 'completed',
          items: {
            create: returnLines.map((l) => ({
              productId: l.item.productId,
              productName: l.item.productName,
              barcode: l.item.barcode,
              price: l.item.price,
              purchasePrice: l.item.purchasePrice,
              quantity: l.quantity,
              total: l.lineTotal,
            })),
          },
        },
        include: { items: true, customer: true },
      });

      for (const line of returnLines) {
        if (!line.item.productId) continue;
        const product = await tx.product.findFirst({ where: { id: line.item.productId, userId: user.id } });
        if (!product) continue;
        const before = product.quantityReceived - product.quantitySold;
        const after = before + line.quantity;
        await tx.product.update({
          where: { id: product.id },
          data: {
            quantitySold: { decrement: Math.min(line.quantity, product.quantitySold) },
            returnsCount: { increment: 1 },
          },
        });
        await tx.stockMovement.create({
          data: {
            userId: user.id,
            productId: product.id,
            branchId,
            type: 'return',
            quantity: line.quantity,
            quantityBefore: before,
            quantityAfter: after,
            costPrice: toNum(product.purchasePrice),
            sellingPrice: toNum(line.item.price),
            reason: `Возврат ${created.orderNumber}${dto.reason ? `: ${dto.reason}` : ''}`,
            referenceId: String(created.id),
            userName: user.username,
          },
        });
      }

      let debtReduction = 0;
      if (parent.paymentMethod === 'debt') {
        const sourceDebt = await tx.debt.findFirst({
          where: { userId: user.id, description: `Продажа ${parent.orderNumber}` },
        });
        if (sourceDebt) {
          const debtRemaining = Math.max(
            0,
            toNum(sourceDebt.totalAmount) - toNum(sourceDebt.paidAmount),
          );
          debtReduction = Math.min(refundTotal, debtRemaining);
          if (debtReduction > 0) {
            const newPaid = money(toNum(sourceDebt.paidAmount) + debtReduction);
            await tx.debtPayment.create({
              data: {
                debtId: sourceDebt.id,
                amount: debtReduction,
                note: `Возврат по ${created.orderNumber}`,
              },
            });
            await tx.debt.update({
              where: { id: sourceDebt.id },
              data: {
                paidAmount: newPaid,
                status:
                  newPaid >= toNum(sourceDebt.totalAmount) ? 'paid' : 'active',
              },
            });
          }
        } else {
          debtReduction = refundTotal;
        }
      }

      if (parent.customerId && parent.customer) {
        const pointsReversal = toNum(parent.totalAmount) > 0
          ? Math.round((parent.pointsEarned * refundTotal) / toNum(parent.totalAmount))
          : 0;
        const bonusPoints = Math.max(0, parent.customer.bonusPoints - pointsReversal);
        await tx.customer.update({
          where: { id: parent.customerId },
          data: {
            bonusPoints,
            totalPurchases: { decrement: refundTotal },
            ...(parent.paymentMethod === 'debt'
              ? { totalDebt: { decrement: Math.min(debtReduction, toNum(parent.customer.totalDebt)) } }
              : {}),
          },
        });
        if (pointsReversal > 0) {
          await tx.loyaltyTransaction.create({
            data: { customerId: parent.customerId, points: -pointsReversal, type: 'return', description: `Возврат по ${parent.orderNumber}`, orderId: created.id },
          });
        }
      }

      if (shiftId) {
        await tx.cashierShift.update({
          where: { id: shiftId },
          data: {
            returnsCash: { increment: method === 'cash' ? refundTotal : 0 },
            cardSales: { decrement: method === 'card' ? refundTotal : 0 },
          },
        });
      }

      return created;
    });

    await this.audit.log({
      userId: user.id,
      userName: user.username,
      action: 'order.return',
      entity: 'order',
      entityId: returnOrder.id,
      details: { parentId: parent.id, refundTotal, method },
    });
    return { duplicate: false, order: this.format(returnOrder) };
  }

  format(o: any) {
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      totalAmount: money(toNum(o.totalAmount)),
      paymentMethod: o.paymentMethod,
      cashGiven: o.cashGiven != null ? money(toNum(o.cashGiven)) : null,
      changeAmount: o.changeAmount != null ? money(toNum(o.changeAmount)) : null,
      cardAmount: money(toNum(o.cardAmount)),
      debtorName: o.debtorName || '',
      cashierName: o.cashierName || '',
      branchId: o.branchId,
      customerId: o.customerId,
      customerName: o.customer?.name || '',
      customerPhone: o.customer?.phone || '',
      discountAmount: money(toNum(o.discountAmount)),
      isReturn: o.isReturn,
      parentOrderId: o.parentOrderId,
      pointsEarned: o.pointsEarned,
      pointsSpent: o.pointsSpent,
      shiftId: o.shiftId,
      status: o.status,
      isOffline: o.isOffline,
      createdAt: o.createdAt,
      items: (o.items || []).map((i: any) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        barcode: i.barcode || '',
        price: money(toNum(i.price)),
        purchasePrice: money(toNum(i.purchasePrice)),
        quantity: i.quantity,
        total: money(toNum(i.total)),
      })),
    };
  }

  private async resolveShift(userId: number, requested?: number | null): Promise<number | null> {
    if (requested) {
      const shift = await this.prisma.cashierShift.findFirst({ where: { id: requested, userId, status: 'open' } });
      if (!shift) throw new BadRequestException('Смена не найдена или закрыта');
      return shift.id;
    }
    const open = await this.prisma.cashierShift.findFirst({ where: { userId, status: 'open' }, orderBy: { id: 'desc' } });
    return open?.id || null;
  }

  private async setting(userId: number, key: string, fallback: string): Promise<string> {
    const row = await this.prisma.appSetting.findUnique({ where: { userId_key: { userId, key } } });
    return row?.value ?? fallback;
  }
}
