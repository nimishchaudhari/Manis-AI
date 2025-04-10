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

*   **/api-gateway**: (To be implemented) API service for external interactions.
*   **/orchestrator-master**: (To be implemented) Master Orchestrator service responsible for goal decomposition and task assignment.
*   **/orchestrator-sub**: (To be implemented) Template/Example for Sub-Orchestrators.
*   **/agent-template**: Base template for agents, defining the core `IAgent` interface.
*   **/agent-echo**: A simple "Echo Agent" that echoes back the input parameters as its result. This serves as a basic example agent.
*   **/agent-websearch**: (To be implemented) Example Web Search Agent using Playwright or Puppeteer.
*   **/tool-manager**: (To be implemented) Tool management service for secure external tool execution.
*   **/rag-service**: (To be implemented) RAG (Retrieval-Augmented Generation) service for intelligent memory and context management.
*   **/sandbox-service**: (To be implemented) Code execution sandbox service for secure code execution by agents.
*   **/shared-mcp**: Shared MCP schemas (Zod) & types for inter-service communication.
*   **/shared-utils**: Common utilities, logging configuration (Pino), and custom error classes.
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

### Phase 3: API & Tooling MVP (To Do)

*   **Goal**: Implement the API Gateway and Tool Manager service.
*   **Tasks**:
    *   Implement the API Gateway (@acme/api-gateway) using Fastify. Include the POST /v1/jobs endpoint (with Zod validation) to trigger the Master Orchestrator and a basic GET /v1/jobs/{jobId}/status endpoint.
    *   Implement the Tool Manager service (@acme/tool-manager) with a basic API structure.
    *   Implement one simple tool wrapper (e.g., a mock external API) with basic error handling.

### Phase 4: Memory MVP (To Do)

*   **Goal**: Set up the RAG Service structure and integrate a Vector Database client.
*   **Tasks**:
    *   Set up the RAG Service (@acme/rag-service) structure.
    *   Integrate a Vector Database client and implement basic connection logic.
    *   Implement a placeholder retrieval endpoint.

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
*   **Pino**: Used for structured logging with context propagation (trace IDs, job IDs, etc.).
*   **TypeScript**: Used for type safety and maintainability.
*   **pnpm workspaces**: Used to manage the monorepo structure.

## Configuration

Configuration (API keys, DB URLs, service addresses) is managed via environment variables (dotenv for local dev).

## Asynchronicity

Asynchronous patterns (async/await) are used effectively, especially around I/O (message bus, DBs, APIs).

## Recent Changes and Project Feasibility

The completion of Phase 2 marks a significant milestone in the project. Key changes and improvements include:

1. Successful implementation of the Master Orchestrator, HybridPlanner, and WebSearchAgent.
2. Enhanced error handling, logging, and type safety across all components.
3. Standardization of the build process using tsup for all packages.
4. Thorough integration of the Model Context Protocol (MCP) for inter-service communication.

These developments have strengthened the foundation of the system and demonstrated the feasibility of the overall architecture. The successful integration of complex components like the HybridPlanner and the dual-mode WebSearchAgent (using both Google Custom Search API and Playwright) showcases the system's flexibility and potential for handling diverse tasks.

Moving forward, the project remains feasible and on track. The completed phases have validated key architectural decisions and set a solid groundwork for upcoming phases. The next steps, including the implementation of the API Gateway, Tool Manager, and RAG Service, can build upon this established foundation.

Potential challenges to consider for upcoming phases:
1. Ensuring scalability of the orchestration system as more complex agents are added.
2. Managing potential latency issues in distributed task execution.
3. Implementing robust security measures, especially for the Secure Execution Sandbox.

These challenges are manageable within the current project structure and will be addressed in the upcoming phases.