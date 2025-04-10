import axios, { AxiosInstance } from 'axios';
import { Logger } from '../logging.js';
import { retry } from '../retry.js';

/**
 * Configuration for the Tool Manager client
 */
export interface ToolManagerConfig {
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
export type ToolParams = Record<string, unknown>;

/**
 * Tool execution result
 */
export interface ToolResult {
  result: unknown;
}

/**
 * Client for interacting with the Tool Manager service
 */
export class ToolManagerClient {
  private axiosInstance: AxiosInstance;
  private logger: Logger;
  private retryOptions: ToolManagerConfig['retryOptions'];

  /**
   * Create a new Tool Manager client
   * @param config Tool Manager configuration
   * @param logger Logger instance
   */
  constructor(config: ToolManagerConfig, logger: Logger) {
    this.logger = logger;
    this.retryOptions = config.retryOptions || {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 5000,
    };

    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeoutMs || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * List all available tools
   * @returns List of available tools
   */
  async listTools(): Promise<any[]> {
    try {
      const response = await retry(
        () => this.axiosInstance.get('/v1/tools'),
        this.retryOptions
      );
      return response.data;
    } catch (error) {
      this.logger.error('Error listing tools', error);
      throw error;
    }
  }

  /**
   * Execute a specific tool
   * @param toolName Name of the tool to execute
   * @param params Parameters for the tool
   * @returns Result of the tool execution
   */
  async executeTool(toolName: string, params: ToolParams): Promise<ToolResult> {
    try {
      this.logger.info(`Executing tool: ${toolName}`);
      
      const response = await retry(
        () => this.axiosInstance.post(`/v1/tools/${toolName}/execute`, { params }),
        this.retryOptions
      );
      
      this.logger.info(`Tool ${toolName} executed successfully`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error executing tool ${toolName}`, error);
      throw error;
    }
  }

  /**
   * Check the health of the Tool Manager service
   * @returns Health status
   */
  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.axiosInstance.get('/health');
      return response.data;
    } catch (error) {
      this.logger.error('Tool Manager health check failed', error);
      throw error;
    }
  }
}
