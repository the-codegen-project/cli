import {sendEvent} from '../../src/telemetry/sender';
import {getTelemetryConfig} from '../../src/telemetry/config';
import https from 'https';

// Mock dependencies
jest.mock('../../src/telemetry/config');
jest.mock('https');

describe('Telemetry Sender', () => {
  const mockGetTelemetryConfig = getTelemetryConfig as jest.MockedFunction<typeof getTelemetryConfig>;
  const mockHttpsRequest = https.request as jest.MockedFunction<typeof https.request>;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.CODEGEN_TELEMETRY_DEBUG;
  });

  describe('sendEvent - Configuration Checks', () => {
    it('should not send when telemetry is disabled', async () => {
      mockGetTelemetryConfig.mockResolvedValue({
        enabled: false,
        anonymousId: '',
        endpoint: '',
        trackingId: ''
      });

      await sendEvent({event: 'test_event'}, undefined);

      expect(mockHttpsRequest).not.toHaveBeenCalled();
    });

    it('should not send when required config is missing', async () => {
      mockGetTelemetryConfig.mockResolvedValue({
        enabled: true,
        anonymousId: '',
        endpoint: '',
        trackingId: ''
      });

      await sendEvent({event: 'test_event'}, undefined);

      expect(mockHttpsRequest).not.toHaveBeenCalled();
    });

    it('should log in debug mode when required config is missing', async () => {
      process.env.CODEGEN_TELEMETRY_DEBUG = '1';
      
      mockGetTelemetryConfig.mockResolvedValue({
        enabled: true,
        anonymousId: '', // Missing
        endpoint: '', // Missing
        trackingId: '' // Missing
      });

      await sendEvent({event: 'test_event'}, undefined);

      expect(mockHttpsRequest).not.toHaveBeenCalled();
    });

    it('should not send in debug mode', async () => {
      process.env.CODEGEN_TELEMETRY_DEBUG = '1';

      mockGetTelemetryConfig.mockResolvedValue({
        enabled: true,
        anonymousId: 'test-uuid',
        endpoint: 'https://example.com/collect',
        trackingId: 'G-TEST123'
      });

      await sendEvent({event: 'test_event'}, undefined);

      expect(mockHttpsRequest).not.toHaveBeenCalled();
    });

    it('should never throw on config errors', async () => {
      mockGetTelemetryConfig.mockRejectedValue(new Error('Config error'));

      // Should not throw
      await expect(sendEvent({event: 'test_event'}, undefined)).resolves.toBeUndefined();
    });

    it('should log error in debug mode on unexpected error', async () => {
      process.env.CODEGEN_TELEMETRY_DEBUG = '1';
      mockGetTelemetryConfig.mockRejectedValue(new Error('Unexpected config error'));

      await expect(sendEvent({event: 'test_event'}, undefined)).resolves.toBeUndefined();
      // Debug logging should happen but doesn't throw
    });
  });

  describe('sendEvent - Successful Sending', () => {
    it('should send event with valid config', async () => {
      mockGetTelemetryConfig.mockResolvedValue({
        enabled: true,
        anonymousId: 'test-uuid',
        endpoint: 'https://example.com/collect',
        trackingId: 'G-TEST123',
        apiSecret: 'secret123'
      });

      const mockReq = {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn()
      };

      mockHttpsRequest.mockImplementation((url, options, callback) => {
        if (callback) {callback({} as any);}
        return mockReq as any;
      });

      await sendEvent({
        event: 'command_executed',
        command: 'generate',
        success: true
      });

      expect(mockHttpsRequest).toHaveBeenCalled();
      expect(mockReq.write).toHaveBeenCalled();
      expect(mockReq.end).toHaveBeenCalled();
    });

    it('should format payload correctly for GA4', async () => {
      mockGetTelemetryConfig.mockResolvedValue({
        enabled: true,
        anonymousId: 'test-uuid-123',
        endpoint: 'https://example.com/collect',
        trackingId: 'G-TEST123'
      });

      let capturedPayload: any;
      const mockReq = {
        on: jest.fn(),
        write: jest.fn((data) => {
          capturedPayload = JSON.parse(data);
        }),
        end: jest.fn()
      };

      mockHttpsRequest.mockImplementation((url, options, callback) => {
        if (callback) {callback({} as any);}
        return mockReq as any;
      });

      await sendEvent({
        event: 'command_executed',
        command: 'generate',
        success: true
      });

      expect(capturedPayload).toMatchObject({
        client_id: 'test-uuid-123',
        events: [
          {
            name: 'command_executed',
            params: expect.objectContaining({
              event: 'command_executed',
              command: 'generate',
              success: true,
              engagement_time_msec: '100'
            })
          }
        ]
      });
    });
  });

  describe('sendEvent - Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockGetTelemetryConfig.mockResolvedValue({
        enabled: true,
        anonymousId: 'test-uuid',
        endpoint: 'https://example.com/collect',
        trackingId: 'G-TEST123'
      });

      const mockReq = {
        on: jest.fn((event, handler) => {
          if (event === 'error') {
            handler(new Error('Network error'));
          }
        }),
        write: jest.fn(),
        end: jest.fn()
      };

      mockHttpsRequest.mockReturnValue(mockReq as any);

      // Should not throw
      await expect(sendEvent({event: 'test_event'}, undefined)).resolves.toBeUndefined();
    });

    it('should handle timeout gracefully', async () => {
      mockGetTelemetryConfig.mockResolvedValue({
        enabled: true,
        anonymousId: 'test-uuid',
        endpoint: 'https://example.com/collect',
        trackingId: 'G-TEST123'
      });

      const mockReq = {
        on: jest.fn((event, handler) => {
          if (event === 'timeout') {
            handler();
          }
        }),
        destroy: jest.fn(),
        write: jest.fn(),
        end: jest.fn()
      };

      mockHttpsRequest.mockReturnValue(mockReq as any);

      // Should not throw
      await expect(sendEvent({event: 'test_event'}, undefined)).resolves.toBeUndefined();
    });
  });

  describe('sendEvent - Debug Mode', () => {
    it('should log error in debug mode on network error', async () => {
      process.env.CODEGEN_TELEMETRY_DEBUG = '1';
      
      mockGetTelemetryConfig.mockResolvedValue({
        enabled: true,
        anonymousId: 'test-uuid',
        endpoint: 'https://example.com/collect',
        trackingId: 'G-TEST123'
      });

      const mockReq = {
        on: jest.fn((event, handler) => {
          if (event === 'error') {
            handler(new Error('Network error'));
          }
        }),
        write: jest.fn(),
        end: jest.fn()
      };

      mockHttpsRequest.mockReturnValue(mockReq as any);

      await expect(sendEvent({event: 'test_event'}, undefined)).resolves.toBeUndefined();
      // Debug logging should happen but doesn't throw
    });

    it('should log info in debug mode on timeout', async () => {
      process.env.CODEGEN_TELEMETRY_DEBUG = '1';
      
      mockGetTelemetryConfig.mockResolvedValue({
        enabled: true,
        anonymousId: 'test-uuid',
        endpoint: 'https://example.com/collect',
        trackingId: 'G-TEST123'
      });

      const mockReq = {
        on: jest.fn((event, handler) => {
          if (event === 'timeout') {
            handler();
          }
        }),
        destroy: jest.fn(),
        write: jest.fn(),
        end: jest.fn()
      };

      mockHttpsRequest.mockReturnValue(mockReq as any);

      await expect(sendEvent({event: 'test_event'}, undefined)).resolves.toBeUndefined();
      // Debug logging should happen but doesn't throw
    });

    it('should log error in debug mode on request error', async () => {
      process.env.CODEGEN_TELEMETRY_DEBUG = '1';
      
      mockGetTelemetryConfig.mockResolvedValue({
        enabled: true,
        anonymousId: 'test-uuid',
        endpoint: 'https://example.com/collect',
        trackingId: 'G-TEST123'
      });

      // Mock https.request to throw during construction
      mockHttpsRequest.mockImplementation(() => {
        throw new Error('Request construction error');
      });

      await expect(sendEvent({event: 'test_event'}, undefined)).resolves.toBeUndefined();
      // Debug logging should happen but doesn't throw
    });
  });

  describe('sendEvent - Project Config', () => {
    it('should pass project config to getTelemetryConfig', async () => {
      const projectConfig = {
        enabled: false,
        endpoint: 'https://project.com',
        trackingId: 'G-PROJECT123'
      };

      mockGetTelemetryConfig.mockResolvedValue({
        enabled: false,
        anonymousId: 'test-uuid',
        endpoint: 'https://project.com',
        trackingId: 'G-PROJECT123'
      });

      await sendEvent({event: 'test_event'}, projectConfig);

      expect(mockGetTelemetryConfig).toHaveBeenCalledWith(projectConfig);
    });

    it('should use project config to disable telemetry', async () => {
      const projectConfig = {
        enabled: false
      };

      mockGetTelemetryConfig.mockResolvedValue({
        enabled: false,
        anonymousId: 'test-uuid',
        endpoint: 'https://example.com',
        trackingId: 'G-TEST123'
      });

      await sendEvent({event: 'test_event'}, projectConfig);

      expect(mockHttpsRequest).not.toHaveBeenCalled();
    });
  });
});

