#!/bin/bash

# Deployment script for Todo Application
set -e

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
ECR_REGISTRY=${ECR_REGISTRY:-"your-account.dkr.ecr.$AWS_REGION.amazonaws.com"}
CLUSTER_NAME=${CLUSTER_NAME:-"todo-cluster"}
BACKEND_SERVICE=${BACKEND_SERVICE:-"todo-backend-service"}
FRONTEND_SERVICE=${FRONTEND_SERVICE:-"todo-frontend-service"}
TAG=${1:-latest}

echo "=== Todo Application Deployment ==="
echo "Region: $AWS_REGION"
echo "Registry: $ECR_REGISTRY"
echo "Cluster: $CLUSTER_NAME"
echo "Tag: $TAG"
echo

# Function to check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."
    
    if ! command -v aws &> /dev/null; then
        echo "❌ AWS CLI not found. Please install AWS CLI."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker not found. Please install Docker."
        exit 1
    fi
    
    echo "✅ Prerequisites check passed"
}

# Function to login to ECR
ecr_login() {
    echo "Logging into ECR..."
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
    echo "✅ ECR login successful"
}

# Function to build and push backend
build_backend() {
    echo "Building and pushing backend..."
    cd todo-backend-repo
    
    # Build image
    docker build -t todo-backend:$TAG .
    docker tag todo-backend:$TAG $ECR_REGISTRY/todo-backend:$TAG
    
    # Push to ECR
    docker push $ECR_REGISTRY/todo-backend:$TAG
    
    cd ..
    echo "✅ Backend build and push completed"
}

# Function to build and push frontend
build_frontend() {
    echo "Building and pushing frontend..."
    cd todo-frontend-repo
    
    # Build image
    docker build -t todo-frontend:$TAG .
    docker tag todo-frontend:$TAG $ECR_REGISTRY/todo-frontend:$TAG
    
    # Push to ECR
    docker push $ECR_REGISTRY/todo-frontend:$TAG
    
    cd ..
    echo "✅ Frontend build and push completed"
}

# Function to update ECS services
update_services() {
    echo "Updating ECS services..."
    
    # Update backend service
    echo "Updating backend service: $BACKEND_SERVICE"
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $BACKEND_SERVICE \
        --force-new-deployment \
        --region $AWS_REGION
    
    # Update frontend service
    echo "Updating frontend service: $FRONTEND_SERVICE"
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $FRONTEND_SERVICE \
        --force-new-deployment \
        --region $AWS_REGION
    
    echo "✅ ECS services update initiated"
}

# Function to wait for deployment
wait_for_deployment() {
    echo "Waiting for deployment to complete..."
    
    echo "Waiting for backend service..."
    aws ecs wait services-stable \
        --cluster $CLUSTER_NAME \
        --services $BACKEND_SERVICE \
        --region $AWS_REGION
    
    echo "Waiting for frontend service..."
    aws ecs wait services-stable \
        --cluster $CLUSTER_NAME \
        --services $FRONTEND_SERVICE \
        --region $AWS_REGION
    
    echo "✅ Deployment completed successfully"
}

# Function to show deployment status
show_status() {
    echo
    echo "=== Deployment Status ==="
    
    # Backend service status
    echo "Backend Service:"
    aws ecs describe-services \
        --cluster $CLUSTER_NAME \
        --services $BACKEND_SERVICE \
        --query 'services[0].[serviceName,status,runningCount,desiredCount]' \
        --output table \
        --region $AWS_REGION
    
    # Frontend service status
    echo "Frontend Service:"
    aws ecs describe-services \
        --cluster $CLUSTER_NAME \
        --services $FRONTEND_SERVICE \
        --query 'services[0].[serviceName,status,runningCount,desiredCount]' \
        --output table \
        --region $AWS_REGION
}

# Main deployment flow
main() {
    case "$1" in
        "build-only")
            check_prerequisites
            ecr_login
            build_backend
            build_frontend
            echo "✅ Build completed. Images pushed to ECR."
            ;;
        "deploy-only")
            check_prerequisites
            update_services
            wait_for_deployment
            show_status
            ;;
        *)
            check_prerequisites
            ecr_login
            build_backend
            build_frontend
            update_services
            wait_for_deployment
            show_status
            echo
            echo "🎉 Deployment completed successfully!"
            echo "Backend: $ECR_REGISTRY/todo-backend:$TAG"
            echo "Frontend: $ECR_REGISTRY/todo-frontend:$TAG"
            ;;
    esac
}

# Run main function
main "$@"