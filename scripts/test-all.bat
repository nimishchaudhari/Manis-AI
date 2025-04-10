@echo off
REM Comprehensive test script for Manis AI system on Windows

echo 🧪 Starting Manis AI System Tests
echo ==================================

REM Build all packages
echo 📦 Building all packages...
call pnpm build
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Build failed
  exit /b %ERRORLEVEL%
)

REM Lint check
echo 🔍 Running lint checks...
call pnpm lint
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Lint check failed
  exit /b %ERRORLEVEL%
)

REM Unit tests
echo 🧪 Running unit tests...
set RUN_REAL_API_TESTS=false
call pnpm test
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Unit tests failed
  exit /b %ERRORLEVEL%
)

REM Start services for integration tests
echo 🚀 Starting services for integration tests...
echo Starting RabbitMQ...
docker-compose up -d rabbitmq
REM Wait for RabbitMQ to start
timeout /t 10 /nobreak > NUL

REM Start API Gateway in background
echo Starting API Gateway in background...
start /b cmd /c "cd packages\api-gateway && set PORT=3000 && set RABBITMQ_URL=amqp://guest:guest@localhost:5672 && node dist\index.js"

REM Start Tool Manager in background
echo Starting Tool Manager in background...
start /b cmd /c "cd packages\tool-manager && set PORT=3002 && node dist\index.js"

REM Wait for services to start
echo Waiting for services to start...
timeout /t 5 /nobreak > NUL

REM Test API Gateway health
echo Testing API Gateway health...
curl -s http://localhost:3000/health | findstr "ok" > NUL
if %ERRORLEVEL% NEQ 0 (
  echo ❌ API Gateway health check failed
  goto cleanup
)
echo ✅ API Gateway health check passed

REM Test Tool Manager health
echo Testing Tool Manager health...
curl -s http://localhost:3002/health | findstr "ok" > NUL
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Tool Manager health check failed
  goto cleanup
)
echo ✅ Tool Manager health check passed

REM Test submitting a job
echo Testing job submission...
for /f "tokens=*" %%a in ('curl -s -X POST "http://localhost:3000/v1/jobs" -H "Content-Type: application/json" -d "{\"goal\": \"Analyze the impact of recent AI regulations on healthcare\"}"') do set JOB_RESPONSE=%%a
echo Job submission response: %JOB_RESPONSE%

echo %JOB_RESPONSE% | findstr "jobId" > NUL
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Job submission failed or jobId not found
  goto cleanup
)
echo ✅ Job submitted successfully

REM The next step is tricky in batch as we need to extract the jobId
REM This is simplified and might need manual checking
REM Extract and validate job ID
for /f "tokens=2 delims=:," %%i in ('echo %JOB_RESPONSE%') do set JOB_ID=%%i
set JOB_ID=%JOB_ID:"=%
set JOB_ID=%JOB_ID: =%

echo 🔄 Testing job status for ID: %JOB_ID%...
curl -s -X GET "http://localhost:3000/v1/jobs/%JOB_ID%/status" | findstr "completed" > NUL
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Job did not reach completed state
  goto cleanup
)
echo ✅ Job completed successfully

REM Test Tool Manager execution
echo Testing Tool Manager execution...
for /f "tokens=*" %%a in ('curl -s -X POST "http://localhost:3002/v1/tools/mock_api/execute" -H "Content-Type: application/json" -d "{\"params\": {\"endpoint\": \"/posts/1\", \"method\": \"GET\"}}"') do set TOOL_RESPONSE=%%a
echo Tool execution response: %TOOL_RESPONSE%

echo %TOOL_RESPONSE% | findstr "result" > NUL
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Tool execution failed
  goto cleanup
)
echo ✅ Tool execution passed

:cleanup
REM Cleanup
echo Cleaning up...
REM Note: This simplified cleanup doesn't properly terminate the background processes
REM You may need to manually terminate them using Task Manager
docker-compose down

echo ✅ All tests completed!
