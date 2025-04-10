import pino from 'pino';

interface LogContext {
    jobId?: string;
    taskId?: string;
    agentId?: string;
    traceId?: string;
    spanId?: string;
}
/**
 * Creates a configured Pino logger instance with the given context
 * @param name The name of the logger (typically service/component name)
 * @param context Additional context to include in all logs
 */
declare function createLogger(name: string, context?: LogContext): pino.Logger<never, boolean>;
/**
 * Type-safe way to add context to an existing logger
 */
declare function addLogContext(logger: pino.Logger, context: LogContext): pino.pino.Logger<never, boolean>;
/**
 * Utility to create a child logger with job context
 */
declare function createJobLogger(baseLogger: pino.Logger, jobId: string, taskId?: string): pino.pino.Logger<never, boolean>;
type Logger = pino.Logger;

/**
 * Base error class for all custom errors in the system
 */
declare class ManisError extends Error {
    readonly code: string;
    constructor(message: string, code: string, _cause?: Error);
}
/**
 * Error thrown when a task fails to execute
 */
declare class TaskExecutionError extends ManisError {
    readonly taskId: string;
    readonly jobId: string;
    readonly cause?: Error | undefined;
    constructor(message: string, taskId: string, jobId: string, cause?: Error | undefined);
}
/**
 * Error thrown when validation fails (e.g., schema validation)
 */
declare class ValidationError extends ManisError {
    readonly details?: unknown | undefined;
    constructor(message: string, details?: unknown | undefined);
}
/**
 * Error thrown when a required resource is not found
 */
declare class NotFoundError extends ManisError {
    readonly resourceType: string;
    readonly resourceId: string;
    constructor(message: string, resourceType: string, resourceId: string);
}
/**
 * Error thrown when tool execution fails
 */
declare class ToolExecutionError extends ManisError {
    readonly toolName: string;
    readonly params: Record<string, unknown>;
    readonly cause?: Error | undefined;
    constructor(message: string, toolName: string, params: Record<string, unknown>, cause?: Error | undefined);
}
/**
 * Error thrown when communication fails (e.g., message bus errors)
 */
declare class CommunicationError extends ManisError {
    readonly target: string;
    readonly cause?: Error | undefined;
    constructor(message: string, target: string, cause?: Error | undefined);
}
/**
 * Error thrown when a timeout occurs
 */
declare class TimeoutError extends ManisError {
    readonly timeoutMs: number;
    constructor(message: string, timeoutMs: number);
}
/**
 * Error thrown when memory/RAG operations fail
 */
declare class MemoryError extends ManisError {
    readonly operation: string;
    readonly cause?: Error | undefined;
    constructor(message: string, operation: string, cause?: Error | undefined);
}
/**
 * Error thrown when there are insufficient resources or capabilities
 */
declare class CapabilityError extends ManisError {
    readonly requiredCapability: string;
    constructor(message: string, requiredCapability: string);
}

/**
 * Simple retry function for promise-returning operations
 * @param fn Function to retry
 * @param options Retry options
 * @returns Result of the function
 */
declare function retry<T>(fn: () => Promise<T>, options?: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
}): Promise<T>;
interface RetryOptions {
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
/**
 * Wraps a promise-returning function with retry logic
 * @param fn The function to retry
 * @param options Retry configuration options
 */
declare function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
/**
 * Creates a retryable version of a function
 * @param fn The function to make retryable
 * @param options Default retry options for the function
 */
declare function makeRetryable<Args extends any[], Return>(fn: (...args: Args) => Promise<Return>, options?: RetryOptions): (...args: Args) => Promise<Return>;
/**
 * Simple circuit breaker implementation
 */
declare class CircuitBreaker {
    private readonly threshold;
    private readonly resetTimeoutMs;
    private failures;
    private lastFailureTime;
    private state;
    constructor(threshold?: number, resetTimeoutMs?: number);
    execute<T>(fn: () => Promise<T>): Promise<T>;
    private recordFailure;
    private reset;
    getState(): "closed" | "open" | "half-open";
}

interface RabbitMQConfig {
    url: string;
}
declare class RabbitMQClient {
    private connection;
    private channel;
    private readonly config;
    private readonly logger;
    constructor(config: RabbitMQConfig, logger: Logger);
    connect(): Promise<void>;
    getChannel(): any;
    declareExchangesAndQueues(): Promise<void>;
    close(): Promise<void>;
}

/**
 * Configuration for the Tool Manager client
 */
interface ToolManagerConfig {
    baseUrl: string;
    timeoutMs?: number;
    retryOptions?: {
        maxRetries: number;
        initialDelayMs: number;
        maxDelayMs: number;
    };
}
/**
 * Parameter type for tool execution
 */
type ToolParams = Record<string, unknown>;
/**
 * Tool execution result
 */
interface ToolResult {
    result: unknown;
}
/**
 * Client for interacting with the Tool Manager service
 */
declare class ToolManagerClient {
    private axiosInstance;
    private logger;
    private retryOptions;
    /**
     * Create a new Tool Manager client
     * @param config Tool Manager configuration
     * @param logger Logger instance
     */
    constructor(config: ToolManagerConfig, logger: Logger);
    /**
     * List all available tools
     * @returns List of available tools
     */
    listTools(): Promise<any[]>;
    /**
     * Execute a specific tool
     * @param toolName Name of the tool to execute
     * @param params Parameters for the tool
     * @returns Result of the tool execution
     */
    executeTool(toolName: string, params: ToolParams): Promise<ToolResult>;
    /**
     * Check the health of the Tool Manager service
     * @returns Health status
     */
    checkHealth(): Promise<{
        status: string;
        timestamp: string;
    }>;
}

export { CapabilityError, CircuitBreaker, CommunicationError, type LogContext, type Logger, ManisError, MemoryError, NotFoundError, RabbitMQClient, type RabbitMQConfig, type RetryOptions, TaskExecutionError, TimeoutError, ToolExecutionError, ToolManagerClient, type ToolManagerConfig, type ToolParams, type ToolResult, ValidationError, addLogContext, createJobLogger, createLogger, makeRetryable, retry, withRetry };
