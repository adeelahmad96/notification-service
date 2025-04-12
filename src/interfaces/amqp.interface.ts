import { ConsumeMessage } from 'amqplib';

export interface AMQPChannel {
  assertQueue(queue: string, options?: any): Promise<any>;
  consume(queue: string, onMessage: (msg: ConsumeMessage | null) => void): Promise<any>;
  ack(message: ConsumeMessage): void;
  nack(message: ConsumeMessage, allUpTo?: boolean, requeue?: boolean): void;
  close(): Promise<void>;
}

export interface AMQPConnection {
  createChannel(): Promise<AMQPChannel>;
  on(event: string, listener: (arg: any) => void): void;
  close(): Promise<void>;
}

export { ConsumeMessage }; 