import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { Notification } from '../notifications/entities/notification.entity';
import { CreateNotificationsTable1710000000000 } from '../migrations/1710000000000-CreateNotificationsTable';

config();

const configService = new ConfigService();

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: configService.get('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_DATABASE'),
  entities: [Notification],
  migrations: [CreateNotificationsTable1710000000000],
  synchronize: configService.get('NODE_ENV') !== 'production',
  logging: configService.get('NODE_ENV') !== 'production',
  migrationsRun: true, // Automatically run migrations on startup
};

export default new DataSource(typeOrmConfig); 