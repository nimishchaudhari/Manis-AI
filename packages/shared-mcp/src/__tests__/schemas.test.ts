import { describe, it, expect } from 'vitest';
import { 
  TaskAssignmentSchema, 
  StatusUpdateSchema, 
  CoTLogSchema, 
  AgentCapabilitySchema 
} from '../index';

describe('MCP Schemas', () => {
  describe('TaskAssignmentSchema', () => {
    it('should validate valid task assignment data', () => {
      const validData = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        taskId: '123e4567-e89b-12d3-a456-426614174001',
        taskType: 'web_search',
        description: 'Search for information about AI',
        parameters: { query: 'AI regulations' },
      };
      
      const result = TaskAssignmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid task assignment data', () => {
      const invalidData = {
        // Missing required fields
        taskType: 'web_search',
        description: 'Search for information about AI',
      };
      
      const result = TaskAssignmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('StatusUpdateSchema', () => {
    it('should validate valid status update data', () => {
      const validData = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        taskId: '123e4567-e89b-12d3-a456-426614174001',
        status: 'in-progress',
        timestamp: new Date().toISOString(),
      };
      
      const result = StatusUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status update data', () => {
      const invalidData = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        taskId: '123e4567-e89b-12d3-a456-426614174001',
        status: 'unknown-status', // Invalid status
        timestamp: new Date().toISOString(),
      };
      
      const result = StatusUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('CoTLogSchema', () => {
    it('should validate valid CoT log data', () => {
      const validData = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        taskId: '123e4567-e89b-12d3-a456-426614174001',
        agentId: 'web-search-agent',
        step: 'Searching Google',
        timestamp: new Date().toISOString(),
      };
      
      const result = CoTLogSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('AgentCapabilitySchema', () => {
    it('should validate valid agent capability data', () => {
      const validData = {
        agentId: 'web-search-agent',
        capabilities: ['web_search', 'scraping'],
        timestamp: new Date().toISOString(),
      };
      
      const result = AgentCapabilitySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
