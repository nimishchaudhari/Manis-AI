import { vi } from 'vitest';

const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockProcessUserGoal = vi.fn().mockImplementation(() => {
  return Promise.resolve('mock-job-id');
});
const mockGetJobStatus = vi.fn().mockImplementation((jobId) => {
  return {
    jobId,
    goal: 'Mock goal',
    status: 'in-progress',
    timestamp: new Date().toISOString(),
    tasks: []
  };
});

class MasterOrchestrator {
  constructor(config) {
    this.config = config;
  }

  connect = mockConnect;
  processUserGoal = mockProcessUserGoal;
  getJobStatus = mockGetJobStatus;
}

export { MasterOrchestrator };
export default MasterOrchestrator;
