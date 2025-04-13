import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { Logger } from '@nestjs/common';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: AmqpConnectionManager;
  private channel: ChannelWrapper;
  private isInitialized = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      const host = this.configService.get<string>('RABBITMQ_HOST');
      const port = this.configService.get<number>('RABBITMQ_PORT');
      const username = this.configService.get<string>('RABBITMQ_USERNAME');
      const password = this.configService.get<string>('RABBITMQ_PASSWORD');
      const vhost = this.configService.get<string>('RABBITMQ_VHOST');

      const uri = `amqp://${username}:${password}@${host}:${port}${vhost}`;
      this.logger.debug(`Connecting to RabbitMQ at ${uri}`);

      this.connection = connect([uri], {
        heartbeatIntervalInSeconds: 30,
        reconnectTimeInSeconds: 5,
        connectionOptions: {
          timeout: 10000,
        },
      });

      this.connection.on('connect', () => {
        this.logger.log('Connected to RabbitMQ');
        this.isInitialized = true;
      });

      this.connection.on('disconnect', (err) => {
        this.logger.error('Disconnected from RabbitMQ', err);
        this.isInitialized = false;
      });

      this.connection.on('connectFailed', (err) => {
        this.logger.error('Failed to connect to RabbitMQ', err);
        this.isInitialized = false;
      });

      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error', err);
        this.isInitialized = false;
      });

      this.channel = await this.connection.createChannel({
        json: true,
        setup: async (channel) => {
          try {
            await channel.assertExchange('hiring', 'topic', { durable: true });
            await channel.assertQueue('notifications', { durable: true });
            await channel.bindQueue('notifications', 'hiring', 'notification.#');
            this.logger.log('Exchange and queue setup completed');
            this.isInitialized = true;
          } catch (error) {
            this.logger.error('Failed to setup exchange and queue', error);
            this.isInitialized = false;
            throw error;
          }
        },
      });

    } catch (error) {
      this.logger.error('Failed to initialize RabbitMQ connection', error);
      this.isInitialized = false;
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isInitialized = false;
    } catch (error) {
      this.logger.error('Error during cleanup', error);
    }
  }

  async publish(exchange: string, routingKey: string, message: any): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('RabbitMQ service not initialized');
    }

    try {
      if (!this.channel) {
        throw new Error('RabbitMQ channel not initialized');
      }

      await this.channel.publish(exchange, routingKey, message, {
        persistent: true,
      });
      this.logger.debug(`Published message to ${exchange} with routing key ${routingKey}`);
    } catch (error) {
      this.logger.error(`Failed to publish message to ${exchange}`, error);
      throw error;
    }
  }

  getChannel(): ChannelWrapper {
    if (!this.isInitialized || !this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    return this.channel;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
} 