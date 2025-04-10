import { TimeoutError } from './errors.js';

/**
 * Simple retry function for promise-returning operations
 * @param fn Function to retry
 * @param options Retry options
 * @returns Result of the function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
  } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 1000;
  const maxDelayMs = options.maxDelayMs ?? 5000;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries - 1) {
        break;
      }

      const delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts?: number;
  /** Initial delay in milliseconds */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds */
  maxDelayMs?: number;
  /** Jitter factor (0-1) to add randomness to delays */
  jitter?: number;
  /** Timeout for each attempt in milliseconds */
  timeoutMs?: number;
  /** Optional logger instance */
  logger?: {
    warn: (msg: string, ...args: any[]) => void;
    debug: (msg: string, ...args: any[]) => void;
  };
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  jitter: 0.1,
  timeoutMs: 30000,
  logger: console,
};

/**
 * Implements exponential backoff with jitter
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const exponentialDelay = options.initialDelayMs * Math.pow(2, attempt - 1);
  const delay = Math.min(exponentialDelay, options.maxDelayMs);
  
  if (options.jitter === 0) return delay;
  
  const jitterAmount = delay * options.jitter;
  return delay + (Math.random() * 2 - 1) * jitterAmount;
}

/**
 * Wraps a promise-returning function with retry logic
 * @param fn The function to retry
 * @param options Retry configuration options
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const finalOptions: Required<RetryOptions> = { ...DEFAULT_OPTIONS, ...options };
  const { maxAttempts, timeoutMs, logger } = finalOptions;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Wrap the function call with timeout
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`, timeoutMs));
          }, timeoutMs);
        }),
      ]);

      if (attempt > 1) {
        logger.debug(`Succeeded after ${attempt} attempts`);
      }

      return result;
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxAttempts) {
        logger.warn(`Failed after ${maxAttempts} attempts`, { error: lastError });
        break;
      }

      const delay = calculateDelay(attempt, finalOptions);
      logger.debug(
        `Attempt ${attempt}/${maxAttempts} failed, retrying in ${Math.round(delay)}ms`,
        { error: lastError }
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Creates a retryable version of a function
 * @param fn The function to make retryable
 * @param options Default retry options for the function
 */
export function makeRetryable<Args extends any[], Return>(
  fn: (...args: Args) => Promise<Return>,
  options: RetryOptions = {}
): (...args: Args) => Promise<Return> {
  return async (...args: Args): Promise<Return> => {
    return withRetry(() => fn(...args), options);
  };
}

/**
 * Simple circuit breaker implementation
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly threshold: number = 5,
    private readonly resetTimeoutMs: number = 30000
  ) {}

  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      if (this.state === 'half-open') {
        this.reset();
      }
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  private reset() {
    this.failures = 0;
    this.state = 'closed';
  }

  public getState() {
    return this.state;
  }
}