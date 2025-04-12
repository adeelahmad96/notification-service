import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HiringPipelineConsumer } from './consumers/hiring-pipeline.consumer';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    NotificationsModule,
    ClientsModule.registerAsync([
      {
        name: 'HIRING_PIPELINE_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const rabbitmqUrl = configService.get<string>('RABBITMQ_URL');
          if (!rabbitmqUrl) {
            throw new Error('RABBITMQ_URL environment variable is not defined');
          }
          
          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitmqUrl],
              queue: 'hiring_pipeline_events',
              queueOptions: {
                durable: true,
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [HiringPipelineConsumer],
})
export class HiringPipelineModule {} 