---
name: troubleshoot
description: Diagnose and fix common issues in the project
---

# Troubleshoot

Diagnose the issue described in `$ARGUMENTS`.

## Quick Reference

| Issue | Fix |
|-------|-----|
| Build fails | `npm run build` and fix TypeScript errors |
| Tests fail | `npm run test:update` if snapshots need updating |
| Linting fails | `npm run lint:fix` to auto-fix |
| Docker down | `npm run runtime:services:start` |
| MQTT headers missing | Add `protocolVersion: 5` to connection |
| Generator not found | Check discriminated union in `src/codegen/types.ts` |
| Zod defaults missing | Add `.default()` to optional fields |

## Build Failures

Common causes: missing imports, type errors, circular dependencies.
- Review TypeScript errors in build output
- Check all imports are correct
- Verify types match expected interfaces

## Test Failures

- **Outdated snapshots**: `npm run test:update`
- **Missing test data**: Check test fixtures
- **Blackbox failures**: Inspect generated code in `test/blackbox/output/[schema]/[config]/src/`
- **Runtime failures**: Check Docker containers with `docker ps` and `docker logs`

## Protocol Issues

- **MQTT headers not received**: Ensure `protocolVersion: 5` on client connection
- **Cross-channel messages**: Add topic filtering with `findRegexFromChannel()`
- **NATS connection refused**: `npm run runtime:nats:start`
- **Kafka consumer group errors**: Use unique consumer group IDs
- **AMQP queue conflicts**: Use unique queue names or cleanup in teardown

## Generation Issues

- **Object parameters not generated**: Check generator uses object destructuring
- **Validation methods missing**: Ensure `includeValidation: true` and preset applied
- **Union types not marshalling**: Include `createUnionPreset()` and verify discriminator

## Debugging Steps

1. Run the failing command in isolation
2. Check generated code output
3. Review error messages for context
4. Compare with working examples in existing code
5. Use `Logger` for structured debugging output
