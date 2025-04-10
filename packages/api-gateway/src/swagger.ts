/**
 * Enhanced Swagger documentation for the API Gateway
 */
export const swaggerOptions = {
  swagger: {
    info: {
      title: 'Manis AI API Gateway',
      description: `
## Manis-Inspired Autonomous AI System API

This API allows you to interact with the Manis-Inspired Autonomous AI System, an advanced multi-agent AI system capable of handling complex goals through orchestrated task execution.

### Key Features
- Submit high-level goals in natural language
- Track job status and progress
- Retrieve detailed results
- Observe agent reasoning through Chain-of-Thought logs

### Authentication
All endpoints currently use API key authentication (to be implemented).
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
      { name: 'jobs', description: 'Job submission and tracking' },
      { name: 'status', description: 'Job status monitoring' },
      { name: 'system', description: 'System information and health' },
    ],
    securityDefinitions: {
      apiKey: {
        type: 'apiKey' as const,
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
    docExpansion: 'list' as const,
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
  jobStatusResponse: {
    type: 'object',
    properties: {
      jobId: { type: 'string', format: 'uuid', description: 'Unique job identifier' },
      goal: { type: 'string', description: 'Original goal text submitted by the user' },
      status: { 
        type: 'string', 
        enum: ['pending', 'in-progress', 'completed', 'failed'],
        description: 'Current job status'
      },
      timestamp: { type: 'string', format: 'date-time', description: 'Last update timestamp' },
      error: { type: 'string', nullable: true, description: 'Error message if job failed' },
      tasks: {
        type: 'array',
        description: 'List of tasks for this job',
        items: {
          type: 'object',
          properties: {
            taskId: { type: 'string', format: 'uuid', description: 'Unique task identifier' },
            status: { 
              type: 'string', 
              enum: ['pending', 'queued', 'in-progress', 'completed', 'failed', 'retrying'],
              description: 'Current task status'
            },
            message: { type: 'string', nullable: true, description: 'Status message' },
            result: { type: 'object', nullable: true, description: 'Task result data' },
            error: { type: 'string', nullable: true, description: 'Error details if task failed' },
            timestamp: { type: 'string', format: 'date-time', description: 'Last update timestamp' },
          },
        },
      },
    },
    required: ['jobId', 'goal', 'status', 'timestamp', 'tasks'],
  },
  jobSubmissionRequest: {
    type: 'object',
    required: ['goal'],
    properties: {
      goal: { 
        type: 'string', 
        minLength: 10,
        description: 'High-level goal in natural language (e.g., "Analyze the impact of recent AI regulations on healthcare")'
      },
      priority: {
        type: 'string',
        enum: ['low', 'normal', 'high'],
        default: 'normal',
        description: 'Job priority level (not yet implemented)'
      },
    },
  },
  jobCreatedResponse: {
    type: 'object',
    properties: {
      jobId: { type: 'string', format: 'uuid', description: 'Unique job identifier for tracking' },
    },
    required: ['jobId'],
  },
};
