import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { IsArray, IsOptional, IsString } from 'class-validator';
import * as bwipjs from 'bwip-js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsGuard, RequirePermissions } from '../common/permissions.guard';
import { money, toNum } from '../common/utils';

class LabelsDto {
  @IsArray() items: Array<{ productId: number | string; quantity: number | string }>;
  @IsOptional() @IsString() currency?: string;
}

@ApiTags('Barcode & QR')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/barcode')
export class BarcodeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('product/:id')
  @RequirePermissions('products.read')
  @ApiOperation({ summary: 'PNG-штрихкод товара (Code128)' })
  async productBarcode(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Query('scale') scale?: string,
  ) {
    const product = await this.prisma.product.findFirst({ where: { id, userId: user.id } });
    if (!product) throw new BadRequestException('Товар не найден');
    const png = await this.renderBarcode(product.barcode || String(product.id), scale);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end(png);
  }

  @Get('qr')
  @RequirePermissions('products.read')
  @ApiOperation({ summary: 'PNG QR-код по тексту' })
  async qr(@Res() res: Response, @Query('text') text?: string, @Query('scale') scale?: string) {
    if (!text?.trim()) throw new BadRequestException('Укажите текст для QR-кода');
    const png = await this.renderQr(text.trim(), scale);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end(png);
  }

  @Post('labels')
  @RequirePermissions('products.read')
  @ApiOperation({ summary: 'Пакет этикеток (PNG data URL) для печати' })
  async labels(@CurrentUser() user: CurrentUserPayload, @Body() dto: LabelsDto) {
    if (!dto.items?.length) throw new BadRequestException('Выберите товары для печати этикеток');
    const ids = dto.items.map((i) => parseInt(String(i.productId), 10)).filter(Boolean);
    const products = await this.prisma.product.findMany({ where: { userId: user.id, id: { in: ids } } });
    const currency = dto.currency || 'TJS';
    const labels: any[] = [];
    for (const item of dto.items) {
      const product = products.find((p) => p.id === parseInt(String(item.productId), 10));
      if (!product) continue;
      const copies = Math.max(1, Math.min(200, Math.floor(toNum(item.quantity, 1))));
      let dataUrl = '';
      try {
        const png = await this.renderBarcode(product.barcode || String(product.id), '2');
        dataUrl = `data:image/png;base64,${png.toString('base64')}`;
      } catch {
        dataUrl = '';
      }
      for (let i = 0; i < copies; i++) {
        labels.push({
          productId: product.id,
          name: product.name,
          barcode: product.barcode,
          price: money(toNum(product.sellingPrice)),
          currency,
          dataUrl,
        });
      }
    }
    return { count: labels.length, labels };
  }

  private async renderBarcode(text: string, scale?: string): Promise<Buffer> {
    const s = Math.max(1, Math.min(8, parseInt(String(scale || '3'), 10) || 3));
    return bwipjs.toBuffer({
      bcid: 'code128',
      text,
      scale: s,
      height: 10,
      includetext: true,
      textxalign: 'center',
      textsize: 8,
      paddingwidth: 4,
      paddingheight: 4,
    } as any) as Promise<Buffer>;
  }

  private async renderQr(text: string, scale?: string): Promise<Buffer> {
    const s = Math.max(1, Math.min(12, parseInt(String(scale || '5'), 10) || 5));
    return bwipjs.toBuffer({
      bcid: 'qrcode',
      text,
      scale: s,
      paddingwidth: 4,
      paddingheight: 4,
    } as any) as Promise<Buffer>;
  }
}
