---
id: inventory-service
name: Inventory Service
version: 1.0.0
summary: Tracks product stock levels
owners:
  - inventory-team
sends:
  - id: StockUpdated
    version: 1.0.0
receives:
  - id: OrderCreated
    version: 1.0.0
---

The Inventory Service manages product stock and alerts.
