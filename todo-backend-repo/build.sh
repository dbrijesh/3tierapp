#!/bin/bash

# Build script for Todo Backend
set -e

echo "Building Todo Backend..."

# Variables
IMAGE_NAME="todo-backend"
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

# Optional: Run tests
if [ "$RUN_TESTS" = "true" ]; then
    echo "Running tests..."
    echo "Restoring packages..."
    dotnet restore
    
    echo "Running unit tests..."
    dotnet test --configuration Release --no-build --verbosity normal --collect:"XPlat Code Coverage"
    
    echo "Generating test report..."
    dotnet test --logger "trx;LogFileName=TestResults.trx" --collect:"XPlat Code Coverage"
    
    echo "Tests completed successfully!"
fi