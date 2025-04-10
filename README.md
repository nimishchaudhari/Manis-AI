# Manis-Inspired Autonomous AI System

A distributed multi-agent AI system designed for complex goal-oriented task execution.

## Overview

The Manis-Inspired AI System is a modular, distributed platform that leverages multiple specialized agents orchestrated to achieve complex user-defined goals. The system follows a hierarchical structure, breaking down high-level goals into manageable tasks assigned to specialized agents.

## Key Features

- **Goal-Oriented Processing**: Submit high-level goals in natural language; the system autonomously plans and executes tasks to achieve them.
- **Orchestration**: Master Orchestrator decomposes complex goals into directed task graphs using hybrid planning (LLM + structured methods).
- **Agent Specialization**: Agents with specific capabilities (web search, code execution, data analysis) perform specialized tasks.
- **Tool Integration**: Standardized Tool Manager allows agents to access external services and APIs.
- **Memory & Context**: RAG-based memory system for historical context and knowledge retention.
- **Observability**: Comprehensive logging, tracing, and monitoring throughout the system.

## Architecture

The system follows a layered architecture:

1. **API & UI Layer**: User-facing interfaces for goal submission and status tracking
2. **Orchestration Layer**: Goal decomposition, planning, and task assignment
3. **Agent Subsystem**: Specialized agents for task execution
4. **Tool Integration & Execution Layer**: Standardized access to external tools and services
5. **Communication & Memory Layer**: Message bus and RAG-based memory system
6. **Security, Monitoring & Feedback Layer**: Observability, human feedback, security controls

## Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm (v8+)
- Docker and Docker Compose (for local development)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/example/manis-ai.git
   cd manis-ai
   ```

2. Install dependencies:
   ```
   pnpm install
   ```

3. Build the packages:
   ```
   pnpm build
   ```

4. Start the services:
   ```
   docker-compose up -d
   ```

### Development Setup

The project is organized as a monorepo using pnpm workspaces. Key packages include:

- **@acme/api-gateway**: API service (port 3000)
- **@acme/orchestrator-master**: Master Orchestrator service
- **@acme/agent-template**: Base template for agents
- **@acme/agent-echo**: Simple echo agent for testing
- **@acme/agent-websearch**: Web search agent
- **@acme/tool-manager**: Tool management service (port 3002)
- **@acme/shared-mcp**: Shared MCP schemas and types
- **@acme/shared-utils**: Common utilities, logging config

## Usage

### Submitting a Goal

```bash
curl -X POST "http://localhost:3000/v1/jobs" \
  -H "Content-Type: application/json" \
  -d '{"goal": "Analyze the impact of recent AI regulations on healthcare"}'
```

### Checking Job Status

```bash
curl -X GET "http://localhost:3000/v1/jobs/{jobId}/status"
```

### API Documentation

- API Gateway Documentation: http://localhost:3000/documentation
- Tool Manager Documentation: http://localhost:3002/documentation

## Testing

Run tests with:

```bash
pnpm test
```

For integration tests with real API calls:

```bash
RUN_REAL_API_TESTS=true pnpm test
```

## Architecture Diagram

```
+-------------------+     +-------------------+
|                   |     |                   |
|    API Gateway    |     |    UI Dashboard   |
|                   |     |                   |
+--------+----------+     +---------+---------+
         |                          |
         v                          v
+-------------------+     +-------------------+
|                   |     |                   |
| Master            |     | Status & Logs     |
| Orchestrator      |<--->| Monitoring        |
|                   |     |                   |
+--------+----------+     +---------+---------+
         |                          ^
         v                          |
+-------------------+               |
|                   |               |
| Message Bus       +--------------+
| (RabbitMQ)        |
|                   |
+--------+----------+
         |
         |
+--------v----------+     +-------------------+
|                   |     |                   |
| Agents            |<--->| Tool Manager      |
| - Web Search      |     |                   |
| - Code Execution  |     +-------------------+
| - Data Analysis   |     |                   |
|                   |<--->| RAG Service       |
+-------------------+     |                   |
                          +-------------------+
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
