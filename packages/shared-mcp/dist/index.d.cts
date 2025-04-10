import { z } from 'zod';

declare const TaskAssignmentSchema: z.ZodObject<{
    jobId: z.ZodString;
    taskId: z.ZodString;
    taskType: z.ZodString;
    description: z.ZodString;
    parameters: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    jobId: string;
    taskId: string;
    taskType: string;
    description: string;
    parameters: Record<string, unknown>;
    dependencies?: string[] | undefined;
    context?: Record<string, unknown> | undefined;
}, {
    jobId: string;
    taskId: string;
    taskType: string;
    description: string;
    parameters: Record<string, unknown>;
    dependencies?: string[] | undefined;
    context?: Record<string, unknown> | undefined;
}>;
type TaskAssignment = z.infer<typeof TaskAssignmentSchema>;
declare const StatusUpdateSchema: z.ZodObject<{
    jobId: z.ZodString;
    taskId: z.ZodString;
    status: z.ZodEnum<["pending", "queued", "in-progress", "completed", "failed", "retrying"]>;
    message: z.ZodOptional<z.ZodString>;
    result: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    jobId: string;
    taskId: string;
    status: "pending" | "queued" | "in-progress" | "completed" | "failed" | "retrying";
    timestamp: string;
    message?: string | undefined;
    result?: unknown;
    error?: string | undefined;
}, {
    jobId: string;
    taskId: string;
    status: "pending" | "queued" | "in-progress" | "completed" | "failed" | "retrying";
    timestamp: string;
    message?: string | undefined;
    result?: unknown;
    error?: string | undefined;
}>;
type StatusUpdate = z.infer<typeof StatusUpdateSchema>;
declare const CoTLogSchema: z.ZodObject<{
    jobId: z.ZodString;
    taskId: z.ZodString;
    agentId: z.ZodString;
    step: z.ZodString;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    jobId: string;
    taskId: string;
    timestamp: string;
    agentId: string;
    step: string;
    details?: Record<string, unknown> | undefined;
}, {
    jobId: string;
    taskId: string;
    timestamp: string;
    agentId: string;
    step: string;
    details?: Record<string, unknown> | undefined;
}>;
type CoTLog = z.infer<typeof CoTLogSchema>;
declare const AgentCapabilitySchema: z.ZodObject<{
    agentId: z.ZodString;
    capabilities: z.ZodArray<z.ZodString, "many">;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    agentId: string;
    capabilities: string[];
}, {
    timestamp: string;
    agentId: string;
    capabilities: string[];
}>;
type AgentCapability = z.infer<typeof AgentCapabilitySchema>;
declare const MCPSchemas: {
    readonly TaskAssignment: z.ZodObject<{
        jobId: z.ZodString;
        taskId: z.ZodString;
        taskType: z.ZodString;
        description: z.ZodString;
        parameters: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        jobId: string;
        taskId: string;
        taskType: string;
        description: string;
        parameters: Record<string, unknown>;
        dependencies?: string[] | undefined;
        context?: Record<string, unknown> | undefined;
    }, {
        jobId: string;
        taskId: string;
        taskType: string;
        description: string;
        parameters: Record<string, unknown>;
        dependencies?: string[] | undefined;
        context?: Record<string, unknown> | undefined;
    }>;
    readonly StatusUpdate: z.ZodObject<{
        jobId: z.ZodString;
        taskId: z.ZodString;
        status: z.ZodEnum<["pending", "queued", "in-progress", "completed", "failed", "retrying"]>;
        message: z.ZodOptional<z.ZodString>;
        result: z.ZodOptional<z.ZodUnknown>;
        error: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        jobId: string;
        taskId: string;
        status: "pending" | "queued" | "in-progress" | "completed" | "failed" | "retrying";
        timestamp: string;
        message?: string | undefined;
        result?: unknown;
        error?: string | undefined;
    }, {
        jobId: string;
        taskId: string;
        status: "pending" | "queued" | "in-progress" | "completed" | "failed" | "retrying";
        timestamp: string;
        message?: string | undefined;
        result?: unknown;
        error?: string | undefined;
    }>;
    readonly CoTLog: z.ZodObject<{
        jobId: z.ZodString;
        taskId: z.ZodString;
        agentId: z.ZodString;
        step: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        jobId: string;
        taskId: string;
        timestamp: string;
        agentId: string;
        step: string;
        details?: Record<string, unknown> | undefined;
    }, {
        jobId: string;
        taskId: string;
        timestamp: string;
        agentId: string;
        step: string;
        details?: Record<string, unknown> | undefined;
    }>;
    readonly AgentCapability: z.ZodObject<{
        agentId: z.ZodString;
        capabilities: z.ZodArray<z.ZodString, "many">;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        agentId: string;
        capabilities: string[];
    }, {
        timestamp: string;
        agentId: string;
        capabilities: string[];
    }>;
};
type MCPMessage = {
    type: 'TaskAssignment';
    payload: TaskAssignment;
} | {
    type: 'StatusUpdate';
    payload: StatusUpdate;
} | {
    type: 'CoTLog';
    payload: CoTLog;
} | {
    type: 'AgentCapability';
    payload: AgentCapability;
};

export { type AgentCapability, AgentCapabilitySchema, type CoTLog, CoTLogSchema, type MCPMessage, MCPSchemas, type StatusUpdate, StatusUpdateSchema, type TaskAssignment, TaskAssignmentSchema };
