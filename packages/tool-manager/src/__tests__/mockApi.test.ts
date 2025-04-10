import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { executeMockApi } from '../tools/mockApi.js';

// Mock axios
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        request: vi.fn(),
      })),
      isAxiosError: vi.fn(),
    },
  };
});

describe('Mock API Tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully execute a GET request', async () => {
    const mockAxiosInstance = axios.create();
    mockAxiosInstance.request.mockResolvedValueOnce({
      status: 200,
      data: { id: 1, title: 'Test Data' },
    });

    const result = await executeMockApi({
      endpoint: '/posts/1',
      method: 'GET',
    });

    expect(mockAxiosInstance.request).toHaveBeenCalledWith({
      method: 'GET',
      url: '/posts/1',
    });

    expect(result).toEqual({
      status: 200,
      data: { id: 1, title: 'Test Data' },
    });
  });

  it('should successfully execute a POST request with data', async () => {
    const mockAxiosInstance = axios.create();
    mockAxiosInstance.request.mockResolvedValueOnce({
      status: 201,
      data: { id: 101, title: 'New Post', body: 'Post body', userId: 1 },
    });

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

    expect(mockAxiosInstance.request).toHaveBeenCalledWith({
      method: 'POST',
      url: '/posts',
      data: mockData,
    });

    expect(result).toEqual({
      status: 201,
      data: { id: 101, title: 'New Post', body: 'Post body', userId: 1 },
    });
  });

  it('should handle API errors', async () => {
    const mockAxiosInstance = axios.create();
    
    const mockError = new Error('Request failed');
    Object.assign(mockError, {
      response: {
        status: 404,
        data: { error: 'Not found' },
      },
    });
    
    mockAxiosInstance.request.mockRejectedValueOnce(mockError);
    axios.isAxiosError.mockReturnValueOnce(true);

    await expect(executeMockApi({
      endpoint: '/invalid/endpoint',
      method: 'GET',
    })).rejects.toThrow('Mock API request failed');
  });
});
