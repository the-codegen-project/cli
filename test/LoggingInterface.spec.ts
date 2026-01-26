/* eslint-disable no-console */
import {Logger, LoggerClass} from '../src/LoggingInterface';

describe('LoggingInterface', () => {
  let testLogger: LoggerClass;

  beforeEach(() => {
    testLogger = new LoggerClass();
    // Disable colors for predictable test output
    testLogger.setColors(false);
    // Set to debug level to capture all logs
    testLogger.setLevel('debug');
  });

  afterEach(() => {
    testLogger.stopSpinner();
    // Reset the singleton Logger to ensure clean state for other tests
    Logger.reset();
  });

  describe('log levels', () => {
    it('should respect log level priority', () => {
      const logs: string[] = [];
      testLogger.setLogger({
        debug: (msg: string) => logs.push(`debug:${msg}`),
        info: (msg: string) => logs.push(`info:${msg}`),
        warn: (msg: string) => logs.push(`warn:${msg}`),
        error: (msg: string) => logs.push(`error:${msg}`)
      });

      // At 'info' level, debug should not be logged
      testLogger.setLevel('info');
      testLogger.debug('debug message');
      testLogger.info('info message');
      testLogger.warn('warn message');
      testLogger.error('error message');

      expect(logs).toContain('info:info message');
      expect(logs).toContain('warn:warn message');
      expect(logs).toContain('error:error message');
      expect(logs.filter((l) => l.includes('debug message'))).toHaveLength(0);
    });

    it('should log nothing at silent level', () => {
      const logs: string[] = [];
      testLogger.setLogger({
        debug: (msg: string) => logs.push(`debug:${msg}`),
        info: (msg: string) => logs.push(`info:${msg}`),
        warn: (msg: string) => logs.push(`warn:${msg}`),
        error: (msg: string) => logs.push(`error:${msg}`)
      });

      testLogger.setLevel('silent');
      testLogger.debug('debug');
      testLogger.info('info');
      testLogger.warn('warn');
      testLogger.error('error');

      expect(logs).toHaveLength(0);
    });

    it('should log everything at debug level', () => {
      const logs: string[] = [];
      testLogger.setLogger({
        debug: (msg: string) => logs.push(`debug:${msg}`),
        info: (msg: string) => logs.push(`info:${msg}`),
        warn: (msg: string) => logs.push(`warn:${msg}`),
        error: (msg: string) => logs.push(`error:${msg}`)
      });

      testLogger.setLevel('debug');
      testLogger.debug('debug');
      testLogger.verbose('verbose');
      testLogger.info('info');
      testLogger.warn('warn');
      testLogger.error('error');

      expect(logs.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('JSON mode', () => {
    it('should suppress regular output in JSON mode', () => {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (msg: string) => logs.push(msg);

      testLogger.setJsonMode(true);
      testLogger.info('should not appear');

      console.log = originalLog;
      expect(logs.filter((l) => l.includes('should not appear'))).toHaveLength(
        0
      );
    });

    it('should output JSON when json() is called', () => {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (msg: string) => logs.push(msg);

      testLogger.json({test: 'data'});

      console.log = originalLog;
      expect(logs.join('\n')).toContain('"test": "data"');
    });
  });

  describe('getLevel and isJsonMode', () => {
    it('should return current log level', () => {
      testLogger.setLevel('warn');
      expect(testLogger.getLevel()).toBe('warn');
    });

    it('should return JSON mode state', () => {
      expect(testLogger.isJsonMode()).toBe(false);
      testLogger.setJsonMode(true);
      expect(testLogger.isJsonMode()).toBe(true);
    });
  });

  describe('setLogger', () => {
    it('should use custom logger when set', () => {
      const customLogs: string[] = [];
      testLogger.setLogger({
        debug: () => {},
        info: (msg: string) => customLogs.push(msg),
        warn: () => {},
        error: () => {}
      });

      testLogger.info('custom log');
      expect(customLogs).toContain('custom log');
    });

    it('should use stdout when no logger is set', () => {
      const logs: string[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string) => {
        logs.push(chunk);
        return true;
      }) as typeof process.stdout.write;

      testLogger.setLogger(undefined);
      testLogger.info('stdout log');

      process.stdout.write = originalWrite;
      expect(logs.some((l) => l.includes('stdout log'))).toBe(true);
    });
  });

  describe('spinner methods', () => {
    it('should not throw when spinner methods are called', () => {
      // In non-TTY environment, these should just log text
      expect(() => testLogger.startSpinner('Loading...')).not.toThrow();
      expect(() => testLogger.updateSpinner('Still loading...')).not.toThrow();
      expect(() => testLogger.succeedSpinner('Done!')).not.toThrow();
      expect(() => testLogger.failSpinner('Failed!')).not.toThrow();
      expect(() => testLogger.stopSpinner()).not.toThrow();
    });

    it('should not start spinner in JSON mode', () => {
      testLogger.setJsonMode(true);
      testLogger.startSpinner('Loading...');
      // No error thrown, spinner should be null
      expect(() => testLogger.stopSpinner()).not.toThrow();
    });
  });

  describe('verbose logging', () => {
    it('should log at verbose level when level is verbose or higher', () => {
      const logs: string[] = [];
      testLogger.setLogger({
        debug: () => {},
        info: (msg: string) => logs.push(msg),
        warn: () => {},
        error: () => {}
      });

      testLogger.setLevel('verbose');
      testLogger.verbose('verbose message');

      expect(logs.filter((l) => l.includes('verbose message'))).toHaveLength(1);
    });

    it('should not log at verbose level when level is info', () => {
      const logs: string[] = [];
      testLogger.setLogger({
        debug: () => {},
        info: (msg: string) => logs.push(msg),
        warn: () => {},
        error: () => {}
      });

      testLogger.setLevel('info');
      testLogger.verbose('verbose message');

      expect(logs.filter((l) => l.includes('verbose message'))).toHaveLength(0);
    });
  });
});

describe('Logger singleton', () => {
  it('should be an instance of LoggerClass', () => {
    expect(Logger).toBeInstanceOf(LoggerClass);
  });

  it('should have default info level', () => {
    const freshLogger = new LoggerClass();
    expect(freshLogger.getLevel()).toBe('info');
  });
});
