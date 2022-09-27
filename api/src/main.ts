import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerDocumentOptions,
} from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { urlencoded, json } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
	app.use(cookieParser());
	app.useGlobalPipes(new ValidationPipe());
  app.use('/user/avatar', json({ limit: '8mb' }));
  app.use(json({ limit: '100kb' }));
  app.use(urlencoded({ extended: true, limit: '8mb' }));
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/public/',
  });

  const cors_options = {
    origin: [
      "http://localhost:8080/",
      "https://signin.intra.42.fr/",
      "https://localhost:3000/",
      "https://localhost:3001/",
      "https://api.intra.42.fr/"
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    preflightContinue: true,
    optionsSuccessStatus: 204,
    credentials: true
  };

  app.enableCors(cors_options);

  const config = new DocumentBuilder()
    .setTitle('FT_TRANSCENDENCE API')
    .setDescription('API used by ft_transcendence backend')
    .setVersion('1.0')
    .addTag('api')
    .addCookieAuth('Authentication')
    .build();

  const options: SwaggerDocumentOptions = {
    deepScanRoutes: true,
  };
  const document = SwaggerModule.createDocument(app, config, options);
  SwaggerModule.setup('docs', app, document);


  await app.listen(3000);
}
bootstrap();
