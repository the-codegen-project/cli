# E-commerce AsyncAPI Client Generator Example

This example demonstrates the **AsyncAPI Client Generator** from [The Codegen Project](https://the-codegen-project.org), showing how to generate complete, type-safe client SDKs for NATS messaging with order lifecycle management.

**Files:**
- `ecommerce-event-channels.yaml` - AsyncAPI specification with order lifecycle channel definitions, operations, and parameterized routing
- `codegen.config.js` - Configuration for generating protocol-specific messaging functions
- `src/index.ts` - Demo script showing order lifecycle event patterns
- `src/generated` - All the generated files
- `docker-run-nats.sh` - Sets up NATS server with JetStream for testing
- `docker-stop-nats.sh` - Stops and cleans up the NATS server

**Features demonstrated:**

1. **Simplified API** - Clean, intuitive methods instead of protocol-specific details
2. **Connection Management** - Automatic connection handling and lifecycle management
3. **Type Safety** - Full TypeScript support with compile-time validation
4. **Error Handling** - Built-in connection validation and error messages
5. **JetStream Integration** - Seamless JetStream support for durability
6. **Authentication Support** - Built-in methods for different auth patterns
7. **Automatic Cleanup** - Proper connection cleanup and resource management

## Quick Start

### 1. Set up NATS Server with JetStream

```bash
# Start NATS server with JetStream and configured streams
./docker-run-nats.sh
```

This script will:
- Start a NATS server container with JetStream enabled
- Create the `ORDERS_LIFECYCLE` stream for order events
- Set up subjects: `orders.created`, `orders.updated`, `orders.cancelled`, `orders.shipped`, `orders.delivered`
- Create a durable consumer `order-processor` for reliable message processing
- Expose NATS on `localhost:4222` and monitoring on `localhost:8222`

### 2. Install Dependencies and Generate Code

```bash
# Install dependencies
npm install

# Generate protocol-specific functions
npm run generate
```

### 3. Run the Demo

```bash
# Run the order lifecycle demo
npm run demo
```

### 4. Cleanup

```bash
# Stop and remove the NATS server
./docker-stop-nats.sh
```

## NATS Setup Details

The Docker setup creates:

**Stream Configuration:**
- **Stream Name**: `ORDERS_LIFECYCLE`
- **Subjects**: `orders.>` (captures all order events)
- **Storage**: Memory (for testing)
- **Retention**: 24 hours, 1M messages max
- **Deduplication**: 2-minute window

**Available Subjects:**
- `orders.created` - New order events
- `orders.updated` - Order status updates  
- `orders.cancelled` - Order cancellations
- `orders.shipped` - Order shipment events
- `orders.delivered` - Order delivery events

**Consumers:**
- `order-processor` - Durable pull consumer for reliable processing

**Monitoring:**
- NATS Server: http://localhost:8222
- Stream metrics and consumer status available via NATS CLI

The generated protocol functions provide type-safe order event handling with automatic parameter substitution for channel addressing and comprehensive order data validation.
