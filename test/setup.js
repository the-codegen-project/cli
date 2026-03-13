// Global test setup - runs before all tests
// Disable telemetry during testing to avoid polluting analytics with test data
// eslint-disable-next-line no-undef
process.env.CODEGEN_TELEMETRY_DISABLED = '1';

// Suppress Node.js deprecation warnings (e.g., DEP0040 for punycode)
// These come from transitive dependencies (tr46 via node-fetch via @asyncapi/parser)
// and pollute stderr in CLI tests that capture output
// eslint-disable-next-line no-undef
process.noDeprecation = true;

