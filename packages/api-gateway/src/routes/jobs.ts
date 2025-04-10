import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

// Schema for job submission
const goalSchema = z.object({
  goal: z.string().min(10, { message: "Goal must be at least 10 characters" }),
});

// Type for goal submission
type GoalSubmission = z.infer<typeof goalSchema>;

const jobRoutes: FastifyPluginAsync = async (fastify, options) => {
  // POST /v1/jobs - Submit a new job
  fastify.post('/', {
    schema: {
      description: 'Submit a new job with a high-level goal',
      tags: ['jobs'],
      body: {
        type: 'object',
        required: ['goal'],
        properties: {
          goal: { type: 'string', minLength: 10 },
        },
      },
      response: {
        202: {
          description: 'Job accepted',
          type: 'object',
          properties: {
            jobId: { type: 'string', format: 'uuid' },
          },
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'object' },
          },
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const body = request.body as GoalSubmission;
        const validationResult = goalSchema.safeParse(body);

        if (!validationResult.success) {
          return reply.status(400).send({
            error: 'Invalid input',
            details: validationResult.error.format(),
          });
        }

        const { goal } = validationResult.data;
        const jobId = await fastify.orchestrator.processUserGoal(goal);

        return reply.status(202).send({ jobId });
      } catch (error: any) {
        fastify.log.error(error, 'Error processing goal');
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  });

  // GET /v1/jobs/:jobId/status - Get job status
  fastify.get('/:jobId/status', {
    schema: {
      description: 'Get the status of a specific job',
      tags: ['jobs'],
      params: {
        type: 'object',
        required: ['jobId'],
        properties: {
          jobId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          description: 'Job status',
          type: 'object',
          properties: {
            jobId: { type: 'string', format: 'uuid' },
            goal: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'in-progress', 'completed', 'failed'] },
            timestamp: { type: 'string', format: 'date-time' },
            error: { type: 'string', nullable: true },
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  taskId: { type: 'string', format: 'uuid' },
                  status: { type: 'string', enum: ['pending', 'queued', 'in-progress', 'completed', 'failed', 'retrying'] },
                  message: { type: 'string', nullable: true },
                  result: { type: 'object', nullable: true },
                  error: { type: 'string', nullable: true },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        404: {
          description: 'Job not found',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const { jobId } = request.params as { jobId: string };
        const jobStatus = fastify.orchestrator.getJobStatus(jobId);

        if (!jobStatus) {
          return reply.status(404).send({ error: 'Job not found' });
        }

        return reply.status(200).send(jobStatus);
      } catch (error: any) {
        fastify.log.error(error, `Error getting job status for jobId: ${(request.params as any).jobId}`);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  });
};

export default jobRoutes;
