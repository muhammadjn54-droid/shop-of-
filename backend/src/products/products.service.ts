import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { AddStockDto } from './dto/add-stock.dto';
import { SellProductDto } from './dto/sell-product.dto';
import { ReturnProductDto } from './dto/return-product.dto';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { toNum } from '../common/utils';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  public formatProduct(product: any) {
    if (!product) return null;

    const fileUrl = product.file || null;

    const dateStr = product.purchaseDate
      ? new Date(product.purchaseDate).toISOString().split('T')[0]
      : '';

    const qtyReceived = Number(product.quantityReceived || 0);
    const qtySold = Number(product.quantitySold || 0);
    const remaining = Math.max(0, qtyReceived - qtySold);

    const pPriceNum = Number(product.purchasePrice || 0);
    const sPriceNum = Number(product.sellingPrice || 0);

    const revenueNum = qtySold * sPriceNum;
    const soldCostNum = qtySold * pPriceNum;
    const profitNum = Math.max(0, revenueNum - soldCostNum);
    const lossNum = soldCostNum > revenueNum ? soldCostNum - revenueNum : 0;
    const profitPerItem = sPriceNum - pPriceNum;

    return {
      id: product.id,
      userId: product.userId,
      name: product.name,
      file: product.file,
      image: fileUrl,
      images: fileUrl ? [fileUrl] : [],
      barcode: product.barcode,
      purchase_date: dateStr,
      arrival_date: dateStr,
      quantity_received: qtyReceived,
      quantity_sold: qtySold,
      remaining_quantity: remaining,
      purchase_price: pPriceNum.toFixed(2),
      selling_price: sPriceNum.toFixed(2),
      profit_per_item: profitPerItem.toFixed(2),
      revenue: revenueNum.toFixed(2),
      sold_cost: soldCostNum.toFixed(2),
      profit: profitNum.toFixed(2),
      loss: lossNum > 0 ? lossNum.toFixed(2) : '—',
      sales_count: product.salesCount || 0,
      returns_count: product.returnsCount || 0,
      category: product.category || 'stationery',
      min_stock: product.minStock ?? 5,
      created_at: product.createdAt,
      updated_at: product.updatedAt,
    };
  }

  async create(userId: number, dto: CreateProductDto, filePath?: string) {
    let rawBarcode = (dto.barcode || '').trim();
    if (!rawBarcode) {
      rawBarcode = `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    }
    const rawName = (dto.name || '').trim();
    const rawDate = (dto.purchase_date || dto.arrival_date || '').trim();
    if (!rawName) {
      throw new BadRequestException('Название товара обязательно');
    }

    const existing = await this.prisma.product.findUnique({
      where: {
        userId_barcode: {
          userId,
          barcode: rawBarcode,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Товар со штрихкодом "${rawBarcode}" уже существует у вас в каталоге`,
      );
    }

    const purchaseDate = rawDate && !isNaN(Date.parse(rawDate)) ? new Date(rawDate) : new Date();
    const quantityReceived = Math.max(0, parseInt(String(dto.quantity_received || 0), 10) || 0);
    const purchasePrice = Math.max(0, parseFloat(String(dto.purchase_price || 0)) || 0);
    const sellingPrice = Math.max(0, parseFloat(String(dto.selling_price || 0)) || 0);
    const category = (dto.category || 'stationery').trim().toLowerCase();

    const product = await this.prisma.product.create({
      data: {
        userId,
        name: rawName,
        barcode: rawBarcode,
        purchaseDate,
        quantityReceived,
        quantitySold: 0,
        purchasePrice,
        sellingPrice,
        category,
        file: filePath || null,
      },
    });

    return this.formatProduct(product);
  }

  async findAll(userId: number, query: QueryProductDto) {
    const { search, barcode, ordering, page, limit } = query;
    const pageNum = Math.max(1, parseInt(String(page || 1), 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(String(limit || 10), 10)));
    const skip = (pageNum - 1) * pageSize;

    const where: any = { userId };

    if (barcode && barcode.trim()) {
      where.barcode = barcode.trim();
    }

    if (query.category && query.category.trim() && query.category.trim().toLowerCase() !== 'all') {
      where.category = query.category.trim().toLowerCase();
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { barcode: { contains: term, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (ordering && typeof ordering === 'string') {
      const isDesc = ordering.startsWith('-');
      const field = isDesc ? ordering.slice(1) : ordering;
      const dir: 'asc' | 'desc' = isDesc ? 'desc' : 'asc';

      if (field === 'name') orderBy = { name: dir };
      else if (field === 'barcode') orderBy = { barcode: dir };
      else if (field === 'arrival_date' || field === 'purchase_date') orderBy = { purchaseDate: dir };
      else if (field === 'quantity_received') orderBy = { quantityReceived: dir };
      else if (field === 'quantity_sold') orderBy = { quantitySold: dir };
      else if (field === 'purchase_price') orderBy = { purchasePrice: dir };
      else if (field === 'selling_price') orderBy = { sellingPrice: dir };
      else if (field === 'created_at') orderBy = { createdAt: dir };
      else if (field === 'updated_at') orderBy = { updatedAt: dir };
    }

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
    ]);

    const formatted = products.map((p) => this.formatProduct(p));

    return {
      count: total,
      next: skip + pageSize < total ? `?page=${pageNum + 1}` : null,
      previous: pageNum > 1 ? `?page=${pageNum - 1}` : null,
      results: formatted,
    };
  }

  async findLowStock(userId: number, query: QueryProductDto) {
    const all = await this.prisma.product.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const lowStock = all
      .map((p) => this.formatProduct(p))
      .filter((p) => p.remaining_quantity > 0 && p.remaining_quantity <= (p.min_stock ?? 5));

    return {
      count: lowStock.length,
      next: null,
      previous: null,
      results: lowStock,
    };
  }

  async getCategories() {
    try {
      const dbCategories: any[] = await this.prisma.$queryRawUnsafe(
        'SELECT * FROM categories ORDER BY id ASC'
      );
      if (dbCategories && dbCategories.length > 0) {
        return dbCategories.map((c) => ({
          id: c.key,
          labelTg: c.name_tg,
          labelRu: c.name_ru,
          labelEn: c.name_en,
          icon: c.icon,
        }));
      }
    } catch {}

    return [
      {
        id: 'stationery',
        labelTg: 'Конставар',
        labelRu: 'Канцтовары',
        labelEn: 'Stationery',
        icon: '✏️',
      },
      {
        id: 'toys',
        labelTg: 'Игрушка',
        labelRu: 'Игрушки',
        labelEn: 'Toys',
        icon: '🧸',
      },
      {
        id: 'perfumery',
        labelTg: 'Порфимерия',
        labelRu: 'Парфюмерия',
        labelEn: 'Perfumery',
        icon: '🧴',
      },
      {
        id: 'accessories',
        labelTg: 'Зарядмонакҳо',
        labelRu: 'Зарядники и аксессуары',
        labelEn: 'Accessories & Chargers',
        icon: '🔌',
      },
    ];
  }

  async findOne(userId: number, id: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, userId },
    });

    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    return this.formatProduct(product);
  }

  async update(userId: number, id: number, dto: UpdateProductDto, filePath?: string) {
    const existing = await this.prisma.product.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Товар не найден');
    }

    const data: any = {};

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) throw new BadRequestException('Название товара не может быть пустым');
      data.name = name;
    }

    if (dto.barcode !== undefined) {
      const newBarcode = dto.barcode.trim();
      if (!newBarcode) throw new BadRequestException('Штрихкод не может быть пустым');
      if (newBarcode !== existing.barcode) {
        const duplicate = await this.prisma.product.findUnique({
          where: {
            userId_barcode: {
              userId,
              barcode: newBarcode,
            },
          },
        });
        if (duplicate && duplicate.id !== id) {
          throw new ConflictException(
            `Товар со штрихкодом "${newBarcode}" уже существует у вас в каталоге`,
          );
        }
        data.barcode = newBarcode;
      }
    }

    const dateVal = (dto.purchase_date || dto.arrival_date || '').trim();
    if (dateVal && !isNaN(Date.parse(dateVal))) {
      data.purchaseDate = new Date(dateVal);
    }

    if (dto.quantity_received !== undefined) {
      const quantityReceived = Math.max(0, parseInt(String(dto.quantity_received), 10) || 0);
      if (quantityReceived < existing.quantitySold) {
        throw new BadRequestException(
          `Количество поступления не может быть меньше уже проданного (${existing.quantitySold} шт.)`,
        );
      }
      data.quantityReceived = quantityReceived;
    }

    if (dto.purchase_price !== undefined) {
      data.purchasePrice = Math.max(0, parseFloat(String(dto.purchase_price)) || 0);
    }

    if (dto.selling_price !== undefined) {
      data.sellingPrice = Math.max(0, parseFloat(String(dto.selling_price)) || 0);
    }

    if (dto.category !== undefined) {
      data.category = (dto.category || 'stationery').trim().toLowerCase();
    }

    if (filePath) {
      if (existing.file && existing.file.startsWith('/uploads/')) {
        const oldPath = join(process.cwd(), existing.file);
        if (existsSync(oldPath)) {
          try {
            unlinkSync(oldPath);
          } catch {}
        }
      }
      data.file = filePath;
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data,
    });

    return this.formatProduct(updated);
  }

  async addStock(userId: number, id: number, dto: AddStockDto) {
    const product = await this.prisma.product.findFirst({
      where: { id, userId },
    });

    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    const newQuantityReceived = product.quantityReceived + dto.quantity;
    const updateData: any = {
      quantityReceived: newQuantityReceived,
    };

    if (dto.purchase_price !== undefined && String(dto.purchase_price).trim() !== '') {
      updateData.purchasePrice = Math.max(0, parseFloat(String(dto.purchase_price)) || 0);
    }

    const before = Math.max(0, product.quantityReceived - product.quantitySold);
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.product.update({
        where: { id },
        data: updateData,
      });
      await tx.stockMovement.create({
        data: {
          userId,
          productId: product.id,
          branchId: product.branchId,
          type: 'purchase',
          quantity: dto.quantity,
          quantityBefore: before,
          quantityAfter: before + dto.quantity,
          costPrice: toNum(updateData.purchasePrice ?? product.purchasePrice),
          sellingPrice: toNum(product.sellingPrice),
          reason: 'Ручное пополнение склада',
          userName: 'manual',
        },
      });
      return result;
    });

    const formatted = this.formatProduct(updated);
    return {
      message: `Склад успешно пополнен на ${dto.quantity} шт.`,
      product: formatted,
    };
  }

  async sell(userId: number, id: number, dto: SellProductDto) {
    const product = await this.prisma.product.findFirst({
      where: { id, userId },
    });

    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    const remaining = Math.max(0, product.quantityReceived - product.quantitySold);
    if (dto.quantity > remaining) {
      throw new BadRequestException(
        `Недостаточно товара на складе (осталось ${remaining} шт.)`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.product.update({
        where: { id },
        data: {
          quantitySold: product.quantitySold + dto.quantity,
          salesCount: product.salesCount + 1,
        },
      });
      await tx.stockMovement.create({
        data: {
          userId,
          productId: product.id,
          branchId: product.branchId,
          type: 'sale',
          quantity: -dto.quantity,
          quantityBefore: remaining,
          quantityAfter: remaining - dto.quantity,
          costPrice: toNum(product.purchasePrice),
          sellingPrice: toNum(product.sellingPrice),
          reason: `Быстрая продажа: ${product.name}`,
          userName: 'manual',
        },
      });
      return result;
    });

    const formatted = this.formatProduct(updated);
    return {
      message: `Продано ${dto.quantity} шт. товара "${product.name}"`,
      product: formatted,
    };
  }

  async returnProduct(userId: number, id: number, dto: ReturnProductDto) {
    const product = await this.prisma.product.findFirst({
      where: { id, userId },
    });

    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    if (dto.quantity > product.quantitySold) {
      throw new BadRequestException(
        `Нельзя вернуть больше, чем было продано (${product.quantitySold} шт.)`,
      );
    }

    const before = Math.max(0, product.quantityReceived - product.quantitySold);
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.product.update({
        where: { id },
        data: {
          quantitySold: product.quantitySold - dto.quantity,
          returnsCount: product.returnsCount + 1,
        },
      });
      await tx.stockMovement.create({
        data: {
          userId,
          productId: product.id,
          branchId: product.branchId,
          type: 'return',
          quantity: dto.quantity,
          quantityBefore: before,
          quantityAfter: before + dto.quantity,
          costPrice: toNum(product.purchasePrice),
          sellingPrice: toNum(product.sellingPrice),
          reason: `Быстрый возврат: ${product.name}`,
          userName: 'manual',
        },
      });
      return result;
    });

    const formatted = this.formatProduct(updated);
    return {
      message: `Оформлен возврат ${dto.quantity} шт.`,
      product: formatted,
    };
  }

  async remove(userId: number, id: number) {
    const existing = await this.prisma.product.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Товар не найден');
    }

    if (existing.file && existing.file.startsWith('/uploads/')) {
      const oldPath = join(process.cwd(), existing.file);
      if (existsSync(oldPath)) {
        try {
          unlinkSync(oldPath);
        } catch {}
      }
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { success: true, message: 'Товар успешно удален' };
  }

  async removeImage(userId: number, id: number) {
    const existing = await this.prisma.product.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Товар не найден');
    }

    if (existing.file && existing.file.startsWith('/uploads/')) {
      const oldPath = join(process.cwd(), existing.file);
      if (existsSync(oldPath)) {
        try {
          unlinkSync(oldPath);
        } catch {}
      }
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { file: null },
    });

    return this.formatProduct(updated);
  }
}
