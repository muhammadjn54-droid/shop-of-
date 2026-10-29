import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { SyncController } from './sync.controller';

@Module({
  imports: [OrdersModule],
  controllers: [SyncController],
})
export class SyncModule {}
