import { executeMockApi } from './mockApi.js';

// Export all tool implementations
export const tools = {
  mock_api: executeMockApi,
};

// Type for supported tool names
export type ToolName = keyof typeof tools;
