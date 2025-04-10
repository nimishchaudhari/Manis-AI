// src/index.ts
import { z } from "zod";
var TaskAssignmentSchema = z.object({
  jobId: z.string().uuid(),
  taskId: z.string().uuid(),
  taskType: z.string(),
  description: z.string(),
  parameters: z.record(z.unknown()),
  dependencies: z.array(z.string().uuid()).optional(),
  context: z.record(z.unknown()).optional()
});
var StatusUpdateSchema = z.object({
  jobId: z.string().uuid(),
  taskId: z.string().uuid(),
  status: z.enum(["pending", "queued", "in-progress", "completed", "failed", "retrying"]),
  message: z.string().optional(),
  result: z.unknown().optional(),
  error: z.string().optional(),
  // Add error field
  timestamp: z.string().datetime()
});
var CoTLogSchema = z.object({
  jobId: z.string().uuid(),
  taskId: z.string().uuid(),
  agentId: z.string(),
  step: z.string(),
  details: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime()
});
var AgentCapabilitySchema = z.object({
  agentId: z.string(),
  capabilities: z.array(z.string()),
  timestamp: z.string().datetime()
});
var MCPSchemas = {
  TaskAssignment: TaskAssignmentSchema,
  StatusUpdate: StatusUpdateSchema,
  CoTLog: CoTLogSchema,
  AgentCapability: AgentCapabilitySchema
};
export {
  AgentCapabilitySchema,
  CoTLogSchema,
  MCPSchemas,
  StatusUpdateSchema,
  TaskAssignmentSchema
};
//# sourceMappingURL=index.js.map