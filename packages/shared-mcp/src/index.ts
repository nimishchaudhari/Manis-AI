import { z } from 'zod';

// Schema for task assignment messages
export const TaskAssignmentSchema = z.object({
  jobId: z.string().uuid(),
  taskId: z.string().uuid(),
  taskType: z.string(),
  description: z.string(),
  parameters: z.record(z.unknown()),
  dependencies: z.array(z.string().uuid()).optional(),
  context: z.record(z.unknown()).optional(),
});

export type TaskAssignment = z.infer<typeof TaskAssignmentSchema>;

// Schema for status updates
export const StatusUpdateSchema = z.object({
  jobId: z.string().uuid(),
  taskId: z.string().uuid(),
  status: z.enum(['pending', 'queued', 'in-progress', 'completed', 'failed', 'retrying']),
  message: z.string().optional(),
  result: z.unknown().optional(),
  error: z.string().optional(), // Add error field
  timestamp: z.string().datetime(),
});

export type StatusUpdate = z.infer<typeof StatusUpdateSchema>;

// Schema for chain-of-thought logs
export const CoTLogSchema = z.object({
  jobId: z.string().uuid(),
  taskId: z.string().uuid(),
  agentId: z.string(),
  step: z.string(),
  details: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime(),
});

export type CoTLog = z.infer<typeof CoTLogSchema>;

// Schema for Agent Capability Registration
export const AgentCapabilitySchema = z.object({
  agentId: z.string(),
  capabilities: z.array(z.string()),
  timestamp: z.string().datetime(),
});

export type AgentCapability = z.infer<typeof AgentCapabilitySchema>;

// Export all schemas and types
export const MCPSchemas = {
  TaskAssignment: TaskAssignmentSchema,
  StatusUpdate: StatusUpdateSchema,
  CoTLog: CoTLogSchema,
  AgentCapability: AgentCapabilitySchema,
} as const;

// Utility type for all MCP message types
export type MCPMessage = 
  | { type: 'TaskAssignment'; payload: TaskAssignment }
  | { type: 'StatusUpdate'; payload: StatusUpdate }
  | { type: 'CoTLog'; payload: CoTLog }
  | { type: 'AgentCapability'; payload: AgentCapability };