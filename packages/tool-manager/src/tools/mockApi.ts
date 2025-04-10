import axios, { AxiosRequestConfig, Method } from 'axios';
import CircuitBreaker from 'opossum';
import { createLogger } from '@acme/shared-utils';

const logger = createLogger('tool-manager:mock-api');

// Type definitions
interface MockApiParams {
  endpoint: string;
  method?: Method;
  data?: Record<string, unknown>;
}

// Create circuit breaker options
const circuitBreakerOptions = {
  timeout: process.env.CIRCUIT_BREAKER_TIMEOUT ? parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT, 10) : 10000,
  resetTimeout: process.env.CIRCUIT_BREAKER_RESET_TIMEOUT ? parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT, 10) : 30000,
  errorThresholdPercentage: process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD ? parseInt(process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD, 10) : 50,
};

// Create the axios instance
const apiClient = axios.create({
  baseURL: process.env.MOCK_API_BASE_URL || 'https://jsonplaceholder.typicode.com',
  timeout: 5000,
});

// Function to execute the Mock API request
const executeMockApiRequest = async (params: MockApiParams) => {
  try {
    const { endpoint, method = 'GET', data } = params;
    
    logger.info(`Executing Mock API request: ${method} ${endpoint}`);
    
    const config: AxiosRequestConfig = {
      method,
      url: endpoint,
    };
    
    if (method === 'POST' && data) {
      config.data = data;
    }
    
    const response = await apiClient.request(config);
    
    logger.info(`Mock API request successful: ${method} ${endpoint}`);
    
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(`Mock API request failed: ${error.message}`, {
        status: error.response?.status,
        data: error.response?.data,
      });
      
      // Rethrow with more structured information
      throw new Error(`Mock API request failed: ${error.message}`);
    }
    
    logger.error(`Unexpected error executing Mock API request: ${error}`);
    throw error;
  }
};

// Create a circuit breaker for the Mock API request
const mockApiBreaker = new CircuitBreaker(executeMockApiRequest, circuitBreakerOptions);

// Listen to circuit breaker events
mockApiBreaker.on('open', () => {
  logger.warn('Mock API circuit breaker opened');
});

mockApiBreaker.on('close', () => {
  logger.info('Mock API circuit breaker closed');
});

mockApiBreaker.on('halfOpen', () => {
  logger.info('Mock API circuit breaker half-open');
});

mockApiBreaker.on('fallback', (result) => {
  logger.warn('Mock API request failed, falling back');
});

// Export the function to execute the Mock API request with circuit breaker
export async function executeMockApi(params: MockApiParams) {
  try {
    return await mockApiBreaker.fire(params);
  } catch (error) {
    logger.error(`Error executing Mock API with circuit breaker: ${error}`);
    throw error;
  }
}
