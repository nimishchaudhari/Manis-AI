"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const shared_mcp_1 = require("@acme/shared-mcp");
const shared_utils_1 = require("@acme/shared-utils");
const axios_1 = __importDefault(require("axios"));
const crypto = __importStar(require("crypto"));
class HybridPlanner {
    config;
    logger;
    constructor(config) {
        this.config = {
            maxRetries: 3,
            retryDelay: 1000,
            ...config
        };
        this.logger = (0, shared_utils_1.createLogger)('hybrid-planner');
    }
    async decomposeGoal(goal, context) {
        try {
            return await (0, shared_utils_1.withRetry)(async () => {
                const response = await axios_1.default.post(`${this.config.llmServiceUrl}/decompose`, {
                    goal,
                    context,
                    constraints: [
                        'Tasks must be atomic and clearly defined',
                        'Each task must be achievable by a single agent',
                        'Tasks should be ordered by dependency'
                    ]
                }, {
                    timeout: this.config.planningTimeout,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Request-ID': crypto.randomUUID()
                    }
                });
                if (response.status !== 200) {
                    throw new Error(`Failed to decompose goal: ${response.statusText}`);
                }
                const taskAssignments = response.data.taskAssignments;
                const validationResults = taskAssignments.map(task => ({
                    task,
                    validation: shared_mcp_1.TaskAssignmentSchema.safeParse(task)
                }));
                const invalidTasks = validationResults.filter(r => !r.validation.success);
                if (invalidTasks.length > 0) {
                    const errors = invalidTasks.map(r => ({
                        task: r.task,
                        errors: r.validation.error.errors
                    }));
                    this.logger.error('Invalid task assignments received', { errors });
                    throw new Error('Invalid TaskAssignment received from LLM service');
                }
                // Ensure all tasks have taskId
                return taskAssignments.map(task => ({
                    ...task,
                    taskId: task.taskId || crypto.randomUUID()
                }));
            }, {
                maxAttempts: this.config.maxRetries,
                initialDelayMs: this.config.retryDelay,
                timeoutMs: this.config.planningTimeout,
                logger: this.logger
            });
        }
        catch (error) {
            this.logger.error('Failed to decompose goal after all retries', {
                error: error instanceof Error ? error.message : 'Unknown error',
                goal
            });
            throw error;
        }
    }
}
exports.default = HybridPlanner;
