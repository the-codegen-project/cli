---
name: add-protocol
description: Step-by-step workflow for adding a new messaging protocol to the channels generator
---

# Add a New Protocol

Follow these steps to add `$ARGUMENTS` protocol support:

## Phase 1: Design Expected Output

1. Manually create expected channel functions in `test/runtime/typescript/src/`
2. Write runtime tests in `test/runtime/typescript/test/channels/`
3. All callbacks MUST use object parameters: `(params: {err?, msg?, parameters?, headers?, protocolMsg?}) => void`
4. Validate manual implementation passes tests

## Phase 2: Infrastructure

5. Create Docker Compose file: `test/runtime/docker-compose-$ARGUMENTS.yml`
6. Add npm scripts in root `package.json`:
   - `runtime:$ARGUMENTS:start`
   - `runtime:$ARGUMENTS:stop`

## Phase 3: Implementation

7. Create protocol directory: `src/codegen/generators/typescript/channels/protocols/$ARGUMENTS/`
8. Implement operations: `publish.ts`, `subscribe.ts`, `request.ts`, `reply.ts` (as applicable)
9. All functions MUST use object parameters
10. Implement protocol-specific header handling

## Phase 4: Registration

11. Add function types to `ChannelFunctionTypes` enum in channel types
12. Add subscribe types to `receivingFunctionTypes` array

## Phase 5: Testing

13. Write runtime tests with Docker containers
14. Add blackbox test configurations
15. Verify all tests pass: `npm run prepare:pr`
