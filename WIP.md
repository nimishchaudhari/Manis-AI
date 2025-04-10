# Work In Progress - Manis-Inspired Autonomous AI System

This document provides a detailed overview of the project's structure, progress, and ongoing tasks.

## Project Overview

The Manis-Inspired Autonomous AI System is a complex, distributed multi-agent AI system. It leverages Node.js, TypeScript, and pnpm workspaces in a monorepo architecture. Communication between services is facilitated by the Model Context Protocol (MCP) over RabbitMQ. The system incorporates a layered architecture, hierarchical orchestration, capability-based agent discovery, RAG-based memory, and robust tool integration with sandboxing.

The primary goal is to develop the system according to the specifications outlined in the Technical Implementation Plan and the Functional Requirements/User Stories. Key architectural principles include:

*   **Technology Stack**: Node.js (latest LTS), TypeScript, pnpm workspaces (Monorepo).
*   **Structure**: Strictly follow the monorepo structure outlined in the plan (/packages/*).
*   **Communication Protocol**: Implement and rigorously use the Model Context Protocol (MCP) for all inter-service communication via the chosen Message Bus (RabbitMQ). Use the Zod schemas defined in @acme/shared-mcp for validation.
*   **Architecture**: Implement the layered architecture, including hierarchical orchestration, capability-based agent discovery, RAG-based memory, and robust tool integration with sandboxing.
*   **Observability**: Integrate comprehensive structured logging (Pino), distributed tracing (OpenTelemetry), and metrics from the beginning. Ensure proper context propagation (trace IDs, job IDs, etc.).
*   **Testing**: Implement thorough unit tests (Vitest/Jest) and integration tests (using testcontainers-node where applicable) for all components. Aim for high test coverage.
*   **Security**: Apply security best practices throughout (input validation, secrets management, non-root Docker users, least privilege).
*   **Code Quality**: Maintain clean, well-documented, and maintainable TypeScript code (ESLint, Prettier).

## Project Structure

The project follows a monorepo structure with the following packages:

*   **/api-gateway**: API service for external interactions, handles job submission and status tracking.
*   **/orchestrator-master**: Master Orchestrator service responsible for goal decomposition and task assignment.
*   **/orchestrator-sub**: (To be implemented) Template/Example for Sub-Orchestrators.
*   **/agent-template**: Base template for agents, defining the core `IAgent` interface.
*   **/agent-echo**: A simple "Echo Agent" that echoes back the input parameters as its result. This serves as a basic example agent.
*   **/agent-websearch**: Web Search Agent using Playwright and/or the Tool Manager for web-based research.
*   **/tool-manager**: Tool management service for secure external tool execution with circuit breaker patterns.
*   **/rag-service**: (To be implemented) RAG (Retrieval-Augmented Generation) service for intelligent memory and context management.
*   **/sandbox-service**: (To be implemented) Code execution sandbox service for secure code execution by agents.
*   **/shared-mcp**: Shared MCP schemas (Zod) & types for inter-service communication.
*   **/shared-utils**: Common utilities, logging configuration (Pino), custom error classes, and client libraries.
*   **/ui-dashboard**: (To be implemented) Optional frontend dashboard for monitoring and interacting with the system.

## Progress

The project is being developed iteratively, following a phased approach.

### Phase 1: Foundation & Core Communication (Completed)

*   **Goal**: Establish the core framework and communication patterns.
*   **Tasks Completed**:
    *   Monorepo setup using pnpm workspaces.
    *   Initialization of core shared packages:
        *   `@acme/shared-mcp`: Implemented Zod schemas for `TaskAssignment`, `StatusUpdate`, `CoTLog`, and `AgentCapability` messages. This package defines the contract for inter-service communication.
        *   `@acme/shared-utils`: Implemented Pino logging with context propagation, custom error classes, and a RabbitMQ client.
    *   RabbitMQ infrastructure setup using Docker Compose. Core exchanges and queues have been defined.
    *   Agent template (`@acme/agent-template`): Implemented the base `IAgent` interface and `AgentService` abstract class.
    *   Echo Agent (`@acme/agent-echo`): Created a simple agent that extends the `AgentService`, subscribes to a task queue, receives `TaskAssignment` messages, sends `StatusUpdate` and `CoTLog` messages, and echoes back the input parameters as its result.

### Phase 2: Orchestration & Agent MVP (Completed)

*   **Goal**: Implement a basic Master Orchestrator service and a more complex agent to handle goal decomposition and task assignment.
*   **Tasks Completed**:
    *   Implemented a Master Orchestrator service capable of:
        * Receiving goals and generating unique jobIds
        * Using HybridPlanner for goal decomposition
        * Creating and publishing TaskAssignment messages
        * Tracking both task and job statuses
    *   Implemented HybridPlanner for goal decomposition with:
        * Proper validation using TaskAssignmentSchema
        * Retry logic with exponential backoff
        * Comprehensive error handling and logging
    *   Implemented a hybrid Web Search Agent that supports:
        * Google Custom Search API for fast, structured search results
        * Playwright-based web scraping for more flexible, direct web interactions
    *   Ensured all components use the Model Context Protocol (MCP) for communication
    *   Implemented proper error handling, logging, and TypeScript type safety throughout
    *   Updated build process to use tsup for all packages, improving consistency and performance

### Phase 3: API & Tooling MVP (Completed)

*   **Goal**: Implement the API Gateway and Tool Manager service.
*   **Tasks Completed**:
    *   Implemented the API Gateway (@acme/api-gateway) using Fastify with:
        * POST /v1/jobs endpoint with Zod validation to trigger the Master Orchestrator
        * GET /v1/jobs/{jobId}/status endpoint for job status tracking
        * Comprehensive error handling and logging
        * OpenAPI/Swagger documentation
    *   Implemented the Tool Manager service (@acme/tool-manager) with:
        * Standardized API for tool execution
        * Basic tool registry
        * Circuit breaker pattern using Opossum for resilience
        * OpenAPI/Swagger documentation
    *   Implemented a mock API tool wrapper with:
        * Support for GET and POST requests
        * Error handling and retries
        * Structured response parsing
    *   Enhanced the Agent Template to support Tool Manager integration
    *   Created a Tool Manager client in shared-utils for agent use
    *   Updated the Echo Agent and Web Search Agent to use the Tool Manager
    *   Added integration tests for API Gateway and Tool Manager
    *   Set up GitHub Actions for CI/CD with comprehensive testing
    *   Created Docker and Kubernetes deployment files

### Phase 4: Memory MVP (To Do)

*   **Goal**: Set up the RAG Service structure and integrate a Vector Database client.
*   **Tasks**:
    *   Set up the RAG Service (@acme/rag-service) structure.
    *   Integrate a Vector Database client and implement basic connection logic.
    *   Implement a placeholder retrieval endpoint.
    *   Create a RAG client in shared-utils for agent/orchestrator use.
    *   Update agents to query RAG service for relevant context.
    *   Implement basic memory ingestion flow for storing agent results.

### Phase 5: Enhancements & Integration (To Do)

*   **Goal**: Implement more complex logic, including the Hybrid Planner, Adaptive Replanning, Agent Capability Registry, Secure Execution Sandbox, and fleshing out the RAG service.
*   **Tasks**:
    *   Implement the Hybrid Planner logic (LLM + structured planning) in the Orchestrator.
    *   Implement the Adaptive Replanning logic based on agent feedback.
    *   Develop the Agent Capability Registry and integrate discovery logic into the Orchestrator.
    *   Implement more complex agents (e.g., Web Search Agent using Playwright).
    *   Implement the Secure Execution Sandbox service.
    *   Flesh out the RAG service logic (embedding, ingestion, retrieval).
    *   Implement Sub-Orchestrators if needed for workflow complexity.
    *   Integrate robust error handling, retries, and circuit breakers (especially Tool Manager, message consumers).

### Phase 6: Testing, Observability & Deployment Prep (To Do)

*   **Goal**: Prepare the system for testing, monitoring, and deployment.
*   **Tasks**:
    *   Write comprehensive unit, integration, and E2E tests.
    *   Ensure full OpenTelemetry integration and test tracing/logging propagation.
    *   Develop Dockerfiles for all services.
    *   Create basic Kubernetes manifests (Deployment, Service).

## Key Components

*   **Model Context Protocol (MCP)**: All inter-service communication uses MCP, with Zod schemas defined in `@acme/shared-mcp` for validation.
*   **RabbitMQ**: Used as the message bus for asynchronous communication between services.
*   **Fastify**: Used for RESTful API services with OpenAPI/Swagger documentation.
*   **Circuit Breaker Pattern**: Implemented in the Tool Manager for resilient external tool execution.
*   **Pino**: Used for structured logging with context propagation (trace IDs, job IDs, etc.).
*   **TypeScript**: Used for type safety and maintainability.
*   **pnpm workspaces**: Used to manage the monorepo structure.
*   **GitHub Actions**: Used for CI/CD automation, including testing, building, and deployment.

## Configuration

Configuration (API keys, DB URLs, service addresses) is managed via environment variables (dotenv for local dev).

## Asynchronicity

Asynchronous patterns (async/await) are used effectively, especially around I/O (message bus, DBs, APIs).

## Recent Changes and Project Feasibility

The completion of Phase 3 marks a significant milestone in the project. Key changes and improvements include:

1. Implementation of the API Gateway for external interaction with the system.
2. Development of the Tool Manager service with circuit breaker patterns for resilient external tool execution.
3. Integration of agents with the Tool Manager for standardized access to external tools.
4. Enhanced documentation with OpenAPI/Swagger specifications.
5. Comprehensive CI/CD setup with GitHub Actions for automated testing and deployment.

These developments have further strengthened the foundation of the system and demonstrated the feasibility of the overall architecture. The successful integration of the API Gateway, Tool Manager, and the enhanced agents showcases the system's flexibility and potential for handling diverse tasks.

Moving forward, the project remains feasible and on track. The completed phases have validated key architectural decisions and set a solid groundwork for upcoming phases. The next step, including the implementation of the RAG Service, can build upon this established foundation.

Potential challenges to consider for upcoming phases:
1. Ensuring efficient vector database integration for the RAG Service.
2. Managing memory and retrieval latency in the RAG Service.
3. Implementing effective context propagation between agents and the RAG Service.

These challenges are manageable within the current project structure and will be addressed in the upcoming phases.

## Testing

A comprehensive testing strategy has been implemented:

1. **Unit Tests**: Testing individual components with mocked dependencies.
2. **Integration Tests**: Testing interactions between services.
3. **CI/CD Tests**: Automated testing via GitHub Actions.

Test scripts are available in the `/scripts` directory to validate system functionality.

## Next Steps

The immediate next step is to begin Phase 4: Memory MVP, which will focus on implementing the RAG Service for memory capabilities. This will involve:

1. Setting up the RAG Service structure.
2. Integrating a Vector Database client.
3. Implementing retrieval and ingestion endpoints.
4. Creating a RAG client for agent/orchestrator use.
5. Updating agents to leverage the RAG service for context-aware operations.