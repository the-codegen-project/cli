import {showTelemetryNoticeIfNeeded} from '../../src/telemetry/notice';
import {getGlobalConfig, updateGlobalConfig} from '../../src/PersistedConfig';
import {Logger} from '../../src/LoggingInterface';

// Mock dependencies
jest.mock('../../src/PersistedConfig');
jest.mock('../../src/LoggingInterface');

describe('Telemetry Notice', () => {
  const mockGetGlobalConfig = getGlobalConfig as jest.MockedFunction<typeof getGlobalConfig>;
  const mockUpdateGlobalConfig = updateGlobalConfig as jest.MockedFunction<typeof updateGlobalConfig>;
  const mockLoggerInfo = Logger.info as jest.MockedFunction<typeof Logger.info>;

  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {...originalEnv};
    delete process.env.CI;
    delete process.env.CODEGEN_TELEMETRY_DEBUG;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('showTelemetryNoticeIfNeeded', () => {
    it('should show notice on first run', async () => {
      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123'
        },
        hasShownTelemetryNotice: false
      };

      mockGetGlobalConfig.mockResolvedValue(mockConfig);
      mockUpdateGlobalConfig.mockResolvedValue();

      await showTelemetryNoticeIfNeeded();

      expect(mockLoggerInfo).toHaveBeenCalled();
      expect(mockUpdateGlobalConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          hasShownTelemetryNotice: true
        })
      );
    });

    it('should not show notice if already shown', async () => {
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

      await showTelemetryNoticeIfNeeded();

      expect(mockLoggerInfo).not.toHaveBeenCalled();
      expect(mockUpdateGlobalConfig).not.toHaveBeenCalled();
    });

    it('should not show notice if telemetry is disabled', async () => {
      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: false,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123'
        },
        hasShownTelemetryNotice: false
      };

      mockGetGlobalConfig.mockResolvedValue(mockConfig);

      await showTelemetryNoticeIfNeeded();

      expect(mockLoggerInfo).not.toHaveBeenCalled();
      expect(mockUpdateGlobalConfig).not.toHaveBeenCalled();
    });

    it('should not show notice in CI environment', async () => {
      process.env.CI = 'true';

      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123'
        },
        hasShownTelemetryNotice: false
      };

      mockGetGlobalConfig.mockResolvedValue(mockConfig);

      await showTelemetryNoticeIfNeeded();

      expect(mockLoggerInfo).not.toHaveBeenCalled();
      expect(mockUpdateGlobalConfig).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockGetGlobalConfig.mockRejectedValue(new Error('Config error'));

      // Should not throw
      await expect(showTelemetryNoticeIfNeeded()).resolves.toBeUndefined();
    });

    it('should handle update errors gracefully', async () => {
      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123'
        },
        hasShownTelemetryNotice: false
      };

      mockGetGlobalConfig.mockResolvedValue(mockConfig);
      mockUpdateGlobalConfig.mockRejectedValue(new Error('Update error'));

      // Should not throw
      await expect(showTelemetryNoticeIfNeeded()).resolves.toBeUndefined();
    });

    it('should include correct information in notice', async () => {
      const mockConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123'
        },
        hasShownTelemetryNotice: false
      };

      mockGetGlobalConfig.mockResolvedValue(mockConfig);
      mockUpdateGlobalConfig.mockResolvedValue();

      await showTelemetryNoticeIfNeeded();

      const noticeCall = mockLoggerInfo.mock.calls[0][0];
      expect(noticeCall).toContain('anonymous usage data');
      expect(noticeCall).toContain('codegen telemetry disable');
      expect(noticeCall).toContain('the-codegen-project.org/docs/telemetry');
    });

    it('should log error in debug mode on failure', async () => {
      process.env.CODEGEN_TELEMETRY_DEBUG = '1';
      mockGetGlobalConfig.mockRejectedValue(new Error('Config error'));

      await expect(showTelemetryNoticeIfNeeded()).resolves.toBeUndefined();
      // Debug logging should happen but doesn't throw
    });
  });
});

