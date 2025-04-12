# Notification Service Architecture

## Overview

The notification service handles email notifications for the hiring pipeline using an event-driven architecture. It processes events from RabbitMQ, manages templates and rules for notifications, and sends emails through configurable channels.

## System Design

```
[Hiring Pipeline] --> [RabbitMQ] --> [Notification Service] --> [Email Service]
         |                                     |
         |                                     v
         +-----------------------------------> [Database]
```

The service:
- Consumes events from RabbitMQ
- Processes them using templates and rules
- Sends notifications via configured channels
- Stores state in PostgreSQL

## Database Schema

### notifications
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    recipient_id UUID NOT NULL,
    recipient_email VARCHAR(255),
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    html_content TEXT,
    metadata JSONB,
    status VARCHAR(20) NOT NULL,
    error TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMP
);
```

### notification_templates
```sql
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    event_type VARCHAR(50) NOT NULL,
    subject_template TEXT NOT NULL,
    content_template TEXT NOT NULL,
    html_template TEXT,
    version INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## API Endpoints

### Notifications
- `POST /api/v1/notifications` - Create notification
- `GET /api/v1/notifications/recipient/:id` - Get recipient's notifications
- `GET /api/v1/notifications/:id/status` - Get notification status
- `POST /api/v1/notifications/:id/retry` - Retry failed notification

### Templates
- `POST /api/v1/templates` - Create/update template
- `GET /api/v1/templates` - List templates
- `GET /api/v1/templates/:id` - Get template
- `DELETE /api/v1/templates/:id` - Deactivate template

## Design Choices

1. **RabbitMQ**
   - Reliable message delivery
   - Dead letter support for failed messages
   - Easy horizontal scaling

2. **Templates**
   - Stored in database for easy updates
   - Version control built-in
   - Supports both text and HTML formats

3. **Error Handling**
   - Automatic retries for failed notifications
   - Error tracking and logging
   - Dead letter queue for undeliverable messages
