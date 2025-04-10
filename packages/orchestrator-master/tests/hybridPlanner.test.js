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
const vitest_1 = require("vitest");
const axios_1 = __importStar(require("axios"));
const hybridPlanner_1 = __importDefault(require("../src/hybridPlanner"));
vitest_1.vi.mock('axios');
(0, vitest_1.describe)('HybridPlanner', () => {
    const llmServiceUrl = 'http://mock-llm-service.com';
    const planningTimeout = 10000;
    let hybridPlanner;
    let config;
    (0, vitest_1.beforeEach)(() => {
        config = { llmServiceUrl, planningTimeout };
        hybridPlanner = new hybridPlanner_1.default(config);
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('should create HybridPlanner instance with correct configuration', () => {
        (0, vitest_1.expect)(hybridPlanner).toBeInstanceOf(hybridPlanner_1.default);
        (0, vitest_1.expect)(hybridPlanner['config'].llmServiceUrl).toBe(llmServiceUrl);
        (0, vitest_1.expect)(hybridPlanner['config'].planningTimeout).toBe(planningTimeout);
    });
    (0, vitest_1.it)('should decompose goal successfully', async () => {
        const goal = 'Test goal';
        const taskAssignments = [
            {
                jobId: '123e4567-e89b-12d3-a456-426614174000',
                taskId: '123e4567-e89b-12d3-a456-426614174001',
                taskType: 'test',
                description: 'Test task',
                parameters: {},
            },
        ];
        vitest_1.vi.mocked(axios_1.default.post).mockResolvedValueOnce({
            status: 200,
            data: { taskAssignments },
        });
        const result = await hybridPlanner.decomposeGoal(goal);
        (0, vitest_1.expect)(result).toEqual(taskAssignments);
        (0, vitest_1.expect)(axios_1.default.post).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(axios_1.default.post).toHaveBeenCalledWith(`${llmServiceUrl}/decompose`, { goal }, { timeout: planningTimeout });
    });
    (0, vitest_1.it)('should throw error on non-200 response from LLM service', async () => {
        const goal = 'Test goal';
        vitest_1.vi.mocked(axios_1.default.post).mockResolvedValueOnce({
            status: 400,
            statusText: 'Bad Request',
        });
        await (0, vitest_1.expect)(hybridPlanner.decomposeGoal(goal)).rejects.toThrow('Failed to decompose goal: Bad Request');
    });
    (0, vitest_1.it)('should throw error on invalid TaskAssignment received', async () => {
        const goal = 'Test goal';
        const taskAssignments = [{ invalid: 'task' }];
        vitest_1.vi.mocked(axios_1.default.post).mockResolvedValueOnce({
            status: 200,
            data: { taskAssignments },
        });
        await (0, vitest_1.expect)(hybridPlanner.decomposeGoal(goal)).rejects.toThrow('Invalid TaskAssignment received from LLM service');
    });
    (0, vitest_1.it)('should handle axios error', async () => {
        const goal = 'Test goal';
        const errorMessage = 'Network Error';
        vitest_1.vi.mocked(axios_1.default.post).mockRejectedValueOnce(new axios_1.AxiosError(errorMessage));
        await (0, vitest_1.expect)(hybridPlanner.decomposeGoal(goal)).rejects.toThrow(`Error decomposing goal: ${errorMessage}`);
    });
    (0, vitest_1.it)('should handle non-axios error', async () => {
        const goal = 'Test goal';
        const error = new Error('Unexpected error');
        vitest_1.vi.mocked(axios_1.default.post).mockRejectedValueOnce(error);
        await (0, vitest_1.expect)(hybridPlanner.decomposeGoal(goal)).rejects.toThrow(error);
    });
});
