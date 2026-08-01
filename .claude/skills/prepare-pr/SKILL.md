---
name: prepare-pr
description: Run the full PR preparation pipeline and fix any issues
---

# Prepare PR

Run the mandatory quality gates before completing any task.

## Steps

1. Run `npm run prepare:pr` which executes:
   - `npm run build` - Ensure code compiles
   - `npm run format` - Format all code
   - `npm run lint:fix` - Fix linting issues
   - `npm run test:update` - Update snapshots and run tests

2. If any step fails:
   - Fix the root cause (not just symptoms)
   - Re-run `npm run prepare:pr` until it passes completely

3. Verify checklist:
   - All build errors resolved
   - All linting errors fixed
   - All tests passing
   - Code properly formatted
   - No TypeScript compilation errors

## For Generator Changes

Also verify:
- Zod schema with proper defaults
- Both input and internal types defined
- Unit tests added/updated
- Blackbox tests passing
- Runtime tests passing (if applicable)

## For Documentation Changes

Also verify:
- Documentation accurate and complete
- Examples working and tested
- JSON schemas updated if configuration changed
