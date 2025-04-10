import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupTestServer, teardownTestServer } from '@acme/shared-utils'
import { startServer } from '../src/server'
import fetch from 'node-fetch'

describe('API Gateway Integration Tests', () => {
  let server: Server
  let baseUrl: string

  beforeAll(async () => {
    const { server: s, port } = await startServer()
    server = s
    baseUrl = `http://localhost:${port}`
  })

  afterAll(() => server.close())

  it('should submit and track a job', async () => {
    // Test job submission
    const submitResponse = await fetch(`${baseUrl}/v1/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal: 'Analyze AI regulations impact on healthcare'
      })
    })
    
    expect(submitResponse.status).toBe(202)
    const { jobId } = await submitResponse.json()
    expect(jobId).toBeDefined()

    // Test status endpoint
    const statusResponse = await fetch(`${baseUrl}/v1/jobs/${jobId}/status`)
    expect(statusResponse.status).toBe(200)
    
    const status = await statusResponse.json()
    expect(status).toEqual({
      jobId,
      state: 'completed',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      results: expect.any(Array)
    })
  })

  it('should validate job requests', async () => {
    const response = await fetch(`${baseUrl}/v1/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalid: 'request' })
    })
    
    expect(response.status).toBe(400)
    const error = await response.json()
    expect(error).toEqual({
      code: 'VALIDATION_ERROR',
      message: expect.stringContaining('goal')
    })
  })
})