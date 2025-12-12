import {
  getGlobalConfig,
  updateGlobalConfig,
  configFileExists,
  getConfigFilePath,
  getConfigDirectoryPath,
  GlobalConfig
} from '../src/PersistedConfig';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Mock fs module
jest.mock('fs/promises');

describe('PersistedConfig', () => {
  const mockReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;
  const mockWriteFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>;
  const mockMkdir = fs.mkdir as jest.MockedFunction<typeof fs.mkdir>;
  const mockAccess = fs.access as jest.MockedFunction<typeof fs.access>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGlobalConfig', () => {
    it('should return config from file if it exists', async () => {
      const mockConfig: GlobalConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123'
        },
        hasShownTelemetryNotice: true,
        lastUpdated: '2024-12-11T10:00:00Z'
      };

      mockReadFile.mockResolvedValue(JSON.stringify(mockConfig));

      const config = await getGlobalConfig();

      expect(config).toEqual(mockConfig);
      expect(mockReadFile).toHaveBeenCalled();
    });

    it('should create default config if file does not exist', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();

      const config = await getGlobalConfig();

      expect(config.version).toBe('1.0.0');
      expect(config.telemetry.enabled).toBe(true);
      expect(config.telemetry.anonymousId).toBeTruthy();
      expect(config.hasShownTelemetryNotice).toBe(false);
      expect(mockWriteFile).toHaveBeenCalled();
    });

    it('should create default config if file is corrupted', async () => {
      mockReadFile.mockResolvedValue('invalid json{');
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();

      const config = await getGlobalConfig();

      expect(config.version).toBe('1.0.0');
      expect(config.telemetry.enabled).toBe(true);
    });

    it('should create default config with correct tracking values', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();

      const config = await getGlobalConfig();

      // Verify version
      expect(config.version).toBe('1.0.0');
      
      // Verify telemetry defaults
      expect(config.telemetry.enabled).toBe(true);
      expect(config.telemetry.endpoint).toBe('https://www.google-analytics.com/mp/collect');
      expect(config.telemetry.trackingId).toBe('G-45KZ589PCT');
      expect(config.telemetry.apiSecret).toBe('emUAvwyZRDqCKYbmvWUM9g');
      expect(config.telemetry.anonymousId).toBeTruthy();
      expect(config.telemetry.anonymousId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i); // UUID v4 format
      
      // Verify other defaults
      expect(config.hasShownTelemetryNotice).toBe(false);
      expect(config.lastUpdated).toBeTruthy();
      expect(new Date(config.lastUpdated!).toString()).not.toBe('Invalid Date');
    });
  });

  describe('updateGlobalConfig', () => {
    it('should write config to file', async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();

      const config: GlobalConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123'
        },
        hasShownTelemetryNotice: true
      };

      await updateGlobalConfig(config);

      expect(mockMkdir).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalled();
    });

    it('should update lastUpdated timestamp', async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();

      const config: GlobalConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123'
        },
        hasShownTelemetryNotice: true
      };

      await updateGlobalConfig(config);

      expect(config.lastUpdated).toBeTruthy();
      expect(new Date(config.lastUpdated!).toString()).not.toBe('Invalid Date');
    });

    it('should not throw on write errors', async () => {
      mockMkdir.mockRejectedValue(new Error('Permission denied'));

      const config: GlobalConfig = {
        version: '1.0.0',
        telemetry: {
          enabled: true,
          anonymousId: 'test-uuid',
          endpoint: 'https://example.com',
          trackingId: 'G-TEST123'
        },
        hasShownTelemetryNotice: true
      };

      await expect(updateGlobalConfig(config)).resolves.toBeUndefined();
    });
  });

  describe('configFileExists', () => {
    it('should return true if file exists', async () => {
      mockAccess.mockResolvedValue();

      const exists = await configFileExists();

      expect(exists).toBe(true);
      expect(mockAccess).toHaveBeenCalled();
    });

    it('should return false if file does not exist', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const exists = await configFileExists();

      expect(exists).toBe(false);
    });
  });

  describe('getConfigFilePath', () => {
    it('should return correct config file path', () => {
      const filePath = getConfigFilePath();
      const expectedPath = path.join(os.homedir(), '.the-codegen-project', 'config.json');

      expect(filePath).toBe(expectedPath);
    });
  });

  describe('getConfigDirectoryPath', () => {
    it('should return correct config directory path', () => {
      const dirPath = getConfigDirectoryPath();
      const expectedPath = path.join(os.homedir(), '.the-codegen-project');

      expect(dirPath).toBe(expectedPath);
    });
  });
});

