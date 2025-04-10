import { TaskAssignmentSchema, type TaskAssignment } from '@acme/shared-mcp';
import { Logger, createLogger, withRetry } from '@acme/shared-utils';
import axios, { AxiosError } from 'axios';
import * as crypto from 'crypto';

export interface HybridPlannerConfig {
  llmServiceUrl: string;
  planningTimeout: number;
  maxRetries?: number;
  retryDelay?: number;
}

class HybridPlanner {
  private config: HybridPlannerConfig;
  private logger: Logger;

  constructor(config: HybridPlannerConfig) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };
    this.logger = createLogger('hybrid-planner');
  }

  async decomposeGoal(goal: string, context?: Record<string, unknown>): Promise<TaskAssignment[]> {
    try {
      return await withRetry(
        async () => {
          const response = await axios.post(
            `${this.config.llmServiceUrl}/decompose`,
            {
              goal,
              context,
              constraints: [
                'Tasks must be atomic and clearly defined',
                'Each task must be achievable by a single agent',
                'Tasks should be ordered by dependency'
              ]
            },
            {
              timeout: this.config.planningTimeout,
              headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': crypto.randomUUID()
              }
            }
          );

          if (response.status !== 200) {
            throw new Error(`Failed to decompose goal: ${response.statusText}`);
          }

          const taskAssignments: TaskAssignment[] = response.data.taskAssignments;
          const validationResults = taskAssignments.map(task => ({
            task,
            validation: TaskAssignmentSchema.safeParse(task)
          }));

          const invalidTasks = validationResults.filter(r => !r.validation.success);
          if (invalidTasks.length > 0) {
            const errors = invalidTasks.map(r => ({
              task: r.task,
              errors: (r.validation as any).error.errors
            }));
            
            this.logger.error('Invalid task assignments received', { errors });
            throw new Error('Invalid TaskAssignment received from LLM service');
          }

          // Ensure all tasks have taskId
          return taskAssignments.map(task => ({
            ...task,
            taskId: task.taskId || crypto.randomUUID()
          }));
        },
        {
          maxAttempts: this.config.maxRetries,
          initialDelayMs: this.config.retryDelay,
          timeoutMs: this.config.planningTimeout,
          logger: this.logger
        }
      );
    } catch (error) {
      this.logger.error('Failed to decompose goal after all retries', {
        error: error instanceof Error ? error.message : 'Unknown error',
        goal
      });
      throw error;
    }
  }
}

export default HybridPlanner;