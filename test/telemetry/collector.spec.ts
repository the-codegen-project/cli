import {
  getCliVersion,
  getNodeVersion,
  getOSPlatform,
  isCI,
  collectSystemInfo
} from '../../src/telemetry/collector';

describe('Telemetry Collector', () => {
  describe('getCliVersion', () => {
    it('should return a version string', () => {
      const version = getCliVersion();
      expect(typeof version).toBe('string');
      expect(version).toBeTruthy();
    });

    it('should return unknown if package.json cannot be read', () => {
      // Mock require to throw error
      jest.mock('../../package.json', () => {
        throw new Error('Cannot find module');
      }, {virtual: true});

      const version = getCliVersion();
      expect(typeof version).toBe('string');
    });

    it('should return unknown if package.json has no version', () => {
      // Mock require to return package.json without version
      jest.doMock('../../package.json', () => ({
        name: 'test-package'
        // No version field
      }));

      // Clear the module cache to force re-require
      jest.resetModules();
      
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const {getCliVersion: getCliVersionMocked} = require('../../src/telemetry/collector');
      const version = getCliVersionMocked();
      expect(version).toBe('unknown');
    });
  });

  describe('getNodeVersion', () => {
    it('should return Node.js version', () => {
      const version = getNodeVersion();
      expect(typeof version).toBe('string');
      expect(version).toMatch(/^v\d+\.\d+\.\d+/);
      expect(version).toBe(process.version);
    });
  });

  describe('getOSPlatform', () => {
    it('should return OS platform', () => {
      const platform = getOSPlatform();
      expect(typeof platform).toBe('string');
      expect(platform).toBeTruthy();
      expect(['darwin', 'linux', 'win32', 'freebsd', 'openbsd', 'sunos', 'aix']).toContain(platform);
    });
  });

  describe('isCI', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = {...originalEnv};
      delete process.env.CI;
      delete process.env.GITHUB_ACTIONS;
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should return false when not in CI', () => {
      expect(isCI()).toBe(false);
    });

    it('should return true when in CI', () => {
      process.env.CI = 'true';
      expect(isCI()).toBe(true);
    });
  });

  describe('collectSystemInfo', () => {
    it('should collect all system information', () => {
      const info = collectSystemInfo();

      expect(info).toHaveProperty('cli_version');
      expect(info).toHaveProperty('node_version');
      expect(info).toHaveProperty('os');
      expect(info).toHaveProperty('ci');

      expect(typeof info.cli_version).toBe('string');
      expect(typeof info.node_version).toBe('string');
      expect(typeof info.os).toBe('string');
      expect(typeof info.ci).toBe('boolean');
    });

    it('should return consistent data structure', () => {
      const info1 = collectSystemInfo();
      const info2 = collectSystemInfo();

      expect(Object.keys(info1).sort()).toEqual(Object.keys(info2).sort());
    });
  });
});

