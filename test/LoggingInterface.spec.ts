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

    it('should use spinner text as fallback when succeedSpinner has no argument', () => {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (msg: string) => logs.push(msg);

      try {
        testLogger.startSpinner('Loading data...');
        testLogger.succeedSpinner(); // No text argument - should use spinner text

        expect(logs.some((l) => l.includes('Loading data...'))).toBe(true);
      } finally {
        console.log = originalLog;
      }
    });

    it('should use spinner text as fallback when failSpinner has no argument', () => {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (msg: string) => logs.push(msg);

      try {
        testLogger.startSpinner('Connecting...');
        testLogger.failSpinner(); // No text argument - should use spinner text

        expect(logs.some((l) => l.includes('Connecting...'))).toBe(true);
      } finally {
        console.log = originalLog;
      }
    });

    it('should use provided text over spinner text in succeedSpinner', () => {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (msg: string) => logs.push(msg);

      try {
        testLogger.startSpinner('Loading...');
        testLogger.succeedSpinner('Custom success message');

        // The success message should contain the custom text with the success symbol
        expect(logs.some((l) => l.includes('Custom success message'))).toBe(
          true
        );
        // Verify the success line specifically uses custom text, not spinner text
        const successLine = logs.find((l) => l.includes('[OK]'));
        expect(successLine).toContain('Custom success message');
        expect(successLine).not.toContain('Loading...');
      } finally {
        console.log = originalLog;
      }
    });

    it('should use provided text over spinner text in failSpinner', () => {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (msg: string) => logs.push(msg);

      try {
        testLogger.startSpinner('Loading...');
        testLogger.failSpinner('Custom failure message');

        // The failure message should contain the custom text with the fail symbol
        expect(logs.some((l) => l.includes('Custom failure message'))).toBe(
          true
        );
        // Verify the failure line specifically uses custom text, not spinner text
        const failLine = logs.find((l) => l.includes('[FAIL]'));
        expect(failLine).toContain('Custom failure message');
        expect(failLine).not.toContain('Loading...');
      } finally {
        console.log = originalLog;
      }
    });

    it('should update spinner text correctly', () => {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (msg: string) => logs.push(msg);

      try {
        testLogger.startSpinner('Initial text');
        testLogger.updateSpinner('Updated text');
        testLogger.succeedSpinner(); // Should use updated text

        // Verify the success line uses updated text, not initial text
        const successLine = logs.find((l) => l.includes('[OK]'));
        expect(successLine).toContain('Updated text');
        expect(successLine).not.toContain('Initial text');
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('spinner pause/resume behavior', () => {
    let originalIsTTY: boolean | undefined;
    let originalClearLine: typeof process.stdout.clearLine;
    let originalCursorTo: typeof process.stdout.cursorTo;
    let originalWrite: typeof process.stdout.write;

    beforeEach(() => {
      // Save original values
      originalIsTTY = process.stdout.isTTY;
      originalClearLine = process.stdout.clearLine;
      originalCursorTo = process.stdout.cursorTo;
      originalWrite = process.stdout.write;

      // Mock TTY mode
      Object.defineProperty(process.stdout, 'isTTY', {
        value: true,
        writable: true,
        configurable: true
      });
      process.stdout.clearLine = jest.fn().mockReturnValue(true);
      process.stdout.cursorTo = jest.fn().mockReturnValue(true);
    });

    afterEach(() => {
      // Restore original values
      Object.defineProperty(process.stdout, 'isTTY', {
        value: originalIsTTY,
        writable: true,
        configurable: true
      });
      process.stdout.clearLine = originalClearLine;
      process.stdout.cursorTo = originalCursorTo;
      process.stdout.write = originalWrite;
      testLogger.stopSpinner();
    });

    it('should resume spinner after logging pauses it', () => {
      // Track setInterval calls
      const originalSetInterval = global.setInterval;
      let intervalCallCount = 0;
      global.setInterval = jest.fn(
        (callback: () => void, ms?: number) => {
          intervalCallCount++;
          return originalSetInterval(callback, ms);
        }
      ) as unknown as typeof setInterval;

      // Mock stdout.write to prevent actual output
      process.stdout.write = jest.fn().mockReturnValue(true);

      try {
        testLogger.startSpinner('Working...');
        expect(intervalCallCount).toBe(1); // Spinner started

        // Simulate logging which pauses and resumes spinner
        testLogger.info('Intermediate message');

        // After logging, spinner should have been resumed (setInterval called again)
        expect(intervalCallCount).toBe(2);
      } finally {
        global.setInterval = originalSetInterval;
      }
    });

    it('should not resume spinner after it has been stopped', () => {
      const originalSetInterval = global.setInterval;
      let intervalCallCount = 0;
      global.setInterval = jest.fn(
        (callback: () => void, ms?: number) => {
          intervalCallCount++;
          return originalSetInterval(callback, ms);
        }
      ) as unknown as typeof setInterval;

      process.stdout.write = jest.fn().mockReturnValue(true);

      try {
        testLogger.startSpinner('Working...');
        expect(intervalCallCount).toBe(1);

        testLogger.stopSpinner();

        // Logging after stop should not try to resume spinner
        testLogger.info('Message after stop');

        // No new interval should be created
        expect(intervalCallCount).toBe(1);
      } finally {
        global.setInterval = originalSetInterval;
      }
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
  
  describe('Logger singleton', () => {
    it('should be an instance of LoggerClass', () => {
      expect(Logger).toBeInstanceOf(LoggerClass);
    });

    it('should have default info level', () => {
      const freshLogger = new LoggerClass();
      expect(freshLogger.getLevel()).toBe('info');
    });
  });
});
