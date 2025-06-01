# E-commerce Header Models
A comprehensive example showing how to generate TypeScript header models from AsyncAPI specifications for an e-commerce messaging system.

**Files:**
- `ecommerce-messaging-system.yaml` - AsyncAPI specification with comprehensive header patterns
- `codegen.config.js` - Configuration for generating TypeScript header models
- `src/index.ts` - Demo script showing header usage patterns

**Features demonstrated:**
- Authentication headers (JWT tokens, API keys)
- Distributed tracing headers (correlation IDs, request IDs)
- Multi-tenant routing headers
- Event metadata headers (actor info, reason codes, priorities)
- Payment processing headers (provider info, risk scores, idempotency)
- Inventory management headers (warehouse info, audit trails)
- Notification headers (localization, delivery preferences)
- Analytics headers (user tracking, privacy compliance)
- Admin action headers (security, compliance, audit)
- Type-safe TypeScript classes with serialization/deserialization

**Header Patterns Covered:**
- **Authentication & Authorization**: JWT tokens, API keys, permission levels
- **Distributed Tracing**: Correlation IDs, request IDs, timestamps
- **Multi-tenancy**: Tenant identifiers, routing keys
- **Event Routing**: Event types, priorities, source services
- **Security & Compliance**: Risk scores, audit levels, compliance tags
- **Localization**: Language codes, regional preferences
- **Performance**: Retry counts, idempotency keys, batch operations

**Usage:**
```bash
# Install dependencies
npm install

# Generate header models
npm run generate

# Run the demo script
npm run demo
```

The generated header models can be used with any messaging infrastructure (NATS, Kafka, RabbitMQ, HTTP APIs, etc.) while providing type safety and automatic serialization.

## Real-World Use Cases

### 1. NATS Messaging
```typescript
import { OrderCreatedHeaders } from './generated/headers/OrderCreatedHeaders.js';

const headers = new OrderCreatedHeaders({
  xCorrelationId: 'order-123',
  xUserId: 'user-456',
  xTenantId: 'tenant-prod',
  authorization: 'Bearer token...'
});

await nc.publish('orders.created', payload, {
  headers: JSON.parse(headers.marshal())
});
```

### 2. Kafka Integration
```typescript
import { PaymentProcessedHeaders } from './generated/headers/PaymentProcessedHeaders.js';

const headers = new PaymentProcessedHeaders({
  xCorrelationId: 'payment-789',
  xPaymentProvider: 'stripe',
  xTenantId: 'tenant-prod'
});

await producer.send({
  topic: 'payments.processed',
  messages: [{
    headers: JSON.parse(headers.marshal()),
    value: JSON.stringify(payload)
  }]
});
```

### 3. HTTP API Headers
```typescript
import { AdminActionPerformedHeaders } from './generated/headers/AdminActionPerformedHeaders.js';

const headers = new AdminActionPerformedHeaders({
  xCorrelationId: 'admin-action-123',
  xAdminId: 'admin-456',
  xTenantId: 'tenant-prod',
  xActionType: 'user-management',
  xPermissionLevel: 'admin'
});

// Use in Express.js middleware
app.use((req, res, next) => {
  req.typedHeaders = AdminActionPerformedHeaders.unmarshal(req.headers);
  next();
});
```

## Benefits

1. **Type Safety**: Full TypeScript support with compile-time checking
2. **Automatic Serialization**: Built-in JSON marshalling/unmarshalling
3. **Header Validation**: Ensure required headers are present
4. **Infrastructure Freedom**: Use with any messaging system
5. **Maintainability**: Schema changes automatically update header models
6. **Compliance**: Built-in support for audit trails and compliance requirements
7. **Performance**: Optimized serialization for high-throughput systems
