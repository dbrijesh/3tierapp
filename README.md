# Todo Application - 3-Tier Architecture

A complete 3-tier todo application with Angular frontend, .NET 8 backend, and containerized deployment for AWS ECS Fargate.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Data Layer    │
│   (Angular)     │───▶│   (.NET 8)      │───▶│  (In-Memory)    │
│   Port: 8080    │    │   Port: 8080    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      ALB        │    │      ALB        │    │                 │
│  (Frontend)     │    │   (Backend)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Authentication Flow

- **AWS Cognito**: OAuth 2.0 / OIDC with authorization code flow
- **Azure Entra ID**: OAuth 2.0 / OIDC with authorization code flow
- **JWT Tokens**: Secure API access with user isolation

## Repository Structure

```
├── todo-backend-repo/          # Backend API repository
│   ├── Controllers/            # API controllers
│   ├── Services/              # Business logic
│   ├── Models/                # Data models
│   ├── Configuration/         # App configuration
│   ├── Dockerfile             # Backend container
│   ├── build.sh              # Build script
│   └── README.md             # Backend documentation
├── todo-frontend-repo/         # Frontend application repository
│   ├── src/app/              # Angular application
│   ├── nginx.conf            # Nginx configuration
│   ├── Dockerfile            # Frontend container
│   ├── build.sh             # Build script
│   └── README.md            # Frontend documentation
├── docker-compose.yml         # Local development
└── README.md                 # This file
```

## Quick Start

### Prerequisites

1. **Authentication Setup**:
   - AWS Cognito User Pool configured
   - Azure Entra ID Application configured
   - Update environment variables

2. **Development Tools**:
   - Docker and Docker Compose
   - .NET 8 SDK (for local backend development)
   - Node.js 18+ (for local frontend development)

### Local Development

1. **Clone and Setup**:
```bash
# Copy environment variables
cp .env.example .env
# Edit .env with your authentication settings
```

2. **Run with Docker Compose**:
```bash
# Build and start all services
docker-compose up --build

# Frontend: http://localhost:4200
# Backend API: http://localhost:5000
```

3. **Individual Development**:
```bash
# Backend (from todo-backend-repo/)
dotnet run

# Frontend (from todo-frontend-repo/)
npm install
npm start
```

## Production Deployment

### Build Images

```bash
# Backend
cd todo-backend-repo
./build.sh latest

# Frontend
cd todo-frontend-repo
./build.sh latest
```

### Push to ECR

```bash
# Set ECR registry
export ECR_REGISTRY=your-account.dkr.ecr.us-east-1.amazonaws.com

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY

# Build and push
cd todo-backend-repo
./build.sh latest

cd ../todo-frontend-repo
./build.sh latest
```

### ECS Task Definitions

#### Backend Task Definition

```json
{
  "family": "todo-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "todo-backend",
      "image": "your-account.dkr.ecr.us-east-1.amazonaws.com/todo-backend:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
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

#### Frontend Task Definition

```json
{
  "family": "todo-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "todo-frontend",
      "image": "your-account.dkr.ecr.us-east-1.amazonaws.com/todo-frontend:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
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

## Security Best Practices

### Authentication
- ✅ JWT token validation
- ✅ User isolation (todos are user-specific)
- ✅ Secure token storage
- ✅ Authorization code flow (not implicit)

### Container Security
- ✅ Non-root user execution
- ✅ Minimal base images
- ✅ No secrets in images
- ✅ Health checks implemented

### Network Security
- ✅ ALB terminates SSL
- ✅ Container-to-container communication
- ✅ Security groups restrict access
- ✅ CORS properly configured

## Monitoring and Logging

### CloudWatch Logs
- Backend: `/ecs/todo-backend`
- Frontend: `/ecs/todo-frontend`

### Health Checks
- Backend: `GET /api/auth/health`
- Frontend: `GET /health`

### Metrics
- Container CPU/Memory utilization
- Request count and latency
- Error rates

## Environment Variables

### Backend
- `AuthSettings__Cognito__Region`
- `AuthSettings__Cognito__UserPoolId`
- `AuthSettings__Cognito__ClientId`
- `AuthSettings__AzureAD__TenantId`
- `AuthSettings__AzureAD__ClientId`

### Frontend
Configure via environment files in the Angular build process.

## Troubleshooting

### Common Issues

1. **Authentication Failures**:
   - Verify Cognito/Azure AD configuration
   - Check redirect URIs
   - Validate JWT tokens

2. **CORS Errors**:
   - Ensure backend CORS policy includes frontend domain
   - Check ALB configuration

3. **Container Health Checks**:
   - Verify health endpoints are accessible
   - Check container logs for startup issues

### Logs Access

```bash
# Backend logs
aws logs tail /ecs/todo-backend --follow

# Frontend logs
aws logs tail /ecs/todo-frontend --follow
```

## Contributing

1. Each repository can be developed independently
2. Follow the clean code principles implemented
3. Ensure security best practices
4. Update documentation for any changes

## License

This project is for demonstration purposes.