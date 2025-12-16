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
    it('should return disabled config when DO_NOT_TRACK is set', async () => {
      process.env.DO_NOT_TRACK = '1';
      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123',
          apiSecret: ''
        },
        hasShownTelemetryNotice: true
      };

      mockGetGlobalConfig.mockResolvedValue(mockConfig);

      const config = await getTelemetryConfig();

      expect(config.enabled).toBe(false);
    });

    it('should return config from global config file', async () => {
      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123',
          apiSecret: ''
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
          trackingId: 'G-TEST123',
          apiSecret: ''
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

    it('should handle partial project config overrides', async () => {
      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123',
          apiSecret: ''
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

    it('should apply CODEGEN_TELEMETRY_ENDPOINT environment variable override', async () => {
      process.env.CODEGEN_TELEMETRY_ENDPOINT = 'https://custom-endpoint.com';
      
      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123',
          apiSecret: ''
        },
        hasShownTelemetryNotice: true
      };

      mockGetGlobalConfig.mockResolvedValue(mockConfig);

      const config = await getTelemetryConfig();

      expect(config.endpoint).toBe('https://custom-endpoint.com');
      expect(config.enabled).toBe(true); // Should not affect other properties
      expect(config.trackingId).toBe('G-TEST123');
    });

    it('should apply CODEGEN_TELEMETRY_ID environment variable override', async () => {
      process.env.CODEGEN_TELEMETRY_ID = 'G-CUSTOM123';
      
      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123',
          apiSecret: ''
        },
        hasShownTelemetryNotice: true
      };

      mockGetGlobalConfig.mockResolvedValue(mockConfig);

      const config = await getTelemetryConfig();

      expect(config.trackingId).toBe('G-CUSTOM123');
      expect(config.enabled).toBe(true); // Should not affect other properties
      expect(config.endpoint).toBe('https://example.com');
    });

    it('should apply CODEGEN_TELEMETRY_API_SECRET environment variable override', async () => {
      process.env.CODEGEN_TELEMETRY_API_SECRET = 'custom-secret-123';
      
      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123',
          apiSecret: 'original-secret'
        },
        hasShownTelemetryNotice: true
      };

      mockGetGlobalConfig.mockResolvedValue(mockConfig);

      const config = await getTelemetryConfig();

      expect(config.apiSecret).toBe('custom-secret-123');
      expect(config.enabled).toBe(true); // Should not affect other properties
      expect(config.endpoint).toBe('https://example.com');
    });

    it('should apply multiple environment variable overrides together', async () => {
      process.env.CODEGEN_TELEMETRY_ENDPOINT = 'https://org-analytics.com';
      process.env.CODEGEN_TELEMETRY_ID = 'G-ORG123';
      process.env.CODEGEN_TELEMETRY_API_SECRET = 'org-secret';
      
      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123',
          apiSecret: 'original-secret'
        },
        hasShownTelemetryNotice: true
      };

      mockGetGlobalConfig.mockResolvedValue(mockConfig);

      const config = await getTelemetryConfig();

      expect(config.endpoint).toBe('https://org-analytics.com');
      expect(config.trackingId).toBe('G-ORG123');
      expect(config.apiSecret).toBe('org-secret');
      expect(config.enabled).toBe(true);
      expect(config.anonymousId).toBe('test-uuid'); // Should keep from global
    });

    it('should prioritize environment variables over project config', async () => {
      process.env.CODEGEN_TELEMETRY_ENDPOINT = 'https://env-endpoint.com';
      
      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://global-endpoint.com',
          trackingId: 'G-TEST123',
          apiSecret: ''
        },
        hasShownTelemetryNotice: true
      };

      mockGetGlobalConfig.mockResolvedValue(mockConfig);

      const projectConfig = {
        endpoint: 'https://project-endpoint.com'
      };

      const config = await getTelemetryConfig(projectConfig);

      // Environment variable should override both project and global config
      expect(config.endpoint).toBe('https://env-endpoint.com');
    });

    it('should disable telemetry via environment variable even if project config enables it', async () => {
      process.env.CODEGEN_TELEMETRY_DISABLED = '1';
      
      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: false,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123',
          apiSecret: ''
        },
        hasShownTelemetryNotice: true
      };

      mockGetGlobalConfig.mockResolvedValue(mockConfig);

      const projectConfig = {
        enabled: true // Try to enable in project config
      };

      const config = await getTelemetryConfig(projectConfig);

      // Environment variable should have highest priority
      expect(config.enabled).toBe(false);
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
          trackingId: 'G-TEST123',
          apiSecret: ''
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
          trackingId: 'G-TEST123',
          apiSecret: ''
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
          trackingId: 'G-TEST123',
          apiSecret: ''
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

