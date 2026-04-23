---
id: user-service
name: User Service
version: 1.0.0
summary: Handles user registration, authentication, and profile management
owners:
  - user-team
badges:
  - content: AsyncAPI
    backgroundColor: purple
    textColor: white
  - content: Production
    backgroundColor: green
    textColor: white
sends:
  - id: UserSignedUp
    version: 1.0.0
receives: []
repository:
  language: TypeScript
  url: https://github.com/acme-corp/user-service
specifications:
  asyncapiPath: asyncapi.yaml
---

## Overview

The User Service is responsible for all user-related operations in the platform. It publishes events when users perform actions like signing up, updating their profile, or changing their preferences.

## Architecture

```mermaid
graph LR
    A[Client] --> B[User Service]
    B --> C[NATS]
    C --> D[Notification Service]
    C --> E[Analytics Service]
```

## Events Published

| Event | Description |
|-------|-------------|
| UserSignedUp | Published when a new user registers |

## Getting Started

```bash
# Install dependencies
npm install

# Start the service
npm run start
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `NATS_URL` | NATS server URL | `nats://localhost:4222` |
| `DATABASE_URL` | PostgreSQL connection string | - |
