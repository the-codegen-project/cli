# E-commerce Parameter Models
A comprehensive example showing how to generate TypeScript parameter models from AsyncAPI specifications for dynamic channel routing in an e-commerce messaging system.

**Files:**
- `ecommerce-parameter-system.yaml` - AsyncAPI specification with comprehensive parameter patterns
- `codegen.config.js` - Configuration for generating TypeScript parameter models
- `src/index.ts` - Demo script showing parameter usage patterns
- `src/generated` - All the generated files

**Features demonstrated:**
- Type-safe channel construction with parameters
- Parameter extraction from channel names
- Complex parameter patterns (multiple parameters, hierarchical routing)
- Validation and error handling
- Integration with various messaging systems (NATS, Kafka examples)

**Usage:**
```bash
# Install dependencies
npm install

# Generate parameter models
npm run generate

# Run the demo script
npm run demo
```

The generated parameter models can be used with any messaging infrastructure while providing type safety and automatic channel construction/parsing capabilities. 