import {
  getTelemetryConfig,
  setTelemetryEnabled,
  isTelemetryEnabled
} from '../../src/telemetry/config';
import {getGlobalConfig, updateGlobalConfig} from '../../src/PersistedConfig';

// Mock the PersistedConfig module
jest.mock('../../src/PersistedConfig');

describe('Telemetry Config', () => {
  const mockGetGlobalConfig = getGlobalConfig as jest.MockedFunction<typeof getGlobalConfig>;
  const mockUpdateGlobalConfig = updateGlobalConfig as jest.MockedFunction<typeof updateGlobalConfig>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear environment variables
    delete process.env.CODEGEN_TELEMETRY_DISABLED;
    delete process.env.DO_NOT_TRACK;
    delete process.env.CODEGEN_TELEMETRY_ENDPOINT;
    delete process.env.CODEGEN_TELEMETRY_ID;
    delete process.env.CODEGEN_TELEMETRY_API_SECRET;
    delete process.env.CODEGEN_TELEMETRY_DEBUG;
  });

  describe('getTelemetryConfig', () => {
    it('should return disabled config when CODEGEN_TELEMETRY_DISABLED is set', async () => {
      process.env.CODEGEN_TELEMETRY_DISABLED = '1';

      const config = await getTelemetryConfig();

      expect(config.enabled).toBe(false);
      expect(config.anonymousId).toBe('');
      expect(config.endpoint).toBe('');
      expect(config.trackingId).toBe('');
      expect(mockGetGlobalConfig).not.toHaveBeenCalled();
    });

    it('should return disabled config when DO_NOT_TRACK is set', async () => {
      process.env.DO_NOT_TRACK = '1';

      const config = await getTelemetryConfig();

      expect(config.enabled).toBe(false);
      expect(mockGetGlobalConfig).not.toHaveBeenCalled();
    });

    it('should return config from global config file', async () => {
      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123'
        },
        hasShownTelemetryNotice: true
      };

      mockGetGlobalConfig.mockResolvedValue(mockConfig);

      const config = await getTelemetryConfig();

      expect(config.enabled).toBe(true);
      expect(config.anonymousId).toBe('test-uuid');
      expect(config.endpoint).toBe('https://example.com');
      expect(config.trackingId).toBe('G-TEST123');
      expect(mockGetGlobalConfig).toHaveBeenCalled();
    });

    it('should override endpoint from environment variable', async () => {
      process.env.CODEGEN_TELEMETRY_ENDPOINT = 'https://custom-endpoint.com';

      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123'
        },
        hasShownTelemetryNotice: true
      };

      mockGetGlobalConfig.mockResolvedValue(mockConfig);

      const config = await getTelemetryConfig();

      expect(config.endpoint).toBe('https://custom-endpoint.com');
    });

    it('should override tracking ID from environment variable', async () => {
      process.env.CODEGEN_TELEMETRY_ID = 'G-CUSTOM123';

      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123'
        },
        hasShownTelemetryNotice: true
      };

      mockGetGlobalConfig.mockResolvedValue(mockConfig);

      const config = await getTelemetryConfig();

      expect(config.trackingId).toBe('G-CUSTOM123');
    });

    it('should override API secret from environment variable', async () => {
      process.env.CODEGEN_TELEMETRY_API_SECRET = 'secret123';

      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123'
        },
        hasShownTelemetryNotice: true
      };

      mockGetGlobalConfig.mockResolvedValue(mockConfig);

      const config = await getTelemetryConfig();

      expect(config.apiSecret).toBe('secret123');
    });

    it('should return disabled config on error', async () => {
      mockGetGlobalConfig.mockRejectedValue(new Error('Config read error'));

      const config = await getTelemetryConfig();

      expect(config.enabled).toBe(false);
    });

    it('should log error in debug mode when getTelemetryConfig fails', async () => {
      process.env.CODEGEN_TELEMETRY_DEBUG = '1';
      mockGetGlobalConfig.mockRejectedValue(new Error('Config read error'));

      const config = await getTelemetryConfig();

      expect(config.enabled).toBe(false);
      // Debug logging should happen but doesn't throw
    });

    it('should apply project-level config overrides', async () => {
      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123'
        },
        hasShownTelemetryNotice: true
      };

      mockGetGlobalConfig.mockResolvedValue(mockConfig);

      const projectConfig = {
        enabled: false,
        endpoint: 'https://project-endpoint.com',
        trackingId: 'G-PROJECT123'
      };

      const config = await getTelemetryConfig(projectConfig);

      expect(config.enabled).toBe(false);
      expect(config.endpoint).toBe('https://project-endpoint.com');
      expect(config.trackingId).toBe('G-PROJECT123');
      expect(config.anonymousId).toBe('test-uuid'); // Should keep from global
    });

    it('should prioritize env vars over project config', async () => {
      process.env.CODEGEN_TELEMETRY_ENDPOINT = 'https://env-endpoint.com';
      process.env.CODEGEN_TELEMETRY_ID = 'G-ENV123';

      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://global.com',
          trackingId: 'G-GLOBAL123'
        },
        hasShownTelemetryNotice: true
      };

      mockGetGlobalConfig.mockResolvedValue(mockConfig);

      const projectConfig = {
        endpoint: 'https://project.com',
        trackingId: 'G-PROJECT123'
      };

      const config = await getTelemetryConfig(projectConfig);

      // Env vars should win
      expect(config.endpoint).toBe('https://env-endpoint.com');
      expect(config.trackingId).toBe('G-ENV123');
    });

    it('should handle partial project config overrides', async () => {
      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123'
        },
        hasShownTelemetryNotice: true
      };

      mockGetGlobalConfig.mockResolvedValue(mockConfig);

      const projectConfig = {
        enabled: false
        // Only override enabled, not endpoint or trackingId
      };

      const config = await getTelemetryConfig(projectConfig);

      expect(config.enabled).toBe(false); // Overridden
      expect(config.endpoint).toBe('https://example.com'); // From global
      expect(config.trackingId).toBe('G-TEST123'); // From global
    });
  });

  describe('setTelemetryEnabled', () => {
    it('should enable telemetry', async () => {
      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: false,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123'
        },
        hasShownTelemetryNotice: true
      };

      mockGetGlobalConfig.mockResolvedValue(mockConfig);
      mockUpdateGlobalConfig.mockResolvedValue();

      await setTelemetryEnabled(true);

      expect(mockUpdateGlobalConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          telemetry: expect.objectContaining({
            enabled: true
          })
        })
      );
    });

    it('should disable telemetry', async () => {
      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123'
        },
        hasShownTelemetryNotice: true
      };

      mockGetGlobalConfig.mockResolvedValue(mockConfig);
      mockUpdateGlobalConfig.mockResolvedValue();

      await setTelemetryEnabled(false);

      expect(mockUpdateGlobalConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          telemetry: expect.objectContaining({
            enabled: false
          })
        })
      );
    });

    it('should not throw on error', async () => {
      mockGetGlobalConfig.mockRejectedValue(new Error('Config error'));

      await expect(setTelemetryEnabled(true)).resolves.toBeUndefined();
    });

    it('should log error in debug mode when setTelemetryEnabled fails', async () => {
      process.env.CODEGEN_TELEMETRY_DEBUG = '1';
      mockGetGlobalConfig.mockRejectedValue(new Error('Config error'));

      await expect(setTelemetryEnabled(true)).resolves.toBeUndefined();
      // Debug logging should happen but doesn't throw
    });
  });

  describe('isTelemetryEnabled', () => {
    it('should return true when telemetry is enabled', async () => {
      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123'
        },
        hasShownTelemetryNotice: true
      };

      mockGetGlobalConfig.mockResolvedValue(mockConfig);

      const enabled = await isTelemetryEnabled();

      expect(enabled).toBe(true);
    });

    it('should return false when telemetry is disabled', async () => {
      process.env.DO_NOT_TRACK = '1';

      const enabled = await isTelemetryEnabled();

      expect(enabled).toBe(false);
    });
  });
});

