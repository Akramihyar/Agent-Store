#!/bin/bash

# Docker Test Script for Agent Store
echo "🚀 Testing Agent Store Docker Setup"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"

# Build the production image
echo "🔨 Building production image..."
docker build -t agent-store:latest .

if [ $? -ne 0 ]; then
    echo "❌ Failed to build production image"
    exit 1
fi

echo "✅ Production image built successfully"

# Run production container
echo "🚢 Starting production container on port 8080..."
docker run -d --name agent-store-test -p 8080:80 agent-store:latest

if [ $? -ne 0 ]; then
    echo "❌ Failed to start production container"
    exit 1
fi

# Wait for container to be ready
echo "⏳ Waiting for container to be ready..."
sleep 10

# Test health endpoint
echo "🔍 Testing health endpoint..."
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    docker logs agent-store-test
    docker stop agent-store-test
    docker rm agent-store-test
    exit 1
fi

# Test main application
echo "🔍 Testing main application..."
if curl -f http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Main application is accessible"
else
    echo "❌ Main application is not accessible"
    docker logs agent-store-test
    docker stop agent-store-test
    docker rm agent-store-test
    exit 1
fi

echo "🎉 All tests passed!"
echo "📝 You can access the application at: http://localhost:8080"
echo "🛑 To stop the test container, run: docker stop agent-store-test && docker rm agent-store-test"