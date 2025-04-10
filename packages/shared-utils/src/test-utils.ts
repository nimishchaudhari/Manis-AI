import type { Server } from 'http'
import fetch from 'node-fetch'

export const setupTestServer = async (startFn: () => Promise<Server>) => {
  const server = await startFn()
  const port = (server.address() as any).port
  const baseUrl = `http://localhost:${port}`
  
  return {
    server,
    baseUrl,
    fetch: (path: string, init?: RequestInit) => fetch(`${baseUrl}${path}`, init)
  }
}

export const teardownTestServer = (server: Server) => {
  return new Promise((resolve) => server.close(resolve))
}