# E-commerce Channel Types - Comprehensive Example

A comprehensive example showing how to generate type-safe channel routing from AsyncAPI specifications for an e-commerce event system. This example demonstrates all the patterns from the accompanying [blog post](https://the-codegen-project.org/blog/asyncapi-types-generator).

**Files:**
- `ecommerce-channels.yaml` - AsyncAPI specification defining event channels and routing
- `codegen.config.js` - Configuration for generating TypeScript channel types
- `src/index.ts` - Comprehensive demo showcasing all blog post examples

**Features demonstrated:**
- **Type-Safe Event Publisher** - Publish events with compile-time channel validation
- **Type-Safe Event Router** - Route events to handlers with type safety
- **Message Broker Integration** - Examples for NATS and Kafka
- **Environment-Specific Channel Mapping** - Add environment prefixes
- **Channel Health Monitoring** - Track publishing metrics and error rates
- **Parameter Substitution** - Dynamic channel addresses with entity IDs
- **Error Handling** - Runtime validation with proper error handling

**Usage:**
```bash
# Install dependencies
npm install

# Generate channel types from AsyncAPI spec
npm run generate

# Run the comprehensive demo showcasing all patterns
npm run demo
```

The generated types can be used with any messaging infrastructure (NATS, Kafka, RabbitMQ, etc.) while providing compile-time safety for channel routing.
