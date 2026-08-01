---
paths:
  - "test/**/*.ts"
  - "test/**/*.js"
  - "test/**/*.spec.ts"
---

# Testing Rules

## Three-Tier Approach

1. **Unit tests** (`test/codegen/`) - Individual functions, config parsing, error handling. 80%+ coverage.
2. **Blackbox tests** (`test/blackbox/`) - Generated code compiles. Generate -> copy to temp project -> `npm run build`.
3. **Runtime tests** (`test/runtime/`) - Generated code works correctly. Uses Docker for protocol testing.

## Runtime Tests as Design Specification

Always create manual implementation before building generators:
1. Manual implementation in `test/runtime/typescript/src/`
2. Write tests validating the manual implementation
3. Build generator to produce identical output
4. Generated code must pass the same tests

## Object Parameters in Tests (MANDATORY)

All callbacks MUST use object parameters:

```typescript
onDataCallback: (params) => {
  const {err, msg, parameters, headers, protocolMsg} = params;
  expect(err).toBeUndefined();
  expect(msg?.marshal()).toEqual(testMessage.marshal());
}
```

Protocol destructuring patterns:
- **NATS**: `{err, msg, parameters, headers}`
- **Kafka**: `{err, msg, headers, kafkaMessage}`
- **MQTT**: `{err, msg, parameters, headers, mqttMsg}` - REQUIRES `protocolVersion: 5`
- **AMQP**: `{err, msg, headers, amqpMsg}`
- **EventSource**: `{error, messageEvent}`

## Test Commands

```bash
npm test                                          # Unit tests
npm test -- --coverage                            # With coverage
npm run test:blackbox:typescript                   # Blackbox tests
npm run runtime:services:start                     # Start Docker containers
npm run runtime:typescript                         # Full runtime suite
cd test/runtime/typescript && npm run test:nats    # Individual protocol
npm run runtime:services:stop                      # Stop containers
```

## Test Structure

```
test/
├── blackbox/
│   ├── configs/typescript/     # Test configurations
│   ├── schemas/[input-type]/   # Test input documents
│   └── projects/typescript/    # Base project template
├── runtime/typescript/
│   ├── src/                    # Generated code location
│   ├── test/                   # Runtime test specs
│   └── codegen-*.mjs           # Generator configurations
└── codegen/                    # Unit tests
```
