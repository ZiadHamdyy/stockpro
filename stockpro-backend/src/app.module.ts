import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { PinoLogger } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './configs/database/database.module';
import { DatabaseService } from './configs/database/database.service';
import { LoggerModule } from './common/application/logger/logger.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/application/exceptions/exception-filter';
import { ValidationPipe } from './common/application/exceptions/validation.pipe';
import { ContextModule } from './common/application/context/context.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { SessionModule } from './modules/session/session.module';
import { RoleModule } from './modules/role/role.module';
import { PermissionModule } from './modules/permission/permission.module';
import { ItemModule } from './modules/item/item.module';
import { ItemGroupModule } from './modules/item-group/item-group.module';
import { UnitModule } from './modules/unit/unit.module';
import { CompanyModule } from './modules/company/company.module';
import { BranchModule } from './modules/branch/branch.module';
import { StoreModule } from './modules/store/store.module';
import { StoreReceiptVoucherModule } from './modules/store-receipt-voucher/store-receipt-voucher.module';
import { StoreIssueVoucherModule } from './modules/store-issue-voucher/store-issue-voucher.module';
import { StoreTransferVoucherModule } from './modules/store-transfer-voucher/store-transfer-voucher.module';
import { BankModule } from './modules/bank/bank.module';
import { SafeModule } from './modules/safe/safe.module';
import { CustomerModule } from './modules/customer/customer.module';
import { SupplierModule } from './modules/supplier/supplier.module';
import { CurrentAccountModule } from './modules/current-account/current-account.module';
import { ExpenseModule } from './modules/expense/expense.module';
import { SalesInvoiceModule } from './modules/sales-invoice/sales-invoice.module';
import { SalesReturnModule } from './modules/sales-return/sales-return.module';
import { PurchaseInvoiceModule } from './modules/purchase-invoice/purchase-invoice.module';
import { PurchaseReturnModule } from './modules/purchase-return/purchase-return.module';
import { PaymentVoucherModule } from './modules/payment-voucher/payment-voucher.module';
import { ReceiptVoucherModule } from './modules/receipt-voucher/receipt-voucher.module';
import { IncomeStatementModule } from './modules/income-statement/income-statement.module';
import { BackupModule } from './modules/backup/backup.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    DatabaseModule,
    ContextModule,
    AuthModule,
    UserModule,
    SessionModule,
    RoleModule,
    PermissionModule,
    ItemModule,
    ItemGroupModule,
    UnitModule,
    CompanyModule,
    BranchModule,
    StoreModule,
    StoreReceiptVoucherModule,
    StoreIssueVoucherModule,
    StoreTransferVoucherModule,
    BankModule,
    SafeModule,
    CustomerModule,
    SupplierModule,
    CurrentAccountModule,
    ExpenseModule,
    SalesInvoiceModule,
    SalesReturnModule,
    PurchaseInvoiceModule,
    PurchaseReturnModule,
    PaymentVoucherModule,
    ReceiptVoucherModule,
    IncomeStatementModule,
    BackupModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    DatabaseService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    },
    {
      provide: APP_FILTER,
      useFactory: (logger: PinoLogger) => {
        return new HttpExceptionFilter(logger);
      },
      inject: [PinoLogger],
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
