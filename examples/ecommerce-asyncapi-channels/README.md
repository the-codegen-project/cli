# E-commerce Order Lifecycle Events
A focused example showing how to generate protocol-specific messaging functions from AsyncAPI specifications for order lifecycle management in an e-commerce system.

**Files:**
- `ecommerce-event-channels.yaml` - AsyncAPI specification with order lifecycle channel definitions, operations, and parameterized routing
- `codegen.config.js` - Configuration for generating protocol-specific messaging functions
- `src/index.ts` - Demo script showing order lifecycle event patterns
- `src/generated` - All the generated files

**Features demonstrated:**
- Protocol-specific functions for NATS and Kafka
- Order lifecycle events (created, updated, cancelled, shipped, delivered)
- Parameterized channel addresses (orders.{action})
- Operation-based function generation
- Type-safe order event publishing and subscription
- Comprehensive order data modeling (items, addresses, money)
- Multi-protocol support (NATS for real-time, Kafka for analytics)
- Automatic parameter handling and message validation
- Order workflow orchestration patterns

**Order Lifecycle Flow:**
- `OrderCreated` - New order placed by customer
- `OrderUpdated` - Order status changes (pending → processing → shipped → delivered)
- `OrderCancelled` - Order cancelled with refund processing

**Usage:**
```bash
# Install dependencies
npm install

# Generate protocol-specific functions
npm run generate

# Run the order lifecycle demo
npm run demo
```

The generated protocol functions provide type-safe order event handling with automatic parameter substitution for channel addressing and comprehensive order data validation.
