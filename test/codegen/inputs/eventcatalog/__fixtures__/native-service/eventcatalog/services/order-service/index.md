---
id: order-service
name: Order Service
version: 1.2.3
summary: Manages order lifecycle
sends:
  - id: OrderCreated
    version: 1.0.0
receives:
  - id: OrderShipped
    version: 1.0.0
---

The Order Service handles order creation and fulfillment.
