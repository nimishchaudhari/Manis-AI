"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AgentCapabilitySchema: () => AgentCapabilitySchema,
  CoTLogSchema: () => CoTLogSchema,
  MCPSchemas: () => MCPSchemas,
  StatusUpdateSchema: () => StatusUpdateSchema,
  TaskAssignmentSchema: () => TaskAssignmentSchema
});
module.exports = __toCommonJS(index_exports);
var import_zod = require("zod");
var TaskAssignmentSchema = import_zod.z.object({
  jobId: import_zod.z.string().uuid(),
  taskId: import_zod.z.string().uuid(),
  taskType: import_zod.z.string(),
  description: import_zod.z.string(),
  parameters: import_zod.z.record(import_zod.z.unknown()),
  dependencies: import_zod.z.array(import_zod.z.string().uuid()).optional(),
  context: import_zod.z.record(import_zod.z.unknown()).optional()
});
var StatusUpdateSchema = import_zod.z.object({
  jobId: import_zod.z.string().uuid(),
  taskId: import_zod.z.string().uuid(),
  status: import_zod.z.enum(["pending", "queued", "in-progress", "completed", "failed", "retrying"]),
  message: import_zod.z.string().optional(),
  result: import_zod.z.unknown().optional(),
  error: import_zod.z.string().optional(),
  // Add error field
  timestamp: import_zod.z.string().datetime()
});
var CoTLogSchema = import_zod.z.object({
  jobId: import_zod.z.string().uuid(),
  taskId: import_zod.z.string().uuid(),
  agentId: import_zod.z.string(),
  step: import_zod.z.string(),
  details: import_zod.z.record(import_zod.z.unknown()).optional(),
  timestamp: import_zod.z.string().datetime()
});
var AgentCapabilitySchema = import_zod.z.object({
  agentId: import_zod.z.string(),
  capabilities: import_zod.z.array(import_zod.z.string()),
  timestamp: import_zod.z.string().datetime()
});
var MCPSchemas = {
  TaskAssignment: TaskAssignmentSchema,
  StatusUpdate: StatusUpdateSchema,
  CoTLog: CoTLogSchema,
  AgentCapability: AgentCapabilitySchema
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AgentCapabilitySchema,
  CoTLogSchema,
  MCPSchemas,
  StatusUpdateSchema,
  TaskAssignmentSchema
});
//# sourceMappingURL=index.cjs.map