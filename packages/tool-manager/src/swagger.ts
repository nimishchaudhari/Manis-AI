/**
 * Enhanced Swagger documentation for the Tool Manager
 */
export const swaggerOptions = {
  swagger: {
    info: {
      title: 'Manis AI Tool Manager',
      description: `
## Tool Manager API

This API provides a standardized interface for agents to access external tools and services.
The Tool Manager abstracts away the complexity of interacting with various external APIs,
providing unified error handling, retries, and circuit breaking.

### Key Features
- Unified tool execution interface
- Automatic error handling and retries
- Circuit breaking for unstable services
- Secure credential management
- Audit logging

### Authentication
Internal service authentication is handled via API keys (to be implemented).
      `,
      version: '1.0.0',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    externalDocs: {
      description: 'Find more information here',
      url: 'https://github.com/example/manis-ai',
    },
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: [
      { name: 'tools', description: 'Tool execution and management' },
      { name: 'system', description: 'System information and health' },
    ],
    securityDefinitions: {
      apiKey: {
        type: 'apiKey' as 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'API key for authentication (to be implemented)',
      },
    },
  },
};

/**
 * Swagger UI configuration options
 */
export const swaggerUiOptions = {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'list' as 'list',
    deepLinking: true,
    persistAuthorization: true,
  },
  staticCSP: true,
  transformStaticCSP: (header: string) => header,
  logo: {
    type: 'image/png',
    content: '', // Could add base64-encoded image
  },
};

/**
 * Common schema definitions
 */
export const schemaDefinitions = {
  errorResponse: {
    type: 'object',
    properties: {
      error: { type: 'string', description: 'Error message' },
      details: { 
        type: 'object', 
        description: 'Additional error details', 
        additionalProperties: true 
      },
    },
    required: ['error'],
  },
  toolListItem: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Unique tool identifier' },
      description: { type: 'string', description: 'Human-readable description of the tool' },
      parameters: {
        type: 'object',
        description: 'Parameter schema for the tool',
        additionalProperties: true,
      },
    },
    required: ['name', 'description', 'parameters'],
  },
  toolExecutionRequest: {
    type: 'object',
    required: ['params'],
    properties: {
      params: {
        type: 'object',
        description: 'Tool-specific parameters',
        additionalProperties: true,
      },
    },
  },
  toolExecutionResponse: {
    type: 'object',
    properties: {
      result: {
        type: 'object',
        description: 'Tool execution result',
        additionalProperties: true,
      },
    },
    required: ['result'],
  },
  mockApiParams: {
    type: 'object',
    required: ['endpoint'],
    properties: {
      endpoint: { 
        type: 'string', 
        description: 'API endpoint to call (e.g., "/posts/1")' 
      },
      method: { 
        type: 'string', 
        enum: ['GET', 'POST'], 
        default: 'GET',
        description: 'HTTP method to use' 
      },
      data: {
        type: 'object',
        description: 'Data to send with POST requests',
        additionalProperties: true,
      },
    },
  },
};
