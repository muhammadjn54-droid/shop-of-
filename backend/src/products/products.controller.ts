import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Put,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { AddStockDto } from './dto/add-stock.dto';
import { SellProductDto } from './dto/sell-product.dto';
import { ReturnProductDto } from './dto/return-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { multerStorage } from '../common/file-upload.util';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создание нового товара (с загрузкой файла, остатком и ценами)' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'дафтар', description: 'Название товара' },
        barcode: {
          type: 'string',
          example: 'CH0000034936',
          description: 'Штрихкод (если не указан, генерируется автоматически)',
        },
        purchase_date: { type: 'string', example: '2026-10-06', description: 'Дата покупки' },
        arrival_date: { type: 'string', example: '2026-10-06', description: 'Дата поступления' },
        quantity_received: { type: 'number', example: 100, description: 'Количество поступило' },
        purchase_price: { type: 'string', example: '2.50', description: 'Цена закупки' },
        selling_price: { type: 'string', example: '5.00', description: 'Цена продажи' },
        file: { type: 'string', format: 'binary', description: 'Файл / фото товара' },
      },
      required: ['name'],
    },
  })
  @ApiResponse({ status: 201, description: 'Товар успешно создан' })
  @ApiResponse({ status: 409, description: 'Штрихкод уже существует у текущего пользователя' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
        { name: 'images', maxCount: 5 },
      ],
      { storage: multerStorage },
    ),
  )
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateProductDto,
    @UploadedFiles()
    files?: {
      file?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    const uploadedFile = files?.file?.[0] || files?.images?.[0];
    const filePath = uploadedFile ? `/uploads/${uploadedFile.filename}` : undefined;
    return this.productsService.create(user.id, dto, filePath);
  }

  @Get()
  @ApiOperation({ summary: 'Получение списка товаров (с поиском по имени/штрихкоду)' })
  @ApiResponse({ status: 200, description: 'Список товаров текущего пользователя' })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QueryProductDto,
  ) {
    return this.productsService.findAll(user.id, query);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Получение товаров с низким остатком (<= 5 шт.)' })
  async getLowStock(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QueryProductDto,
  ) {
    return this.productsService.findLowStock(user.id, query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Получение списка всех категорий товаров' })
  @ApiResponse({ status: 200, description: 'Список категорий (конставар, игрушка, парфюмерия, зарядмонакхо)' })
  getCategories() {
    return this.productsService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получение товара по ID' })
  @ApiResponse({ status: 200, description: 'Данные товара' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.productsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновление товара' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'дафтар', description: 'Название товара' },
        barcode: { type: 'string', example: 'CH0000034936', description: 'Штрихкод' },
        purchase_date: { type: 'string', example: '2026-10-06', description: 'Дата покупки' },
        arrival_date: { type: 'string', example: '2026-10-06', description: 'Дата поступления' },
        quantity_received: { type: 'number', example: 100, description: 'Количество поступило' },
        purchase_price: { type: 'string', example: '2.50', description: 'Цена закупки' },
        selling_price: { type: 'string', example: '5.00', description: 'Цена продажи' },
        file: { type: 'string', format: 'binary', description: 'Файл / фото товара' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Товар успешно обновлен' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
        { name: 'images', maxCount: 5 },
      ],
      { storage: multerStorage },
    ),
  )
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @UploadedFiles()
    files?: {
      file?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    const uploadedFile = files?.file?.[0] || files?.images?.[0];
    const filePath = uploadedFile ? `/uploads/${uploadedFile.filename}` : undefined;
    return this.productsService.update(user.id, id, dto, filePath);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновление товара (PUT)' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
        { name: 'images', maxCount: 5 },
      ],
      { storage: multerStorage },
    ),
  )
  async updatePut(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @UploadedFiles()
    files?: {
      file?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    return this.update(user, id, dto, files);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удаление товара' })
  @ApiResponse({ status: 200, description: 'Товар удален' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.productsService.remove(user.id, id);
  }

  @Post(':id/add-stock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Пополнение склада товара (добавление поступления и обновление закупочной цены)' })
  @ApiResponse({ status: 200, description: 'Склад успешно пополнен' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  async addStock(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddStockDto,
  ) {
    return this.productsService.addStock(user.id, id, dto);
  }

  @Post(':id/sell')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Продажа товара' })
  @ApiResponse({ status: 200, description: 'Товар продан' })
  @ApiResponse({ status: 400, description: 'Недостаточно товара на складе' })
  async sell(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SellProductDto,
  ) {
    return this.productsService.sell(user.id, id, dto);
  }

  @Post(':id/return')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Возврат проданного товара на склад' })
  @ApiResponse({ status: 200, description: 'Возврат успешно оформлен' })
  @ApiResponse({ status: 400, description: 'Нельзя вернуть больше, чем продано' })
  async returnProduct(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReturnProductDto,
  ) {
    return this.productsService.returnProduct(user.id, id, dto);
  }

  @Get(':id/sales')
  @ApiOperation({ summary: 'История продаж товара' })
  async getProductSales(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const product = await this.productsService.findOne(user.id, id);
    if (!product || product.quantity_sold === 0) {
      return { count: 0, next: null, previous: null, results: [] };
    }

    return {
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: product.id,
          sold_at: product.updated_at || product.created_at,
          quantity: product.quantity_sold,
          returned_quantity: product.returns_count,
          price_per_item: product.selling_price,
          total_amount: product.revenue,
          profit: product.profit,
        },
      ],
    };
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Загрузка дополнительных фотографий товара' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
        { name: 'images', maxCount: 5 },
      ],
      { storage: multerStorage },
    ),
  )
  async uploadImages(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles()
    files?: {
      file?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    const uploadedFile = files?.file?.[0] || files?.images?.[0];
    const filePath = uploadedFile ? `/uploads/${uploadedFile.filename}` : undefined;
    if (filePath) {
      return this.productsService.update(user.id, id, {}, filePath);
    }
    return { success: true };
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Удаление фотографии товара' })
  async deleteImage(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.productsService.removeImage(user.id, id);
  }
}
