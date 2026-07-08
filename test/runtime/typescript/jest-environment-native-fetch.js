// eslint-disable-next-line @typescript-eslint/no-var-requires
const NodeEnvironment = require('jest-environment-node').default || require('jest-environment-node');

/**
 * Node 18+ exposes fetch/Headers/Request/Response/FormData on the process global,
 * but jest 27's jest-environment-node does not copy them into the test sandbox.
 * Generated HTTP clients now rely on the global fetch (instead of node-fetch), so
 * inject the real native implementations (available in this main-process module)
 * into the sandbox global to exercise them exactly as a real consumer would.
 */
class NativeFetchEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup();
    const globals = ['fetch', 'Headers', 'Request', 'Response', 'FormData'];
    for (const name of globals) {
      if (this.global[name] === undefined && typeof globalThis[name] !== 'undefined') {
        this.global[name] = globalThis[name];
      }
    }
  }
}

module.exports = NativeFetchEnvironment;
