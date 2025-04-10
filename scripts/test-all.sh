#!/bin/bash
# Comprehensive test script for Manis AI system

set -e  # Exit on error

echo "🧪 Starting Manis AI System Tests"
echo "=================================="

# Build all packages
echo "📦 Building all packages..."
pnpm build

# Lint check
echo "🔍 Running lint checks..."
pnpm lint

# Unit tests
echo "🧪 Running unit tests..."
RUN_REAL_API_TESTS=false pnpm test

# Start services for integration tests
echo "🚀 Starting services for integration tests..."
echo "Starting RabbitMQ..."
docker-compose up -d rabbitmq
sleep 10  # Wait for RabbitMQ to start

# Start API Gateway
echo "Starting API Gateway in background..."
cd packages/api-gateway
PORT=3000 RABBITMQ_URL=amqp://guest:guest@localhost:5672 node dist/index.js &
API_PID=$!
cd ../..

# Start Tool Manager
echo "Starting Tool Manager in background..."
cd packages/tool-manager
PORT=3002 node dist/index.js &
TOOL_PID=$!
cd ../..

# Wait for services to start
echo "Waiting for services to start..."
sleep 5

# Test API Gateway health
echo "Testing API Gateway health..."
curl -s http://localhost:3000/health | grep "ok" || { echo "❌ API Gateway health check failed"; exit 1; }
echo "✅ API Gateway health check passed"

# Test Tool Manager health
echo "Testing Tool Manager health..."
curl -s http://localhost:3002/health | grep "ok" || { echo "❌ Tool Manager health check failed"; exit 1; }
echo "✅ Tool Manager health check passed"

# Test submitting a job
echo "Testing job submission..."
JOB_RESPONSE=$(curl -s -X POST "http://localhost:3000/v1/jobs" \
  -H "Content-Type: application/json" \
  -d '{"goal": "Analyze the impact of recent AI regulations on healthcare"}')

echo "Job submission response: $JOB_RESPONSE"
JOB_ID=$(echo $JOB_RESPONSE | grep -o '"jobId":"[^"]*"' | sed 's/"jobId":"//;s/"//g')

if [ -z "$JOB_ID" ]; then
  echo "❌ Job submission failed or jobId not found"
  exit 1
fi

echo "✅ Job submitted successfully with ID: $JOB_ID"

# Test checking job status
echo "Testing job status..."
JOB_STATUS=$(curl -s -X GET "http://localhost:3000/v1/jobs/$JOB_ID/status")
echo "Job status response: $JOB_STATUS"

if [[ $JOB_STATUS != *"status"* ]]; then
  echo "❌ Job status check failed"
  exit 1
fi

echo "✅ Job status check passed"

# Test Tool Manager execution
echo "Testing Tool Manager execution..."
TOOL_RESPONSE=$(curl -s -X POST "http://localhost:3002/v1/tools/mock_api/execute" \
  -H "Content-Type: application/json" \
  -d '{"params": {"endpoint": "/posts/1", "method": "GET"}}')

echo "Tool execution response: $TOOL_RESPONSE"

if [[ $TOOL_RESPONSE != *"result"* ]]; then
  echo "❌ Tool execution failed"
  exit 1
fi

echo "✅ Tool execution passed"

# Cleanup
echo "Cleaning up..."
kill $API_PID || true
kill $TOOL_PID || true
docker-compose down

echo "✅ All tests completed successfully!"
