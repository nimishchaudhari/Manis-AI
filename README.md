# Manis-Inspired Autonomous AI System

A distributed multi-agent AI system implementing hierarchical orchestration and capability-based agent discovery using the Model Context Protocol (MCP).

## 🎯 Project Overview

This project implements a sophisticated multi-agent AI system using Node.js, TypeScript, and pnpm workspaces in a monorepo structure. The system utilizes the Model Context Protocol (MCP) for inter-service communication via RabbitMQ, featuring:

- Hierarchical orchestration with master and sub-orchestrators
- Capability-based agent discovery
- RAG-based memory management
- Secure tool integration with sandboxing
- Comprehensive observability and logging

## 📊 Current Status

The project is being developed in phases. Currently completed:

### ✅ Phase 1 - Foundation & Core Communication
- Monorepo structure setup
- Core shared packages implementation
- RabbitMQ infrastructure setup
- Base agent template
- Echo agent implementation

### ✅ Phase 2 - Orchestration & Agent MVP
- Master Orchestrator service implementation
- HybridPlanner for goal decomposition
- Web Search Agent with dual-mode capability
- Comprehensive MCP integration
- Enhanced build process using tsup

For detailed progress and upcoming phases, see [WIP.md](WIP.md).

## 🏗 Project Structure

```
/packages/
    /api-gateway/       # API service for external interactions
    /orchestrator-master/ # Master Orchestrator service
    /orchestrator-sub/  # Template for Sub-Orchestrators
    /agent-template/    # Base template for agents
    /agent-echo/       # Example Echo Agent
    /agent-websearch/   # Web Search Agent
    /tool-manager/      # Tool management service
    /rag-service/       # RAG service
    /sandbox-service/   # Code execution sandbox
    /shared-mcp/        # Shared MCP schemas & types
    /shared-utils/      # Common utilities
    /ui-dashboard/      # Frontend dashboard
/docker/               # Dockerfiles
/infra/               # K8s manifests, IaC
```

## 🚀 Getting Started

### Prerequisites

- Node.js (Latest LTS)
- pnpm
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/manis-ai.git
cd manis-ai
```

2. Install dependencies:
```bash
pnpm install
```

3. Start RabbitMQ:
```bash
docker-compose up -d
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Development

1. Build all packages:
```bash
pnpm run build
```

2. Start development mode:
```bash
pnpm run dev
```

3. Run tests:
```bash
pnpm test
```

## 🔧 Architecture

### Core Components

- **Model Context Protocol (MCP)**: Standardized communication protocol implemented via Zod schemas
- **Master Orchestrator**: Handles goal decomposition and task assignment
- **Agents**: Autonomous components that execute specific tasks
- **Tool Manager**: Manages secure external tool execution
- **RAG Service**: Handles memory and context management

### Communication Flow

1. External requests → API Gateway
2. API Gateway → Master Orchestrator
3. Master Orchestrator → Appropriate Agents
4. Agents ↔ Tool Manager for external tool access
5. All components ↔ RAG Service for context/memory

## 🛠 Technical Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Package Management**: pnpm workspaces
- **Message Bus**: RabbitMQ
- **Logging**: Pino
- **Testing**: Vitest/Jest
- **Build**: tsup
- **Containerization**: Docker
- **Orchestration**: Kubernetes

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

Please ensure your PR:
- Follows the existing code style
- Includes appropriate tests
- Updates relevant documentation
- Has a clear description of changes

## 🔒 Security

The system implements several security measures:
- Secure sandboxing for code execution
- Input validation using Zod schemas
- Least privilege principle in Docker containers
- Secrets management via environment variables

## 📖 Documentation

- [WIP.md](WIP.md) - Detailed progress and implementation details
- [API Documentation](docs/api.md) - API endpoints and usage
- [Architecture](docs/architecture.md) - Detailed system architecture
- [Development Guide](docs/development.md) - Development workflow

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Acknowledgments

- Inspired by the Manis architecture
- Built with open-source technologies