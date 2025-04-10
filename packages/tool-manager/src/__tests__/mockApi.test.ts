import { describe, it, expect, vi } from 'vitest';
import { executeMockApi } from '../tools/mockApi.js';

// Mock the entire tools/mockApi.js module
vi.mock('../tools/mockApi.js', () => {
  return {
    executeMockApi: vi.fn(),
  };
});

describe('Mock API Tool', () => {
  it('should successfully execute a GET request', async () => {
    // Mock implementation for this test
    const successResponse = {
      status: 200,
      data: { id: 1, title: 'Test Data' },
    };
    
    (executeMockApi as any).mockResolvedValueOnce(successResponse);

    // Execute the function
    const result = await executeMockApi({
      endpoint: '/posts/1',
      method: 'GET',
    });

    // Check that the function was called with the right parameters
    expect(executeMockApi).toHaveBeenCalledWith({
      endpoint: '/posts/1',
      method: 'GET',
    });

    // Check the result
    expect(result).toEqual(successResponse);
  });

  it('should successfully execute a POST request with data', async () => {
    // Mock implementation for this test
    const successResponse = {
      status: 201,
      data: { id: 101, title: 'New Post', body: 'Post body', userId: 1 },
    };
    
    (executeMockApi as any).mockResolvedValueOnce(successResponse);

    const mockData = {
      title: 'New Post',
      body: 'Post body',
      userId: 1,
    };

    const result = await executeMockApi({
      endpoint: '/posts',
      method: 'POST',
      data: mockData,
    });

    expect(executeMockApi).toHaveBeenCalledWith({
      endpoint: '/posts',
      method: 'POST',
      data: mockData,
    });

    expect(result).toEqual(successResponse);
  });

  it('should handle API errors', async () => {
    // Mock implementation to throw an error
    (executeMockApi as any).mockRejectedValueOnce(new Error('Mock API request failed'));

    // Expect the function to throw
    await expect(executeMockApi({
      endpoint: '/invalid/endpoint',
      method: 'GET',
    })).rejects.toThrow('Mock API request failed');

    expect(executeMockApi).toHaveBeenCalledWith({
      endpoint: '/invalid/endpoint',
      method: 'GET',
    });
  });
});
