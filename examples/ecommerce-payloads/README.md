# E-commerce Payload Models
A comprehensive example showing how to generate TypeScript payload models from AsyncAPI specifications for an e-commerce order processing system.

**Files:**
- `ecommerce-order-system.yaml` - AsyncAPI specification with complex schemas, union types, and circular references
- `codegen.config.js` - Configuration for generating TypeScript payload models
- Test script: `../scripts/test-payload-generation.js`

**Features demonstrated:**
- Complex nested objects (orders with items arrays)
- Union types (different notification channels)
- Circular references (category hierarchies)
- JSON Schema validation
- Type-safe TypeScript classes
- Serialization/deserialization

**Usage:**
```bash
# Install dependencies
npm install

# Generate payload models
npm run generate

# Run the test script to validate generation
npm run demo
```

The generated models can be used with any messaging infrastructure (NATS, Kafka, RabbitMQ, etc.) while providing type safety and validation.

## Getting Started

1. Choose an example that matches your use case
2. Copy the relevant files to your project
3. Modify the configuration to match your specifications
4. Run the generator
5. Integrate the generated code into your application

For more detailed information, see the [documentation](https://the-codegen-project.org/docs/).
