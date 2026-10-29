import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PermissionsGuard, RequirePermissions } from '../common/permissions.guard';
import { CheckoutInput, OrdersService, ReturnInput } from './orders.service';

class CheckoutDto implements CheckoutInput {
  @IsArray() items: Array<{ productId: number | string; quantity: number | string; price?: number | string }>;
  @IsOptional() @IsString() paymentMethod?: string;
  @IsOptional() cashGiven?: number | string;
  @IsOptional() cardAmount?: number | string;
  @IsOptional() customerId?: number | string;
  @IsOptional() @IsString() debtorName?: string;
  @IsOptional() discountAmount?: number | string;
  @IsOptional() discountPercent?: number | string;
  @IsOptional() pointsSpent?: number | string;
  @IsOptional() @IsString() clientTransactionId?: string;
  @IsOptional() branchId?: number | string;
  @IsOptional() shiftId?: number | string;
  @IsOptional() isOffline?: boolean;
}

class ReturnDto implements ReturnInput {
  @IsArray() items: Array<{ orderItemId?: number | string; productId?: number | string; quantity: number | string }>;
  @IsOptional() @IsString() paymentMethod?: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() clientTransactionId?: string;
}

@ApiTags('Orders / POS')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @RequirePermissions('sales.read')
  @ApiOperation({ summary: 'Список продаж' })
  async list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('status') status?: string,
    @Query('isReturn') isReturn?: string,
    @Query('customerId') customerId?: string,
    @Query('cashierName') cashierName?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.orders.list(user, { period, from, to, paymentMethod, status, isReturn, customerId, cashierName, search, page, limit });
  }

  @Get(':id')
  @RequirePermissions('sales.read')
  async detail(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    return this.orders.detail(user, id);
  }

  @Post('checkout')
  @RequirePermissions('pos')
  @ApiOperation({ summary: 'Оформить продажу (идемпотентно по clientTransactionId)' })
  async checkout(@CurrentUser() user: CurrentUserPayload, @Body() dto: CheckoutDto) {
    return this.orders.checkout(user, dto);
  }

  @Post(':id/return')
  @RequirePermissions('sales.refund')
  @ApiOperation({ summary: 'Оформить возврат по продаже' })
  async returnOrder(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReturnDto,
  ) {
    return this.orders.returnOrder(user, id, dto);
  }
}
