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

## Scalability & Fault Tolerance

1. **Horizontal Scaling**
   - Stateless service design
   - Multiple instances can run in parallel
   - RabbitMQ handles message distribution
   - PostgreSQL handles shared state

2. **Fault Tolerance**
   - Message acknowledgments prevent lost events
   - Dead letter queues for failed messages
   - Automatic retry mechanism
   - Error tracking and logging

3. **High Availability**
   - No single point of failure
   - Automatic failover
   - Load balancing ready
   - Health checks implemented

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

1. **Event Processing (RabbitMQ)**
   - Reliable message delivery
   - Dead letter support
   - Horizontal scaling support
   - Message persistence

2. **Templates & Rules**
   - Database-stored for easy updates
   - Version control built-in
   - Support for multiple formats
   - Rule-based routing

3. **Error Handling**
   - Automatic retries
   - Error tracking
   - Dead letter queues
   - Status monitoring

4. **Monitoring & Observability**
   - Health check endpoints
   - Status tracking
   - Error logging
   - Performance metrics
