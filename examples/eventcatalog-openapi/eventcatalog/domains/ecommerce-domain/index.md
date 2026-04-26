---
id: ecommerce-domain
name: E-Commerce Domain
version: 1.0.0
summary: Domain encompassing all e-commerce functionality
owners:
  - platform-team
services:
  - id: petstore-api
    version: 1.0.0
badges:
  - content: Core Domain
    backgroundColor: blue
    textColor: white
---

## Overview

The E-Commerce Domain encompasses all functionality related to the online pet store, including:

- Pet inventory management
- Order processing
- Customer management
- Payment processing

## Bounded Context

This domain owns the concepts of Pet, Order, and Store operations. It is the source of truth for product catalog and order lifecycle.

## Services

| Service | Type | Description |
|---------|------|-------------|
| Petstore API | REST | Main API for pet and order management |

## Integration Points

| System | Direction | Description |
|--------|-----------|-------------|
| Payment Gateway | Outbound | Process payments |
| Shipping Service | Outbound | Fulfill orders |
| Inventory System | Bidirectional | Sync stock levels |
