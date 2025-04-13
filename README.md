# Notification Service

A notification service built with NestJS for handling email notifications in the hiring pipeline. This service integrates with RabbitMQ for event-driven notifications and uses PostgreSQL for persistence.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Set up your environment:
```bash
cp .env.example .env
# Edit .env with your settings
```

3. Start the service:
```bash
# Development
npm run dev

# Production
npm run build && npm start
```

## Environment Variables

Required environment variables:

```env
# Server
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=notification_service

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_QUEUE=notifications

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
```

## Development

The service uses TypeScript and follows NestJS conventions. Key directories:

```
src/
├── notifications/      # Core notification logic
├── migrations/        # Database migrations
└── config/           # Configuration
```

### Running Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

### API Documentation

Swagger docs are available at `/api/docs` when running in development mode.

## Implementation Details

### Core Features
- Event-driven architecture using RabbitMQ
- Email notifications with templates
- Retry mechanism for failed notifications
- Database persistence with PostgreSQL
- RESTful API with Swagger documentation

### Assumptions Made
1. Email is the primary notification channel
2. Templates are stored in the database
3. Failed notifications should be retried automatically
4. Events come from a hiring pipeline system
5. Each notification belongs to one recipient

## Future Improvements

Given more time, these areas could be enhanced:

1. **Additional Features**
   - SMS notifications support
   - In-app notifications
   - Webhook support for third-party integrations
   - Batch notification processing

2. **Technical Enhancements**
   - GraphQL API alongside REST
   - Real-time notification status updates
   - Advanced template system with versioning
   - Performance optimization for high load

3. **Operational Improvements**
   - Kubernetes deployment manifests
   - CI/CD pipeline setup
   - Monitoring dashboard
   - Performance metrics collection

4. **Security Enhancements**
   - Rate limiting
   - Advanced authentication
   - Audit logging
   - Security scanning

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a PR

## License

MIT