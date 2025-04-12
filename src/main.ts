import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configure RabbitMQ Microservice
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('rabbitmq.url')!],
      queue: configService.get<string>('rabbitmq.queue')!,
      queueOptions: {
        durable: true,
      },
    },
  });

  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Notification Service')
    .setDescription('API documentation for the notification service')
    .setVersion('1.0')
    .addTag('notifications')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Start both HTTP and Microservice
  await app.startAllMicroservices();
  await app.listen(configService.get<number>('port')!);
}
bootstrap();
