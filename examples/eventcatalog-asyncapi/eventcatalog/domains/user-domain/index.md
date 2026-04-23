---
id: user-domain
name: User Domain
version: 1.0.0
summary: Domain responsible for all user-related functionality
owners:
  - platform-team
services:
  - id: user-service
    version: 1.0.0
badges:
  - content: Core Domain
    backgroundColor: blue
    textColor: white
---

## Overview

The User Domain encompasses all functionality related to user management, including:

- User registration and authentication
- Profile management
- User preferences
- Account lifecycle

## Bounded Context

This domain owns the concept of a "User" and is the source of truth for user identity and profile information.

## Services

| Service | Description |
|---------|-------------|
| User Service | Core service for user operations |

## Events

| Event | Published By | Description |
|-------|--------------|-------------|
| UserSignedUp | User Service | New user registration |
| UserProfileUpdated | User Service | Profile changes |
