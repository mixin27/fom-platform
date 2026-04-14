import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
  ValidationPipe,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { CustomersController } from './customers/customers.controller';
import { CustomersService } from './customers/customers.service';
import { DeliveriesController } from './deliveries/deliveries.controller';
import { DeliveriesService } from './deliveries/deliveries.service';
import {
  PlatformExportsController,
  ShopExportsController,
} from './exports/exports.controller';
import { ExportsService } from './exports/exports.service';
import { AppExceptionFilter } from './common/http/exception.filter';
import { RequestContextMiddleware } from './common/http/request-context';
import { ResponseEnvelopeInterceptor } from './common/http/response-envelope.interceptor';
import { OrdersController } from './orders/orders.controller';
import { OrderMessageParserService } from './orders/order-message-parser.service';
import { OrderSpreadsheetService } from './orders/order-spreadsheet.service';
import { OrdersService } from './orders/orders.service';
import { EmailOutboxService } from './email/email-outbox.service';
import { EmailTemplateService } from './email/email-template.service';
import { EmailTransportService } from './email/email-transport.service';
import { DisabledEmailProvider } from './email/providers/disabled-email.provider';
import { LogEmailProvider } from './email/providers/log-email.provider';
import { SendgridEmailProvider } from './email/providers/sendgrid-email.provider';
import { SmtpEmailProvider } from './email/providers/smtp-email.provider';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsService } from './notifications/notifications.service';
import { PlatformController } from './platform/platform.controller';
import { PlatformService } from './platform/platform.service';
import { SubscriptionLifecycleService } from './platform/subscription-lifecycle.service';
import { PushController } from './push/push.controller';
import { PushService } from './push/push.service';
import { DisabledPushProvider } from './push/providers/disabled-push.provider';
import { LogPushProvider } from './push/providers/log-push.provider';
import { PushTransportService } from './push/push-transport.service';
import { PrismaService } from './common/prisma/prisma.service';
import { RealtimeController } from './realtime/realtime.controller';
import { RealtimeService } from './realtime/realtime.service';
import { ShopsController } from './shops/shops.controller';
import { ReportsController } from './summaries/reports.controller';
import { ShopsService } from './shops/shops.service';
import { SummariesController } from './summaries/summaries.controller';
import { SummariesService } from './summaries/summaries.service';
import { TemplatesController } from './templates/templates.controller';
import { TemplatesService } from './templates/templates.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { AuthGuard } from './common/http/auth.guard';
import { RbacGuard } from './common/http/rbac.guard';
import { SubscriptionFeatureGuard } from './common/http/subscription-feature.guard';
import { createAppValidationPipe } from './common/http/validation-pipe';

@Module({
  imports: [JwtModule.register({})],
  controllers: [
    AppController,
    AuthController,
    UsersController,
    ShopsController,
    PlatformController,
    RealtimeController,
    PushController,
    CustomersController,
    OrdersController,
    NotificationsController,
    DeliveriesController,
    ShopExportsController,
    PlatformExportsController,
    TemplatesController,
    SummariesController,
    ReportsController,
  ],
  providers: [
    AppService,
    PrismaService,
    AuthService,
    UsersService,
    ShopsService,
    PlatformService,
    SubscriptionLifecycleService,
    CustomersService,
    OrderMessageParserService,
    OrderSpreadsheetService,
    OrdersService,
    DisabledEmailProvider,
    LogEmailProvider,
    SendgridEmailProvider,
    SmtpEmailProvider,
    EmailTransportService,
    EmailTemplateService,
    EmailOutboxService,
    DisabledPushProvider,
    LogPushProvider,
    PushTransportService,
    PushService,
    RealtimeService,
    NotificationsService,
    DeliveriesService,
    ExportsService,
    TemplatesService,
    SummariesService,
    AuthGuard,
    RbacGuard,
    SubscriptionFeatureGuard,
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseEnvelopeInterceptor,
    },
    {
      provide: APP_PIPE,
      useFactory: (): ValidationPipe => createAppValidationPipe(),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
