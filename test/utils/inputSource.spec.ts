import {isRemoteUrl, getInputSourceType} from '../../src/utils/inputSource';

describe('inputSource utilities', () => {
  describe('isRemoteUrl', () => {
    it('returns true for http URL', () => {
      expect(isRemoteUrl('http://example.com/spec.json')).toBe(true);
    });

    it('returns true for https URL', () => {
      expect(isRemoteUrl('https://example.com/spec.yaml')).toBe(true);
    });

    it('returns false for file:// URL (not yet supported)', () => {
      expect(isRemoteUrl('file:///etc/spec.yaml')).toBe(false);
    });

    it('returns false for relative path', () => {
      expect(isRemoteUrl('./spec.yaml')).toBe(false);
    });

    it('returns false for absolute filesystem path on POSIX', () => {
      expect(isRemoteUrl('/var/spec.yaml')).toBe(false);
    });

    it('returns false for absolute filesystem path on Windows', () => {
      expect(isRemoteUrl('C:\\Users\\spec.yaml')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isRemoteUrl('')).toBe(false);
    });

    it('returns false for malformed string starting with httpz', () => {
      expect(isRemoteUrl('httpz://example.com')).toBe(false);
    });
  });

  describe('getInputSourceType', () => {
    it('classifies http(s) URL as remote_url', () => {
      expect(getInputSourceType('https://example.com/spec.json')).toBe(
        'remote_url'
      );
      expect(getInputSourceType('http://example.com/spec.yaml')).toBe(
        'remote_url'
      );
    });

    it('classifies relative path as local_relative', () => {
      expect(getInputSourceType('./spec.yaml')).toBe('local_relative');
      expect(getInputSourceType('spec.json')).toBe('local_relative');
    });

    it('classifies absolute path as local_absolute', () => {
      // path.isAbsolute is platform-aware; both forms below are absolute
      // on at least one supported platform
      const absolute =
        process.platform === 'win32' ? 'C:\\spec.yaml' : '/var/spec.yaml';
      expect(getInputSourceType(absolute)).toBe('local_absolute');
    });
  });
});
