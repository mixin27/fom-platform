import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { RealtimeService } from './realtime/realtime.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new FastifyAdapter());
  app.enableCors();

  const fastify = app.getHttpAdapter().getInstance();
  const websocketPlugin = (await import('@fastify/websocket')).default;
  await fastify.register(websocketPlugin);
  await app.get(RealtimeService).registerWebsocketRoutes(fastify);

  const openApiDocument = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('FOM Platform API')
      .setDescription(
        'Backend API for the FOM Platform ([getfom.com](https://getfom.com))',
      )
      .setVersion('0.1.0')
      .addServer('http://localhost:4000')
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

  await app.listen(
    process.env.PORT ? Number(process.env.PORT) : 4000,
    '0.0.0.0',
  );
}
bootstrap();
