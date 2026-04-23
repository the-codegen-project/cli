---
id: UserSignedUp
name: User Signed Up
version: 1.0.0
summary: Event published when a new user successfully registers
badges:
  - content: Core Event
    backgroundColor: green
    textColor: white
owners:
  - user-team
schemaPath: schema.json
---

## Overview

The `UserSignedUp` event is published by the User Service whenever a new user successfully completes the registration process. This event is a key integration point for downstream services.

## Consumers

| Service | Purpose |
|---------|---------|
| Notification Service | Send welcome email |
| Analytics Service | Track signup metrics |
| Onboarding Service | Initialize user onboarding flow |

## Payload Example

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "displayName": "John Doe",
  "signupTimestamp": "2024-01-15T10:30:00Z",
  "signupSource": "web",
  "metadata": {
    "referralCode": "FRIEND123"
  }
}
```

## Headers

| Header | Type | Description |
|--------|------|-------------|
| correlationId | UUID | Request tracing ID |
| timestamp | ISO 8601 | Event timestamp |
| version | String | Schema version |
