/**
 * Base error class for all custom errors in the system
 */
export class ManisError extends Error {
  constructor(
    message: string, 
    public readonly code: string,
    _cause?: Error  // Use underscore prefix to indicate unused param
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when a task fails to execute
 */
export class TaskExecutionError extends ManisError {
  constructor(
    message: string,
    public readonly taskId: string,
    public readonly jobId: string,
    public override readonly cause?: Error
  ) {
    super(message, 'TASK_EXECUTION_ERROR', cause);
  }
}

/**
 * Error thrown when validation fails (e.g., schema validation)
 */
export class ValidationError extends ManisError {
  constructor(message: string, public readonly details?: unknown) {
    super(message, 'VALIDATION_ERROR');
  }
}

/**
 * Error thrown when a required resource is not found
 */
export class NotFoundError extends ManisError {
  constructor(message: string, public readonly resourceType: string, public readonly resourceId: string) {
    super(message, 'NOT_FOUND_ERROR');
  }
}

/**
 * Error thrown when tool execution fails
 */
export class ToolExecutionError extends ManisError {
  constructor(
    message: string,
    public readonly toolName: string,
    public readonly params: Record<string, unknown>,
    public override readonly cause?: Error
  ) {
    super(message, 'TOOL_EXECUTION_ERROR', cause);
  }
}

/**
 * Error thrown when communication fails (e.g., message bus errors)
 */
export class CommunicationError extends ManisError {
  constructor(
    message: string, 
    public readonly target: string, 
    public override readonly cause?: Error
  ) {
    super(message, 'COMMUNICATION_ERROR', cause);
  }
}

/**
 * Error thrown when a timeout occurs
 */
export class TimeoutError extends ManisError {
  constructor(message: string, public readonly timeoutMs: number) {
    super(message, 'TIMEOUT_ERROR');
  }
}

/**
 * Error thrown when memory/RAG operations fail
 */
export class MemoryError extends ManisError {
  constructor(
    message: string, 
    public readonly operation: string, 
    public override readonly cause?: Error
  ) {
    super(message, 'MEMORY_ERROR', cause);
  }
}

/**
 * Error thrown when there are insufficient resources or capabilities
 */
export class CapabilityError extends ManisError {
  constructor(message: string, public readonly requiredCapability: string) {
    super(message, 'CAPABILITY_ERROR');
  }
}