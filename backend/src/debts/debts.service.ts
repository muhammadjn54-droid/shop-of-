import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { money, toNum } from '../common/utils';

@Injectable()
export class DebtsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number) {
    const debts = await this.prisma.debt.findMany({
      where: { userId },
      include: { payments: { orderBy: { id: 'desc' } } },
      orderBy: { id: 'desc' },
    });

    return debts.map((d) => this.format(d));
  }

  async findOne(userId: number, id: number) {
    const debt = await this.prisma.debt.findFirst({
      where: { id, userId },
      include: { payments: { orderBy: { id: 'desc' } } },
    });

    if (!debt) {
      throw new NotFoundException(`Запись долга #${id} не найдена`);
    }

    return this.format(debt);
  }

  async create(userId: number, dto: CreateDebtDto) {
    const customerName = (dto.customerName || '').trim();
    const phone = dto.phone?.trim() || null;
    const totalAmount = money(toNum(dto.totalAmount));

    if (!customerName) {
      throw new BadRequestException('Имя клиента обязательно');
    }
    if (totalAmount <= 0) {
      throw new BadRequestException('Сумма долга должна быть больше нуля');
    }

    const customer = await this.resolveCustomer(userId, dto.customerId, customerName, phone);

    const debt = await this.prisma.$transaction(async (tx) => {
      const created = await tx.debt.create({
        data: {
          userId,
          customerId: customer?.id || null,
          customerName,
          phone,
          totalAmount,
          paidAmount: 0,
          description: dto.description?.trim() || null,
          status: 'active',
        },
        include: { payments: true },
      });

      if (customer) {
        await tx.customer.update({
          where: { id: customer.id },
          data: { totalDebt: { increment: totalAmount } },
        });
      }

      return created;
    });

    return this.format(debt);
  }

  async addPayment(userId: number, debtId: number, dto: AddPaymentDto) {
    const debt = await this.prisma.debt.findFirst({
      where: { id: debtId, userId },
      include: { customer: true },
    });
    if (!debt) {
      throw new NotFoundException(`Запись долга #${debtId} не найдена`);
    }

    const amount = money(toNum(dto.amount));
    const remaining = money(toNum(debt.totalAmount) - toNum(debt.paidAmount));
    if (amount <= 0) {
      throw new BadRequestException('Сумма платежа должна быть больше 0');
    }
    if (amount > remaining + 0.009) {
      throw new BadRequestException(`Сумма не может превышать остаток долга (${remaining} сомони)`);
    }

    const paymentMethod = ['cash', 'card', 'transfer'].includes(dto.paymentMethod || '')
      ? dto.paymentMethod!
      : 'cash';
    const shift = paymentMethod === 'cash'
      ? await this.prisma.cashierShift.findFirst({
          where: { userId, status: 'open' },
          orderBy: { id: 'desc' },
        })
      : null;

    await this.prisma.$transaction(async (tx) => {
      await tx.debtPayment.create({
        data: {
          debtId,
          amount,
          note: dto.note?.trim() || null,
        },
      });

      const newPaidAmount = money(toNum(debt.paidAmount) + amount);
      await tx.debt.update({
        where: { id: debtId },
        data: {
          paidAmount: newPaidAmount,
          status: newPaidAmount >= toNum(debt.totalAmount) ? 'paid' : 'active',
        },
      });

      if (debt.customerId) {
        await tx.customer.update({
          where: { id: debt.customerId },
          data: { totalDebt: { decrement: Math.min(amount, toNum(debt.customer?.totalDebt || 0)) } },
        });
      }

      if (shift) {
        await tx.cashierShift.update({
          where: { id: shift.id },
          data: { debtCollections: { increment: amount } },
        });
        await tx.cashMovement.create({
          data: {
            shiftId: shift.id,
            type: 'debt_collection',
            amount,
            reason: `Оплата долга #${debtId} (${debt.customerName})`,
            cashierName: debt.customerName,
          },
        });
      }
    });

    return this.findOne(userId, debtId);
  }

  async remove(userId: number, id: number) {
    const debt = await this.prisma.debt.findFirst({
      where: { id, userId },
      include: { customer: true },
    });
    if (!debt) {
      throw new NotFoundException(`Запись долга #${id} не найдена`);
    }

    const outstanding = Math.max(0, toNum(debt.totalAmount) - toNum(debt.paidAmount));

    await this.prisma.$transaction(async (tx) => {
      await tx.debt.delete({ where: { id } });
      if (debt.customerId && outstanding > 0) {
        await tx.customer.update({
          where: { id: debt.customerId },
          data: { totalDebt: { decrement: Math.min(outstanding, toNum(debt.customer?.totalDebt || 0)) } },
        });
      }
    });

    return { success: true, message: `Запись долга #${id} успешно удалена` };
  }

  private async resolveCustomer(
    userId: number,
    customerId: string | number | undefined,
    customerName: string,
    phone: string | null,
  ) {
    if (customerId !== undefined && customerId !== null && String(customerId).trim() !== '') {
      const id = parseInt(String(customerId), 10);
      if (!id) throw new BadRequestException('Некорректный клиент');
      const customer = await this.prisma.customer.findFirst({ where: { id, userId } });
      if (!customer) throw new BadRequestException('Клиент не найден');
      return customer;
    }

    if (phone) {
      const byPhone = await this.prisma.customer.findFirst({ where: { userId, phone } });
      if (byPhone) return byPhone;
    }

    return this.prisma.customer.findFirst({
      where: { userId, name: customerName },
      orderBy: { id: 'desc' },
    });
  }

  private format(d: any) {
    return {
      id: String(d.id),
      customerName: d.customerName,
      phone: d.phone || '',
      totalAmount: Number(d.totalAmount || 0),
      paidAmount: Number(d.paidAmount || 0),
      description: d.description || '',
      status: d.status || 'active',
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : new Date().toISOString(),
      payments: (d.payments || []).map((p: any) => ({
        id: String(p.id),
        amount: Number(p.amount || 0),
        date: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
        note: p.note || undefined,
      })),
    };
  }
}
