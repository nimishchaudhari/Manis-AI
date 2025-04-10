import { tools } from '../tools/index.js';
import { z } from 'zod';
import { schemaDefinitions } from '../swagger.js';
// Schema for tool execution
const toolExecutionSchema = z.object({
    params: z.record(z.unknown()),
});
const toolRoutes = async (fastify, _options) => {
    // Execute a specific tool
    fastify.post('/:toolName/execute', {
        schema: {
            description: 'Execute a specific tool',
            tags: ['tools'],
            params: {
                type: 'object',
                required: ['toolName'],
                properties: {
                    toolName: {
                        type: 'string',
                        description: 'Name of the tool to execute (e.g., "mock_api")',
                    },
                },
            },
            body: schemaDefinitions.toolExecutionRequest,
            response: {
                200: schemaDefinitions.toolExecutionResponse,
                400: schemaDefinitions.errorResponse,
                404: schemaDefinitions.errorResponse,
                500: schemaDefinitions.errorResponse,
            },
        },
        handler: async (request, reply) => {
            try {
                const { toolName } = request.params;
                const body = request.body;
                // Validate request
                const validationResult = toolExecutionSchema.safeParse(body);
                if (!validationResult.success) {
                    return reply.status(400).send({
                        error: 'Invalid input',
                        details: validationResult.error.format(),
                    });
                }
                // Check if tool exists
                if (!Object.prototype.hasOwnProperty.call(tools, toolName)) {
                    return reply.status(404).send({
                        error: `Tool '${toolName}' not found`,
                    });
                }
                fastify.log.info(`Executing tool: ${toolName}`);
                // Execute the tool
                // For mock_api, ensure the required endpoint parameter exists
                if (toolName === 'mock_api' && !body.params.endpoint) {
                    return reply.status(400).send({
                        error: 'Invalid input',
                        details: 'The "endpoint" parameter is required for mock_api tool',
                    });
                }
                const result = await tools[toolName](body.params);
                fastify.log.info(`Tool ${toolName} executed successfully`);
                return reply.status(200).send({ result });
            }
            catch (error) {
                fastify.log.error(error, 'Error executing tool');
                return reply.status(500).send({
                    error: 'Internal server error',
                    message: error.message,
                });
            }
        },
    });
    // Get documentation for a specific tool
    fastify.get('/:toolName', {
        schema: {
            description: 'Get documentation for a specific tool',
            tags: ['tools'],
            params: {
                type: 'object',
                required: ['toolName'],
                properties: {
                    toolName: {
                        type: 'string',
                        description: 'Name of the tool to get documentation for',
                    },
                },
            },
            response: {
                200: schemaDefinitions.toolListItem,
                404: schemaDefinitions.errorResponse,
            },
        },
        handler: async (request, reply) => {
            const { toolName } = request.params;
            // Tool documentation (in real implementation, this would be more dynamic)
            const toolDocs = {
                mock_api: {
                    name: 'mock_api',
                    description: 'Mock API for testing tool integration',
                    parameters: {
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
            if (!toolDocs[toolName]) {
                return reply.status(404).send({
                    error: `Tool '${toolName}' not found`,
                });
            }
            return reply.status(200).send(toolDocs[toolName]);
        },
    });
};
export default toolRoutes;
