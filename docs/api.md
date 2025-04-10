# API Documentation

## Overview

This document details the API endpoints and interfaces for the Manis-Inspired Autonomous AI System. The API Gateway serves as the primary entry point for external interactions with the system.

## Base URL

```
http://localhost:3000/v1
```

## Authentication

All API endpoints require authentication using Bearer tokens:

```http
Authorization: Bearer your-api-token
```

## Endpoints

### Jobs

#### Create Job

Creates a new job in the system.

```http
POST /jobs
```

**Request Body:**
```typescript
{
  "goal": string;           // The goal to accomplish
  "priority"?: number;      // Optional priority (1-5, default: 3)
  "context"?: {            // Optional context
    [key: string]: any
  };
  "constraints"?: {        // Optional constraints
    "maxDuration"?: number;
    "maxCost"?: number;
    "allowedTools"?: string[];
  }
}
```

**Response:**
```typescript
{
  "jobId": string;         // Unique job identifier
  "status": "queued";
  "createdAt": string;     // ISO timestamp
}
```

#### Get Job Status

Retrieves the current status of a job.

```http
GET /jobs/{jobId}/status
```

**Response:**
```typescript
{
  "jobId": string;
  "status": "queued" | "in-progress" | "completed" | "failed";
  "progress"?: number;     // 0-100
  "result"?: any;         // Present if completed
  "error"?: string;       // Present if failed
  "logs": Array<{         // Chain-of-thought logs
    "timestamp": string;
    "level": string;
    "message": string;
    "metadata"?: any;
  }>;
}
```

#### List Jobs

Lists all jobs with optional filtering.

```http
GET /jobs
```

**Query Parameters:**
- `status`: Filter by status
- `from`: Start date (ISO format)
- `to`: End date (ISO format)
- `limit`: Max number of results (default: 20)
- `offset`: Pagination offset

**Response:**
```typescript
{
  "jobs": Array<{
    "jobId": string;
    "status": string;
    "goal": string;
    "createdAt": string;
    "updatedAt": string;
  }>;
  "total": number;
  "limit": number;
  "offset": number;
}
```

### Agents

#### List Agent Capabilities

Lists available agent capabilities.

```http
GET /agents/capabilities
```

**Response:**
```typescript
{
  "capabilities": Array<{
    "id": string;
    "name": string;
    "description": string;
    "parameters": {
      [key: string]: {
        "type": string;
        "required": boolean;
        "description": string;
      }
    };
  }>;
}
```

### Tools

#### List Available Tools

Lists tools available for use.

```http
GET /tools
```

**Response:**
```typescript
{
  "tools": Array<{
    "id": string;
    "name": string;
    "description": string;
    "capabilities": string[];
    "schema": {
      "input": object;    // JSON Schema
      "output": object;   // JSON Schema
    };
  }>;
}
```

## WebSocket API

Real-time updates are available via WebSocket connection.

```
ws://localhost:3000/v1/ws
```

### Message Types

#### Job Updates
```typescript
{
  "type": "job_update";
  "jobId": string;
  "status": string;
  "timestamp": string;
  "data": any;
}
```

#### System Events
```typescript
{
  "type": "system_event";
  "event": string;
  "timestamp": string;
  "data": any;
}
```

## Error Handling

### Error Response Format
```typescript
{
  "error": {
    "code": string;
    "message": string;
    "details"?: any;
  }
}
```

### Common Error Codes

- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## Rate Limiting

API endpoints are rate-limited based on the authentication token:

- 100 requests per minute for standard tokens
- 1000 requests per minute for premium tokens

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1628781600
```

## Versioning

The API is versioned through the URL path (/v1/). Breaking changes will result in a new version number.