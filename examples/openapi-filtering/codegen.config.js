export default {
  inputType: 'openapi',
  inputPath: './openapi.json',
  // Generate code for only a subset of the API:
  //  - include: keep everything under /users and the /orders path
  //  - exclude: drop the internal audit endpoint even though /users/** matched it
  // Anything not included (e.g. /metrics) is left out, and component schemas
  // that become orphaned (AuditEntry, Metrics) are pruned automatically.
  filter: {
    include: ['/users', '/users/**', '/orders'],
    exclude: ['/users/{id}/audit']
  },
  generators: [
    {
      preset: 'payloads',
      outputPath: './src/generated/payloads',
      language: 'typescript',
      serializationType: 'json'
    }
  ]
};
