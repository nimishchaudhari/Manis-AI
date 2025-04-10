# Development Guide

## Development Environment Setup

### Prerequisites

1. **Node.js (Latest LTS)**
   ```bash
   # Windows (using chocolatey)
   choco install nodejs-lts
   
   # macOS (using homebrew)
   brew install node
   
   # Linux
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **pnpm**
   ```bash
   npm install -g pnpm
   ```

3. **Docker and Docker Compose**
   - [Docker Desktop](https://www.docker.com/products/docker-desktop) (Windows/macOS)
   - [Docker Engine](https://docs.docker.com/engine/install/) (Linux)

### Project Setup

1. **Clone and Install Dependencies**
   ```bash
   git clone https://github.com/yourusername/manis-ai.git
   cd manis-ai
   pnpm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Dependencies**
   ```bash
   docker-compose up -d
   ```

## Development Workflow

### Building the Project

```bash
# Build all packages
pnpm run build

# Build specific package
pnpm run build --filter @acme/package-name
```

### Development Mode

```bash
# Start all services in development mode
pnpm run dev

# Start specific service
pnpm run dev --filter @acme/package-name
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm test --filter @acme/package-name

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Linting and Formatting

```bash
# Lint all files
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format
```

## Project Structure Guidelines

### Package Organization

1. **Service Packages**
   - Each service should be a separate package
   - Use the naming convention `@acme/service-name`
   - Include service-specific tests and config

2. **Shared Packages**
   - Common code goes in shared packages
   - Use clear naming for shared packages
   - Document exported functionality

### Code Organization

```
packages/service-name/
├── src/
│   ├── index.ts              # Main entry point
│   ├── types/               # TypeScript types
│   ├── services/            # Service implementations
│   ├── controllers/         # Route controllers
│   └── utils/              # Utility functions
├── tests/
│   ├── unit/
│   └── integration/
├── package.json
└── tsconfig.json
```

## Coding Standards

### TypeScript Guidelines

1. **Type Safety**
   - Enable strict mode in TypeScript
   - Avoid using `any`
   - Use interfaces for object shapes
   - Document complex types

2. **Async Code**
   - Use async/await over promises
   - Handle errors properly
   - Implement proper cancellation

3. **Error Handling**
   - Use custom error classes
   - Include proper error context
   - Document error conditions

### Testing Guidelines

1. **Unit Tests**
   - Test individual components
   - Use proper mocking
   - Follow AAA pattern (Arrange-Act-Assert)

2. **Integration Tests**
   - Test component interactions
   - Use test containers when needed
   - Clean up test resources

3. **E2E Tests**
   - Test complete workflows
   - Use realistic test data
   - Document test scenarios

### Documentation Guidelines

1. **Code Documentation**
   - Document public APIs
   - Include usage examples
   - Explain complex logic

2. **README Files**
   - Include package description
   - Document setup process
   - List dependencies
   - Provide usage examples

## Debugging

### Local Debugging

1. **VS Code Configuration**
   ```json
   {
     "type": "node",
     "request": "launch",
     "name": "Debug Service",
     "program": "${workspaceFolder}/packages/service-name/src/index.ts",
     "preLaunchTask": "tsc: build - tsconfig.json",
     "outFiles": ["${workspaceFolder}/dist/**/*.js"]
   }
   ```

2. **Debug Logs**
   - Set LOG_LEVEL=debug in .env
   - Use debug npm package
   - Enable source maps

### Troubleshooting

1. **Common Issues**
   - Port conflicts
   - Environment variables
   - Dependencies issues

2. **Logging**
   - Check service logs
   - Use proper log levels
   - Include context in logs

## Deployment

### Local Development

```bash
# Build Docker images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Production Deployment

1. **Build Process**
   ```bash
   # Build production assets
   pnpm run build:prod
   
   # Build Docker images
   docker build -t service-name .
   ```

2. **Configuration**
   - Use environment variables
   - Protect sensitive data
   - Configure proper logging

3. **Monitoring**
   - Set up health checks
   - Configure metrics
   - Set up alerts

## Contributing

1. **Branch Strategy**
   - Use feature branches
   - Follow conventional commits
   - Keep changes focused

2. **Pull Requests**
   - Include tests
   - Update documentation
   - Follow code standards

3. **Code Review**
   - Review guidelines
   - Testing requirements
   - Documentation updates

## Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Docker Documentation](https://docs.docker.com/)
- [pnpm Documentation](https://pnpm.io/documentation)