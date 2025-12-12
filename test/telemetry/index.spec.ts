import {trackEvent} from '../../src/telemetry';
import {sendEvent} from '../../src/telemetry/sender';
import {showTelemetryNoticeIfNeeded} from '../../src/telemetry/notice';
import {collectSystemInfo} from '../../src/telemetry/collector';

// Mock dependencies
jest.mock('../../src/telemetry/sender');
jest.mock('../../src/telemetry/notice');
jest.mock('../../src/telemetry/collector');

describe('Telemetry Index', () => {
  const mockSendEvent = sendEvent as jest.MockedFunction<typeof sendEvent>;
  const mockShowNotice = showTelemetryNoticeIfNeeded as jest.MockedFunction<typeof showTelemetryNoticeIfNeeded>;
  const mockCollectSystemInfo = collectSystemInfo as jest.MockedFunction<typeof collectSystemInfo>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCollectSystemInfo.mockReturnValue({
      cli_version: '1.0.0',
      node_version: 'v18.0.0',
      os: 'darwin',
      ci: false
    });

    mockShowNotice.mockResolvedValue();
    mockSendEvent.mockResolvedValue();
  });

  describe('trackEvent', () => {
    it('should show notice on first run', async () => {
      await trackEvent({event: 'test_event'});

      expect(mockShowNotice).toHaveBeenCalled();
    });

    it('should enrich event with system info', async () => {
      await trackEvent({
        event: 'command_executed',
        command: 'generate',
        success: true
      });

      expect(mockSendEvent).toHaveBeenCalledWith(
        {
          event: 'command_executed',
          command: 'generate',
          success: true,
          cli_version: '1.0.0',
          node_version: 'v18.0.0',
          os: 'darwin',
          ci: false
        },
        undefined // No project config provided
      );
    });

    it('should call sendEvent', async () => {
      await trackEvent({event: 'test_event'});

      expect(mockSendEvent).toHaveBeenCalled();
    });

    it('should never throw even if notice fails', async () => {
      mockShowNotice.mockRejectedValue(new Error('Notice error'));

      await expect(trackEvent({event: 'test_event'})).resolves.toBeUndefined();
    });

    it('should never throw even if sendEvent fails', async () => {
      mockSendEvent.mockRejectedValue(new Error('Send error'));

      await expect(trackEvent({event: 'test_event'})).resolves.toBeUndefined();
    });

    it('should never throw even if collectSystemInfo fails', async () => {
      mockCollectSystemInfo.mockImplementation(() => {
        throw new Error('Collection error');
      });

      await expect(trackEvent({event: 'test_event'})).resolves.toBeUndefined();
    });

    it('should handle multiple simultaneous calls', async () => {
      const promises = [
        trackEvent({event: 'event1'}),
        trackEvent({event: 'event2'}),
        trackEvent({event: 'event3'})
      ];

      await expect(Promise.all(promises)).resolves.toBeDefined();
      expect(mockSendEvent).toHaveBeenCalledTimes(3);
    });

    it('should work with complex event data', async () => {
      const complexEvent = {
        event: 'generator_used',
        generator_type: 'payloads',
        input_type: 'asyncapi',
        language: 'typescript',
        options: {
          includeValidation: true,
          serializationType: 'json'
        },
        duration: 1234,
        success: true
      };

      await trackEvent(complexEvent);

      expect(mockSendEvent).toHaveBeenCalledWith(
        expect.objectContaining(complexEvent),
        undefined
      );
    });

    it('should pass project config to sendEvent', async () => {
      const projectConfig = {
        enabled: false,
        endpoint: 'https://project.com',
        trackingId: 'G-PROJECT123'
      };

      await trackEvent({event: 'test_event'}, projectConfig);

      expect(mockSendEvent).toHaveBeenCalledWith(
        expect.objectContaining({event: 'test_event'}),
        projectConfig
      );
    });

    it('should enrich event and pass project config', async () => {
      const projectConfig = {
        enabled: true,
        endpoint: 'https://company.com'
      };

      await trackEvent(
        {
          event: 'command_executed',
          command: 'generate'
        },
        projectConfig
      );

      expect(mockSendEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'command_executed',
          command: 'generate',
          cli_version: '1.0.0',
          node_version: 'v18.0.0',
          os: 'darwin',
          ci: false
        }),
        projectConfig
      );
    });

    it('should handle undefined project config', async () => {
      await trackEvent({event: 'test_event'}, undefined);

      expect(mockSendEvent).toHaveBeenCalledWith(
        expect.any(Object),
        undefined
      );
    });

    it('should log error in debug mode on unexpected error', async () => {
      process.env.CODEGEN_TELEMETRY_DEBUG = '1';
      
      // Force an error by making collectSystemInfo throw
      mockCollectSystemInfo.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await expect(trackEvent({event: 'test_event'})).resolves.toBeUndefined();
      // Debug logging should happen but doesn't throw
    });
  });
});

