/* eslint-disable no-undef, no-console, security/detect-object-injection */
/**
 * Enhanced logging interface with levels, colors, and spinners
 */
import pc from 'picocolors';

export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'verbose' | 'debug';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  verbose: 4,
  debug: 5
};

// Simple spinner implementation using console
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

interface SpinnerState {
  text: string;
  interval: ReturnType<typeof setInterval> | null;
  frameIndex: number;
}

/**
 * Logging interface for the model generation library
 */
export interface LoggingInterface {
  debug(message?: unknown, ...optionalParams: unknown[]): void;
  info(message?: unknown, ...optionalParams: unknown[]): void;
  warn(message?: unknown, ...optionalParams: unknown[]): void;
  error(message?: unknown, ...optionalParams: unknown[]): void;
}

/**
 * Extended logging interface with additional capabilities
 */
export interface ExtendedLoggingInterface extends LoggingInterface {
  // Additional log level
  verbose(message?: unknown, ...optionalParams: unknown[]): void;

  // Progress helpers
  startSpinner(text: string): void;
  updateSpinner(text: string): void;
  succeedSpinner(text?: string): void;
  failSpinner(text?: string): void;
  stopSpinner(): void;

  // Structured output
  json(data: unknown): void;

  // Configuration
  setLevel(level: LogLevel): void;
  setJsonMode(enabled: boolean): void;
  setColors(enabled: boolean): void;

  // State queries
  getLevel(): LogLevel;
  isJsonMode(): boolean;
}

/**
 * Logger class with enhanced capabilities
 *
 * Supports log levels, colors, spinners, and JSON output mode.
 * Acts as a forefront for any external loggers.
 */
export class LoggerClass implements ExtendedLoggingInterface {
  private logger?: LoggingInterface = undefined;
  private level: LogLevel = 'info';
  private jsonMode = false;
  private colorsEnabled = true;
  private spinner: SpinnerState | null = null;

  /**
   * Check if a message at the given level should be logged
   */
  private shouldLog(messageLevel: LogLevel): boolean {
    return (
      LOG_LEVEL_PRIORITY[messageLevel] <= LOG_LEVEL_PRIORITY[this.level] &&
      !this.jsonMode
    );
  }

  /**
   * Format a message with optional color
   */
  private formatMessage(
    message: unknown,
    colorFn?: (s: string) => string
  ): string {
    const msg = String(message);
    if (this.colorsEnabled && colorFn) {
      return colorFn(msg);
    }
    return msg;
  }

  /**
   * Stop spinner before logging to prevent output overlap
   */
  private pauseSpinner(): void {
    if (this.spinner?.interval) {
      clearInterval(this.spinner.interval);
      // Clear the current line
      if (process.stdout.isTTY) {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
      }
    }
  }

  /**
   * Resume spinner after logging
   */
  private resumeSpinner(): void {
    if (this.spinner && !this.spinner.interval) {
      this.renderSpinner();
    }
  }

  /**
   * Render the spinner
   */
  private renderSpinner(): void {
    if (!this.spinner || !process.stdout.isTTY) {
      return;
    }

    this.spinner.interval = setInterval(() => {
      if (!this.spinner) {
        return;
      }
      const frame = this.colorsEnabled
        ? pc.cyan(SPINNER_FRAMES[this.spinner.frameIndex])
        : SPINNER_FRAMES[this.spinner.frameIndex];
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`${frame} ${this.spinner.text}`);
      this.spinner.frameIndex =
        (this.spinner.frameIndex + 1) % SPINNER_FRAMES.length;
    }, 80);
  }

  debug(message?: unknown, ...optionalParams: unknown[]): void {
    if (!this.shouldLog('debug')) {
      return;
    }

    this.pauseSpinner();
    const prefix = this.formatMessage('[DEBUG] ', pc.gray);
    const formattedMessage = this.formatMessage(message, pc.gray);

    if (this.logger) {
      this.logger.debug(prefix + formattedMessage, ...optionalParams);
    } else {
      console.debug(prefix + formattedMessage, ...optionalParams);
    }
    this.resumeSpinner();
  }

  verbose(message?: unknown, ...optionalParams: unknown[]): void {
    if (!this.shouldLog('verbose')) {
      return;
    }

    this.pauseSpinner();
    const formattedMessage = this.formatMessage(message, pc.dim);

    if (this.logger) {
      this.logger.info(formattedMessage, ...optionalParams);
    } else {
      console.log(formattedMessage, ...optionalParams);
    }
    this.resumeSpinner();
  }

  info(message?: unknown, ...optionalParams: unknown[]): void {
    if (!this.shouldLog('info')) {
      return;
    }

    this.pauseSpinner();
    const msg = String(message);

    if (this.logger) {
      this.logger.info(msg, ...optionalParams);
    } else {
      // Use process.stdout.write for better capture by oclif test utilities
      const fullMsg =
        optionalParams.length > 0
          ? `${msg} ${optionalParams.join(' ')}\n`
          : `${msg}\n`;
      process.stdout.write(fullMsg);
    }
    this.resumeSpinner();
  }

  warn(message?: unknown, ...optionalParams: unknown[]): void {
    if (!this.shouldLog('warn')) {
      return;
    }

    this.pauseSpinner();
    const formattedMessage = this.formatMessage(message, pc.yellow);

    if (this.logger) {
      this.logger.warn(formattedMessage, ...optionalParams);
    } else {
      console.warn(formattedMessage, ...optionalParams);
    }
    this.resumeSpinner();
  }

  error(message?: unknown, ...optionalParams: unknown[]): void {
    if (!this.shouldLog('error')) {
      return;
    }

    this.pauseSpinner();
    const formattedMessage = this.formatMessage(message, pc.red);

    if (this.logger) {
      this.logger.error(formattedMessage, ...optionalParams);
    } else {
      console.error(formattedMessage, ...optionalParams);
    }
    this.resumeSpinner();
  }

  /**
   * Start a spinner with the given text
   */
  startSpinner(text: string): void {
    if (this.jsonMode) {
      return;
    }
    this.stopSpinner();

    this.spinner = {
      text,
      interval: null,
      frameIndex: 0
    };

    if (process.stdout.isTTY) {
      this.renderSpinner();
    } else {
      // In non-TTY mode, just print the text
      console.log(text);
    }
  }

  /**
   * Update the spinner text
   */
  updateSpinner(text: string): void {
    if (this.spinner) {
      this.spinner.text = text;
    }
  }

  /**
   * Stop the spinner with a success message
   */
  succeedSpinner(text?: string): void {
    this.stopSpinner();
    const displayText = text || this.spinner?.text || '';
    if (displayText && this.shouldLog('info')) {
      const symbol = this.colorsEnabled ? pc.green('✓') : '[OK]';
      console.log(`${symbol} ${displayText}`);
    }
  }

  /**
   * Stop the spinner with a failure message
   */
  failSpinner(text?: string): void {
    this.stopSpinner();
    const displayText = text || this.spinner?.text || '';
    if (displayText && this.shouldLog('error')) {
      const symbol = this.colorsEnabled ? pc.red('✗') : '[FAIL]';
      console.log(`${symbol} ${displayText}`);
    }
  }

  /**
   * Stop the spinner without a message
   */
  stopSpinner(): void {
    if (this.spinner) {
      if (this.spinner.interval) {
        clearInterval(this.spinner.interval);
      }
      if (process.stdout.isTTY) {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
      }
      this.spinner = null;
    }
  }

  /**
   * Output structured JSON data
   * Only outputs in JSON mode or when explicitly called
   */
  json(data: unknown): void {
    this.stopSpinner();
    console.log(JSON.stringify(data, null, 2));
  }

  /**
   * Set the log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Enable or disable JSON mode
   * In JSON mode, only json() output is shown
   */
  setJsonMode(enabled: boolean): void {
    this.jsonMode = enabled;
    if (enabled) {
      this.stopSpinner();
    }
  }

  /**
   * Enable or disable colored output
   */
  setColors(enabled: boolean): void {
    this.colorsEnabled = enabled;
  }

  /**
   * Get the current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }

  /**
   * Check if JSON mode is enabled
   */
  isJsonMode(): boolean {
    return this.jsonMode;
  }

  /**
   * Sets the logger to use for the model generation library
   *
   * @param logger to add
   */
  setLogger(logger?: LoggingInterface): void {
    this.logger = logger;
  }

  /**
   * Reset the logger to default state.
   * Useful for testing or when re-initializing the logger.
   */
  reset(): void {
    this.stopSpinner();
    this.level = 'info';
    this.jsonMode = false;
    this.colorsEnabled = true;
    this.logger = undefined;
  }
}

export const Logger: LoggerClass = new LoggerClass();
