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
import { AppExceptionFilter } from './common/http/exception.filter';
import { RequestContextMiddleware } from './common/http/request-context';
import { ResponseEnvelopeInterceptor } from './common/http/response-envelope.interceptor';
import { OrdersController } from './orders/orders.controller';
import { OrderMessageParserService } from './orders/order-message-parser.service';
import { OrdersService } from './orders/orders.service';
import { PrismaService } from './common/prisma/prisma.service';
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
import { createAppValidationPipe } from './common/http/validation-pipe';

@Module({
  imports: [JwtModule.register({})],
  controllers: [
    AppController,
    AuthController,
    UsersController,
    ShopsController,
    CustomersController,
    OrdersController,
    DeliveriesController,
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
    CustomersService,
    OrderMessageParserService,
    OrdersService,
    DeliveriesService,
    TemplatesService,
    SummariesService,
    AuthGuard,
    RbacGuard,
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
