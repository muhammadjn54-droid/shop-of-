import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { DebtsService } from './debts.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { AddPaymentDto } from './dto/add-payment.dto';

@ApiTags('Debts')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('api/debts')
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Get()
  @ApiOperation({ summary: 'Список всех долгов' })
  @ApiResponse({ status: 200, description: 'Список записей долговой книги' })
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.debtsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить данные долга по ID' })
  @ApiResponse({ status: 200, description: 'Данные долга и история платежей' })
  @ApiResponse({ status: 404, description: 'Долг не найден' })
  findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.debtsService.findOne(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать запись о долге' })
  @ApiResponse({ status: 201, description: 'Долг успешно записан' })
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateDebtDto,
  ) {
    return this.debtsService.create(user.id, dto);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Внести оплату (частичную или полную) по долгу' })
  @ApiResponse({ status: 200, description: 'Оплата успешно внесена' })
  addPayment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddPaymentDto,
  ) {
    return this.debtsService.addPayment(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить запись о долге' })
  @ApiResponse({ status: 200, description: 'Запись о долге удалена' })
  @ApiResponse({ status: 404, description: 'Долг не найден' })
  remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.debtsService.remove(user.id, id);
  }
}
