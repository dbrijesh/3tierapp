# 🚀 Production Deployment Guide

## 🎯 Overview

This guide covers deploying your Todo application to AWS ECS Fargate with ALB load balancing, ECR container registry, and production-ready configurations.

## 🏗️ Architecture

```
Internet → ALB → ECS Fargate → ECR Images
├── Frontend ALB → Frontend Service → Frontend Tasks
└── Backend ALB → Backend Service → Backend Tasks
```

## 📋 Prerequisites

### AWS Services Required
- **ECS Cluster**: Container orchestration
- **ECR Repositories**: Container image storage
- **Application Load Balancer**: Traffic distribution
- **VPC & Subnets**: Network infrastructure
- **IAM Roles**: Service permissions
- **Route 53**: DNS management (optional)
- **CloudWatch**: Logging and monitoring

### Local Tools Required
- AWS CLI configured with appropriate permissions
- Docker installed and running
- Your application code and configuration

## 🛠️ Pre-Deployment Setup

### 1. AWS CLI Configuration

```bash
# Configure AWS credentials
aws configure

# Verify configuration
aws sts get-caller-identity
```

### 2. Create ECR Repositories

```bash
# Create backend repository
aws ecr create-repository \
  --repository-name todo-backend \
  --region us-east-1

# Create frontend repository  
aws ecr create-repository \
  --repository-name todo-frontend \
  --region us-east-1

# Get login credentials
aws ecr get-login-password --region us-east-1 | \
docker login --username AWS --password-stdin \
your-account.dkr.ecr.us-east-1.amazonaws.com
```

### 3. Set Environment Variables

```bash
# Set your AWS account ID and region
export AWS_ACCOUNT_ID=123456789012
export AWS_REGION=us-east-1
export ECR_REGISTRY=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Set cluster and service names
export CLUSTER_NAME=todo-cluster
export BACKEND_SERVICE=todo-backend-service  
export FRONTEND_SERVICE=todo-frontend-service
```

## 🐳 Build and Push Images

### 1. Build Images Locally

```bash
# Backend
cd todo-backend-repo
docker build -t ${ECR_REGISTRY}/todo-backend:latest .

# Frontend
cd todo-frontend-repo  
docker build -t ${ECR_REGISTRY}/todo-frontend:latest .
```

### 2. Push to ECR

```bash
# Push backend
docker push ${ECR_REGISTRY}/todo-backend:latest

# Push frontend
docker push ${ECR_REGISTRY}/todo-frontend:latest
```

### 3. Automated Build and Push

```bash
# Use the deployment script
export ECR_REGISTRY=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
./deploy.sh
```

## 🏛️ Infrastructure Setup

### 1. Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name ${CLUSTER_NAME} \
  --capacity-providers FARGATE \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1
```

### 2. Create IAM Roles

#### ECS Task Execution Role:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

```bash
# Create execution role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://trust-policy.json

# Attach managed policy
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
```

#### ECS Task Role:
```bash
# Create task role for application permissions
aws iam create-role \
  --role-name ecsTaskRole \
  --assume-role-policy-document file://trust-policy.json

# Add custom policies as needed for your application
```

### 3. Create Security Groups

```bash
# Backend security group
aws ec2 create-security-group \
  --group-name todo-backend-sg \
  --description "Security group for Todo backend" \
  --vpc-id vpc-xxxxxxxxx

# Allow inbound traffic on port 8080 from ALB
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 8080 \
  --source-group sg-alb-xxxxxxxxx

# Frontend security group  
aws ec2 create-security-group \
  --group-name todo-frontend-sg \
  --description "Security group for Todo frontend" \
  --vpc-id vpc-xxxxxxxxx

# Allow inbound traffic on port 8080 from ALB
aws ec2 authorize-security-group-ingress \
  --group-id sg-yyyyyyyyy \
  --protocol tcp \
  --port 8080 \
  --source-group sg-alb-yyyyyyyyy
```

## 📝 Task Definitions

### 1. Backend Task Definition

Create `backend-task-definition.json`:
```json
{
  "family": "todo-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "todo-backend",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/todo-backend:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "ASPNETCORE_ENVIRONMENT",
          "value": "Production"
        },
        {
          "name": "AuthSettings__Cognito__Region",
          "value": "us-east-1"
        },
        {
          "name": "AuthSettings__Cognito__UserPoolId", 
          "value": "us-east-1_XXXXXXXXX"
        },
        {
          "name": "AuthSettings__Cognito__ClientId",
          "value": "your-cognito-client-id"
        },
        {
          "name": "AuthSettings__AzureAD__TenantId",
          "value": "your-tenant-id"
        },
        {
          "name": "AuthSettings__AzureAD__ClientId", 
          "value": "your-azure-client-id"
        }
      ],
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:8080/api/auth/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/todo-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### 2. Frontend Task Definition

Create `frontend-task-definition.json`:
```json
{
  "family": "todo-frontend",
  "networkMode": "awsvpc", 
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "todo-frontend",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/todo-frontend:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "healthCheck": {
        "command": [
          "CMD-SHELL", 
          "curl -f http://localhost:8080/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 30
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/todo-frontend",
          "awslogs-region": "us-east-1", 
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### 3. Register Task Definitions

```bash
# Register backend task definition
aws ecs register-task-definition \
  --cli-input-json file://backend-task-definition.json

# Register frontend task definition  
aws ecs register-task-definition \
  --cli-input-json file://frontend-task-definition.json
```

## 🔄 Create Services

### 1. Backend Service

```bash
aws ecs create-service \
  --cluster ${CLUSTER_NAME} \
  --service-name ${BACKEND_SERVICE} \
  --task-definition todo-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxxxxx,subnet-yyyyyyyy],securityGroups=[sg-backend],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/todo-backend-tg/xxxxxxxxx,containerName=todo-backend,containerPort=8080"
```

### 2. Frontend Service

```bash
aws ecs create-service \
  --cluster ${CLUSTER_NAME} \
  --service-name ${FRONTEND_SERVICE} \
  --task-definition todo-frontend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxxxxx,subnet-yyyyyyyy],securityGroups=[sg-frontend],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/todo-frontend-tg/yyyyyyyyy,containerName=todo-frontend,containerPort=8080"
```

## ⚖️ Load Balancer Setup

### 1. Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name todo-alb \
  --subnets subnet-xxxxxxxx subnet-yyyyyyyy \
  --security-groups sg-alb-xxxxxxxxx \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4
```

### 2. Create Target Groups

```bash
# Backend target group
aws elbv2 create-target-group \
  --name todo-backend-tg \
  --protocol HTTP \
  --port 8080 \
  --vpc-id vpc-xxxxxxxxx \
  --target-type ip \
  --health-check-path /api/auth/health \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

# Frontend target group
aws elbv2 create-target-group \
  --name todo-frontend-tg \
  --protocol HTTP \
  --port 8080 \
  --vpc-id vpc-xxxxxxxxx \
  --target-type ip \
  --health-check-path /health \
  --health-check-interval-seconds 30
```

### 3. Create Listeners

```bash
# Frontend listener (default)
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/todo-alb/xxxxxxxxx \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/todo-frontend-tg/yyyyyyyyy

# Backend listener rule  
aws elbv2 create-rule \
  --listener-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/todo-alb/xxxxxxxxx/yyyyyyyyyy \
  --priority 100 \
  --conditions Field=path-pattern,Values="/api/*" \
  --actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/todo-backend-tg/xxxxxxxxx
```

## 🔐 SSL/TLS Setup (HTTPS)

### 1. Request SSL Certificate

```bash
# Request certificate via ACM
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names www.yourdomain.com \
  --validation-method DNS \
  --region us-east-1
```

### 2. Create HTTPS Listener

```bash
# Add HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/todo-alb/xxxxxxxxx \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:us-east-1:123456789012:certificate/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/todo-frontend-tg/yyyyyyyyy
```

## 📊 Monitoring Setup

### 1. Create CloudWatch Log Groups

```bash
# Backend logs
aws logs create-log-group \
  --log-group-name /ecs/todo-backend

# Frontend logs  
aws logs create-log-group \
  --log-group-name /ecs/todo-frontend
```

### 2. CloudWatch Dashboards

Create dashboard for monitoring:
- ECS service metrics
- ALB metrics
- Container insights
- Custom application metrics

## 🚀 Deployment Automation

### 1. Blue/Green Deployment

```bash
# Update service with new task definition
aws ecs update-service \
  --cluster ${CLUSTER_NAME} \
  --service ${BACKEND_SERVICE} \
  --task-definition todo-backend:2 \
  --deployment-configuration "maximumPercent=200,minimumHealthyPercent=50"
```

### 2. Rolling Updates

```bash
# Configure deployment
aws ecs update-service \
  --cluster ${CLUSTER_NAME} \
  --service ${BACKEND_SERVICE} \
  --deployment-configuration "maximumPercent=150,minimumHealthyPercent=75"
```

### 3. Automated Deployment Script

Use the provided `deploy.sh` script:
```bash
# Set environment variables
export CLUSTER_NAME=todo-cluster
export BACKEND_SERVICE=todo-backend-service
export FRONTEND_SERVICE=todo-frontend-service
export ECR_REGISTRY=${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com

# Deploy
./deploy.sh
```

## 🔍 Health Monitoring

### 1. Health Check Endpoints

Ensure these endpoints return 200 OK:
- Backend: `GET /api/auth/health`
- Frontend: `GET /health`

### 2. ALB Health Checks

Configure health checks in target groups:
- **Healthy threshold**: 2 consecutive successful checks
- **Unhealthy threshold**: 3 consecutive failed checks  
- **Timeout**: 5 seconds
- **Interval**: 30 seconds

### 3. Service Auto Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/${CLUSTER_NAME}/${BACKEND_SERVICE} \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --policy-name todo-backend-scale-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/${CLUSTER_NAME}/${BACKEND_SERVICE} \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

## 🔄 Update Deployment

### 1. Build New Images

```bash
# Build with new tag
docker build -t ${ECR_REGISTRY}/todo-backend:v2.0 todo-backend-repo/
docker push ${ECR_REGISTRY}/todo-backend:v2.0
```

### 2. Update Task Definition

```bash
# Update image in task definition
# Register new task definition revision
aws ecs register-task-definition --cli-input-json file://updated-task-definition.json
```

### 3. Update Service

```bash
# Update service to use new task definition
aws ecs update-service \
  --cluster ${CLUSTER_NAME} \
  --service ${BACKEND_SERVICE} \
  --task-definition todo-backend:2
```

## 🛠️ Troubleshooting

### 1. Service Won't Start

```bash
# Check service events
aws ecs describe-services \
  --cluster ${CLUSTER_NAME} \
  --services ${BACKEND_SERVICE}

# Check task logs
aws logs get-log-events \
  --log-group-name /ecs/todo-backend \
  --log-stream-name ecs/todo-backend/task-id
```

### 2. Health Check Failures

```bash
# Test health endpoints directly
curl http://task-ip:8080/api/auth/health
curl http://task-ip:8080/health

# Check target group health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/todo-backend-tg/xxxxxxxxx
```

### 3. Load Balancer Issues

```bash
# Check ALB status
aws elbv2 describe-load-balancers \
  --load-balancer-arns arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/todo-alb/xxxxxxxxx

# Check listener rules
aws elbv2 describe-rules \
  --listener-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/todo-alb/xxxxxxxxx/yyyyyyyyyy
```

## 📋 Post-Deployment Checklist

- [ ] Services are running with desired count
- [ ] Health checks are passing
- [ ] ALB is routing traffic correctly
- [ ] HTTPS is working (if configured)
- [ ] DNS is pointing to ALB (if using custom domain)
- [ ] CloudWatch logs are being generated
- [ ] Auto-scaling is configured
- [ ] Monitoring alerts are set up
- [ ] Application functionality is verified
- [ ] Authentication flows work end-to-end

## 💰 Cost Optimization

### 1. Right-size Resources
- Start with minimal CPU/memory
- Monitor and adjust based on usage
- Use Fargate Spot for non-critical workloads

### 2. Auto Scaling
- Scale down during off-peak hours
- Use predictive scaling policies
- Set appropriate min/max capacity

### 3. Reserved Capacity
- Consider Savings Plans for predictable workloads
- Use Reserved Instances for supporting infrastructure

---

## 🎯 Success Metrics

Your deployment is successful when:
- ✅ All services are running and healthy
- ✅ Application is accessible via ALB
- ✅ Authentication works with both providers
- ✅ CRUD operations function correctly
- ✅ Health checks pass consistently
- ✅ Logs are flowing to CloudWatch
- ✅ Auto-scaling responds to load changes

**🚀 Your Todo application is now running in production on AWS ECS Fargate!**