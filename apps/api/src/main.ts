import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new FastifyAdapter());
  app.enableCors();

  const openApiDocument = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Facebook Order Manager API')
      .setDescription(
        'Backend API for the Facebook Order Manager mobile application',
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
        title: 'Facebook Order Manager API Reference',
        url: '/openapi.json',
      },
    });

  await app.listen(
    process.env.PORT ? Number(process.env.PORT) : 4000,
    '0.0.0.0',
  );
}
bootstrap();
