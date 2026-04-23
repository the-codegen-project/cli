---
id: order-service
name: Order Service
version: 1.0.0
summary: Manages order lifecycle
owners:
  - orders-team
sends:
  - id: OrderCreated
    version: 1.0.0
  - id: OrderShipped
    version: 1.0.0
receives: []
---

The Order Service handles order creation and fulfillment.
