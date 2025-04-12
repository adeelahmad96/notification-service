export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_DATABASE ?? 'notification_service',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV !== 'production',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
    queue: process.env.RABBITMQ_QUEUE ?? 'notifications',
  },
  email: {
    host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT ?? '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER ?? '',
    password: process.env.EMAIL_PASSWORD ?? '',
    from: process.env.EMAIL_FROM ?? '',
  },
}); 