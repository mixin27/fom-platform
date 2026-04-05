import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { CustomersController } from './customers/customers.controller';
import { CustomersService } from './customers/customers.service';
import { AppExceptionFilter } from './common/http/exception.filter';
import { RequestContextMiddleware } from './common/http/request-context';
import { ResponseEnvelopeInterceptor } from './common/http/response-envelope.interceptor';
import { OrdersController } from './orders/orders.controller';
import { OrdersService } from './orders/orders.service';
import { ShopsController } from './shops/shops.controller';
import { ShopsService } from './shops/shops.service';
import { InMemoryStoreService } from './store/in-memory-store.service';
import { SummariesController } from './summaries/summaries.controller';
import { SummariesService } from './summaries/summaries.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { AuthGuard } from './common/http/auth.guard';
import { RbacGuard } from './common/http/rbac.guard';

@Module({
  imports: [],
  controllers: [
    AppController,
    AuthController,
    UsersController,
    ShopsController,
    CustomersController,
    OrdersController,
    SummariesController,
  ],
  providers: [
    AppService,
    InMemoryStoreService,
    AuthService,
    UsersService,
    ShopsService,
    CustomersService,
    OrdersService,
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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
