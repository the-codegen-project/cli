# E-commerce Header Models
A comprehensive example showing how to generate TypeScript header models from AsyncAPI specifications for an e-commerce messaging system.

**Files:**
- `ecommerce-messaging-system.yaml` - AsyncAPI specification with comprehensive header patterns
- `codegen.config.js` - Configuration for generating TypeScript header models
- `src/index.ts` - Demo script showing header usage patterns
- `src/generated` - All the generated files

**Features demonstrated:**
- Authentication headers (JWT tokens, API keys)
- Distributed tracing headers (correlation IDs, request IDs)
- Multi-tenant routing headers
- Event metadata headers (actor info, reason codes, priorities)
- Payment processing headers (provider info, risk scores, idempotency)
- Type-safe TypeScript classes with serialization/deserialization

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
