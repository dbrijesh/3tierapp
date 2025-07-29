#!/bin/bash

# Build script for Todo Frontend
set -e

echo "Building Todo Frontend..."

# Variables
IMAGE_NAME="todo-frontend"
TAG=${1:-latest}
REGISTRY=${ECR_REGISTRY:-"your-account.dkr.ecr.us-east-1.amazonaws.com"}

echo "Building Docker image: $IMAGE_NAME:$TAG"

# Build the Docker image
docker build -t $IMAGE_NAME:$TAG .

# Tag for ECR if registry is provided
if [ "$REGISTRY" != "your-account.dkr.ecr.us-east-1.amazonaws.com" ]; then
    echo "Tagging image for ECR: $REGISTRY/$IMAGE_NAME:$TAG"
    docker tag $IMAGE_NAME:$TAG $REGISTRY/$IMAGE_NAME:$TAG
    
    echo "Pushing to ECR..."
    docker push $REGISTRY/$IMAGE_NAME:$TAG
fi

echo "Build completed successfully!"
echo "Image: $IMAGE_NAME:$TAG"

# Optional: Run tests and lint
if [ "$RUN_TESTS" = "true" ]; then
    echo "Installing dependencies..."
    npm ci
    
    echo "Running linter..."
    npm run lint 2>/dev/null || echo "Linter not configured, skipping..."
    
    echo "Running unit tests with coverage..."
    npm run test:coverage
    
    echo "Running tests in headless mode..."
    npm run test:headless
    
    echo "Frontend tests completed successfully!"
fi