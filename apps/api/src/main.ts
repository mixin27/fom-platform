import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import { RealtimeService } from './realtime/realtime.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new FastifyAdapter(), {
    rawBody: true,
  });
  assertProductionReadiness();
  app.enableCors({
    origin: resolveCorsOrigins(),
    credentials: true,
  });

  const fastify = app.getHttpAdapter().getInstance();
  const websocketPlugin = (await import('@fastify/websocket')).default;
  await fastify.register(websocketPlugin);
  await app.get(RealtimeService).registerWebsocketRoutes(fastify);

  if (app.get(AppService).isApiDocsEnabled()) {
    const openApiDocument = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('FOM Platform API')
        .setDescription(
          'Backend API for the FOM Platform ([getfom.com](https://getfom.com))',
        )
        .setVersion('0.1.0')
        .addServer(
          process.env.PUBLIC_API_BASE_URL?.trim() || 'http://localhost:4000',
        )
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Access token returned by /api/v1/auth/login',
          },
          'access-token',
        )
        .build(),
    );

    SwaggerModule.setup('docs', app, openApiDocument, {
      jsonDocumentUrl: '/openapi.json',
      yamlDocumentUrl: '/openapi.yaml',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    });

    const scalarApiReference = (await import('@scalar/fastify-api-reference'))
      .default;
    await app
      .getHttpAdapter()
      .getInstance()
      .register(scalarApiReference, {
        routePrefix: '/reference',
        configuration: {
          title: 'FOM Platform API Reference',
          url: '/openapi.json',
        },
      });
  }

  await app.listen(
    process.env.PORT ? Number(process.env.PORT) : 4000,
    '0.0.0.0',
  );
}
bootstrap();

function resolveCorsOrigins() {
  const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (configuredOrigins.length === 0) {
    if ((process.env.NODE_ENV?.trim().toLowerCase() || '') === 'production') {
      return false;
    }

    return true;
  }

  return configuredOrigins;
}

function assertProductionReadiness() {
  const isProduction =
    (process.env.NODE_ENV?.trim().toLowerCase() || '') === 'production';
  if (!isProduction) {
    return;
  }

  const emailProvider =
    process.env.EMAIL_PROVIDER?.trim().toLowerCase() ||
    process.env.EMAIL_DELIVERY_MODE?.trim().toLowerCase() ||
    'log';

  if (['disabled', 'log'].includes(emailProvider)) {
    throw new Error(
      'Production startup blocked: configure EMAIL_PROVIDER to smtp or sendgrid.',
    );
  }

  if ((process.env.CORS_ALLOWED_ORIGINS ?? '').trim().length === 0) {
    throw new Error(
      'Production startup blocked: set CORS_ALLOWED_ORIGINS to explicit allowed origins.',
    );
  }
}
