# Examples

This directory contains practical examples demonstrating how to use The Codegen Project for different use cases.

## Available Examples

### [TypeScript Library](./typescript-library/)
A complete example showing how to generate a TypeScript library from OpenAPI specifications.

### [TypeScript Next.js](./typescript-nextjs/)
An example demonstrating integration with Next.js applications.

### [E-commerce AsyncAPI Payload](./ecommerce-asyncapi-payload/)
A comprehensive example showing how to generate TypeScript payload models from AsyncAPI specifications for an e-commerce order processing system.

### [E-commerce AsyncAPI Parameters](./ecommerce-asyncapi-parameters/)
A comprehensive example showing how to generate TypeScript parameter models from AsyncAPI specifications for dynamic channel routing in an e-commerce messaging system.

### [E-commerce AsyncAPI Headers](./ecommerce-asyncapi-headers/)
A comprehensive example showing how to generate TypeScript header models from AsyncAPI specifications for an e-commerce messaging system, covering authentication, tracing, routing, and metadata management.

### [E-commerce AsyncAPI Channels](./ecommerce-asyncapi-channels/)
A focused example showing how to generate protocol-specific messaging functions from AsyncAPI specifications for order lifecycle management in an e-commerce system.

### [E-commerce AsyncAPI Client](./ecommerce-asyncapi-client/)
An example demonstrating how to generate complete, type-safe client SDKs for NATS messaging with order lifecycle management, including connection management and JetStream integration.

### [E-commerce AsyncAPI Types](./ecommerce-asyncapi-types/)
A comprehensive example showing how to generate TypeScript types from AsyncAPI specifications for an e-commerce messaging system.

## Getting Started

1. Choose an example that matches your use case
2. Copy the relevant files to your project
3. Modify the configuration to match your specifications
4. Run the generator
5. Integrate the generated code into your application

## Development Workflow

For active development, most examples include watch mode scripts for automatic code regeneration:

```bash
# For TypeScript Library example
npm run dev

# For Next.js example  
npm run generate:watch

# Or use the CLI directly
codegen generate --watch
```

Watch mode automatically regenerates your code when input files change, keeping your generated code in sync during development.

For more detailed information, see the [documentation](https://the-codegen-project.org/docs/).
