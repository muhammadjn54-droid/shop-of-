import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { MiscModule } from './misc/misc.module';
import { EmployeesModule } from './employees/employees.module';
import { DebtsModule } from './debts/debts.module';
import { BranchesModule } from './branches/branches.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PurchasesModule } from './purchases/purchases.module';
import { StockModule } from './stock/stock.module';
import { InventoryModule } from './inventory/inventory.module';
import { ShiftsModule } from './shifts/shifts.module';
import { ExpensesModule } from './expenses/expenses.module';
import { CustomersModule } from './customers/customers.module';
import { OrdersModule } from './orders/orders.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { SettingsModule } from './settings/settings.module';
import { BarcodeModule } from './barcode/barcode.module';
import { TelegramModule } from './telegram/telegram.module';
import { AiModule } from './ai/ai.module';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    CommonModule,
    AuthModule,
    ProductsModule,
    MiscModule,
    EmployeesModule,
    DebtsModule,
    BranchesModule,
    SuppliersModule,
    PurchasesModule,
    StockModule,
    InventoryModule,
    ShiftsModule,
    ExpensesModule,
    CustomersModule,
    OrdersModule,
    ReportsModule,
    NotificationsModule,
    AuditModule,
    SettingsModule,
    BarcodeModule,
    TelegramModule,
    AiModule,
    SyncModule,
  ],
})
export class AppModule {}
