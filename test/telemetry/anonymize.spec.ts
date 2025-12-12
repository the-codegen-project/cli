import {
  getInputSourceType,
  isCIEnvironment,
  categorizeError
} from '../../src/telemetry/anonymize';

describe('Telemetry Anonymize', () => {
  describe('getInputSourceType', () => {
    it('should detect remote URL with http://', () => {
      const result = getInputSourceType('http://example.com/schema.yaml');
      expect(result).toBe('remote_url');
    });

    it('should detect remote URL with https://', () => {
      const result = getInputSourceType('https://example.com/schema.yaml');
      expect(result).toBe('remote_url');
    });

    it('should detect absolute path on Unix', () => {
      const result = getInputSourceType('/Users/test/project/schema.yaml');
      expect(result).toBe('local_absolute');
    });

    it('should detect absolute path on Windows', () => {
      // Note: path.isAbsolute() is platform-specific
      // On Windows: C:\path is absolute
      // On Unix: C:\path is relative (treated as filename with backslashes)
      const result = getInputSourceType('C:\\Users\\test\\project\\schema.yaml');
      
      // On Windows, this would be 'local_absolute'
      // On Unix-like systems (macOS/Linux), this is treated as a relative path
      const expected = process.platform === 'win32' ? 'local_absolute' : 'local_relative';
      expect(result).toBe(expected);
    });

    it('should detect relative path', () => {
      const result = getInputSourceType('./schema.yaml');
      expect(result).toBe('local_relative');
    });

    it('should detect relative path without dot prefix', () => {
      const result = getInputSourceType('schema.yaml');
      expect(result).toBe('local_relative');
    });

    it('should detect relative path with subdirectories', () => {
      const result = getInputSourceType('docs/schemas/schema.yaml');
      expect(result).toBe('local_relative');
    });
  });

  describe('isCIEnvironment', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = {...originalEnv};
      // Clear all CI-related environment variables
      delete process.env.CI;
      delete process.env.GITHUB_ACTIONS;
      delete process.env.GITLAB_CI;
      delete process.env.CIRCLECI;
      delete process.env.TRAVIS;
      delete process.env.JENKINS_URL;
      delete process.env.BITBUCKET_PIPELINE_UUID;
      delete process.env.CODEBUILD_BUILD_ID;
      delete process.env.TEAMCITY_VERSION;
      delete process.env.BUILDKITE;
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should return false when no CI variables are set', () => {
      expect(isCIEnvironment()).toBe(false);
    });

    it('should detect generic CI environment', () => {
      process.env.CI = 'true';
      expect(isCIEnvironment()).toBe(true);
    });

    it('should detect GitHub Actions', () => {
      process.env.GITHUB_ACTIONS = 'true';
      expect(isCIEnvironment()).toBe(true);
    });

    it('should detect GitLab CI', () => {
      process.env.GITLAB_CI = 'true';
      expect(isCIEnvironment()).toBe(true);
    });

    it('should detect CircleCI', () => {
      process.env.CIRCLECI = 'true';
      expect(isCIEnvironment()).toBe(true);
    });

    it('should detect Travis CI', () => {
      process.env.TRAVIS = 'true';
      expect(isCIEnvironment()).toBe(true);
    });

    it('should detect Jenkins', () => {
      process.env.JENKINS_URL = 'http://jenkins.example.com';
      expect(isCIEnvironment()).toBe(true);
    });

    it('should detect Bitbucket Pipelines', () => {
      process.env.BITBUCKET_PIPELINE_UUID = 'test-uuid';
      expect(isCIEnvironment()).toBe(true);
    });

    it('should detect AWS CodeBuild', () => {
      process.env.CODEBUILD_BUILD_ID = 'test-build-id';
      expect(isCIEnvironment()).toBe(true);
    });

    it('should detect TeamCity', () => {
      process.env.TEAMCITY_VERSION = '2021.1';
      expect(isCIEnvironment()).toBe(true);
    });

    it('should detect Buildkite', () => {
      process.env.BUILDKITE = 'true';
      expect(isCIEnvironment()).toBe(true);
    });
  });

  describe('categorizeError', () => {
    it('should categorize configuration errors', () => {
      const error = new Error('Invalid configuration provided');
      expect(categorizeError(error)).toBe('configuration_error');
    });

    it('should categorize file not found errors', () => {
      const error = new Error('ENOENT: file not found');
      expect(categorizeError(error)).toBe('file_not_found');
    });

    it('should categorize network errors', () => {
      const error = new Error('Network request failed');
      expect(categorizeError(error)).toBe('network_error');
    });

    it('should categorize parse errors', () => {
      const error = new Error('Failed to parse JSON syntax');
      expect(categorizeError(error)).toBe('parse_error');
    });

    it('should categorize validation errors', () => {
      const error = new Error('Validation failed: invalid schema');
      expect(categorizeError(error)).toBe('validation_error');
    });

    it('should categorize permission errors', () => {
      const error = new Error('EACCES: permission denied');
      expect(categorizeError(error)).toBe('permission_error');
    });

    it('should return unknown_error for unrecognized errors', () => {
      const error = new Error('Something completely unexpected happened');
      expect(categorizeError(error)).toBe('unknown_error');
    });

    it('should handle non-Error objects', () => {
      const error = 'String error message';
      expect(categorizeError(error)).toBe('unknown_error');
    });

    it('should handle null/undefined errors', () => {
      expect(categorizeError(null)).toBe('unknown_error');
      expect(categorizeError(undefined)).toBe('unknown_error');
    });
  });
});

