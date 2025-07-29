# Todo Application - Setup & Startup Guide

## 🚀 Quick Start Overview

This guide will help you set up and run the complete 3-tier Todo application with Angular frontend, .NET 8 backend, and containerized deployment.

## 📋 Prerequisites

### Required Software
- **Node.js**: 18+ and npm
- **.NET 8 SDK**: For backend development
- **Docker**: For containerization
- **Docker Compose**: For local multi-service development
- **Git**: For version control

### Cloud Services Setup
- **AWS Cognito**: User Pool configured
- **Azure Entra ID**: Application registered
- **AWS ECR**: Container registry (for deployment)

## 🛠️ Initial Setup

### 1. Clone the Repositories

Since this is designed as separate repositories, you'll have two repos:

```bash
# Backend Repository
git clone <your-backend-repo-url> todo-backend
cd todo-backend

# Frontend Repository  
git clone <your-frontend-repo-url> todo-frontend
cd todo-frontend
```

Or if using the current structure:
```bash
git clone <your-repo-url> todo-app
cd todo-app
```

### 2. Environment Configuration

#### AWS Cognito Setup
1. **Create User Pool**:
   ```bash
   # AWS CLI commands
   aws cognito-idp create-user-pool \
     --pool-name "todo-app-users" \
     --region us-east-1
   ```

2. **Create User Pool Client**:
   ```bash
   aws cognito-idp create-user-pool-client \
     --user-pool-id us-east-1_XXXXXXXXX \
     --client-name "todo-app-client" \
     --explicit-auth-flows ADMIN_NO_SRP_AUTH ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH
   ```

3. **Configure Domain**:
   ```bash
   aws cognito-idp create-user-pool-domain \
     --domain "your-todo-app" \
     --user-pool-id us-east-1_XXXXXXXXX
   ```

#### Azure Entra ID Setup
1. **Register Application** in Azure Portal:
   - Navigate to Azure Active Directory > App registrations
   - Click "New registration"
   - Set redirect URI: `http://localhost:4200/callback`

2. **Configure Authentication**:
   - Enable "ID tokens" and "Access tokens"
   - Add redirect URIs for production

### 3. Environment Variables

#### Create `.env` file in root directory:
```bash
# Copy the example file
cp .env.example .env
```

#### Update `.env` with your values:
```bash
# AWS Cognito Configuration
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=your-cognito-client-id

# Azure Entra ID Configuration  
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-azure-client-id

# ECR Registry (for deployment)
ECR_REGISTRY=your-account.dkr.ecr.us-east-1.amazonaws.com

# Optional: Enable tests during build
RUN_TESTS=false
```

## 🏗️ Backend Setup (.NET 8)

### 1. Navigate to Backend Directory
```bash
cd todo-backend-repo
```

### 2. Install Dependencies
```bash
# Restore NuGet packages
dotnet restore

# Build the project
dotnet build
```

### 3. Configure Application Settings

#### Update `appsettings.json`:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "AuthSettings": {
    "Cognito": {
      "Region": "us-east-1",
      "UserPoolId": "us-east-1_XXXXXXXXX",
      "ClientId": "your-cognito-client-id"
    },
    "AzureAD": {
      "TenantId": "your-tenant-id",
      "ClientId": "your-azure-client-id"
    }
  }
}
```

### 4. Run Backend Locally
```bash
# Run in development mode
dotnet run

# The API will be available at:
# HTTP: http://localhost:5000
# HTTPS: https://localhost:5001
```

### 5. Test Backend API
```bash
# Health check
curl http://localhost:5000/api/auth/health

# Expected response: {"status":"healthy","timestamp":"..."}
```

## 🎨 Frontend Setup (Angular)

### 1. Navigate to Frontend Directory
```bash
cd todo-frontend-repo
```

### 2. Install Dependencies
```bash
# Install npm packages
npm install
```

### 3. Configure Environment

#### Update `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000',
  cognito: {
    region: 'us-east-1',
    userPoolId: 'us-east-1_XXXXXXXXX',
    clientId: 'your-cognito-client-id',
    domain: 'your-cognito-domain',
    redirectUri: 'http://localhost:4200/callback'
  },
  azureAD: {
    tenantId: 'your-tenant-id',
    clientId: 'your-azure-client-id',
    clientSecret: 'your-azure-client-secret',
    redirectUri: 'http://localhost:4200/callback'
  }
};
```

### 4. Run Frontend Locally
```bash
# Start development server
npm start

# The application will be available at:
# http://localhost:4200
```

### 5. Test Frontend
- Navigate to `http://localhost:4200`
- You should see the login page with SSO options
- Backend API should be accessible

## 🐳 Docker Setup

### 1. Build Individual Containers

#### Backend Container:
```bash
cd todo-backend-repo

# Build Docker image
docker build -t todo-backend:latest .

# Run container
docker run -p 5000:8080 \
  -e AuthSettings__Cognito__Region=us-east-1 \
  -e AuthSettings__Cognito__UserPoolId=us-east-1_XXXXXXXXX \
  -e AuthSettings__Cognito__ClientId=your-cognito-client-id \
  -e AuthSettings__AzureAD__TenantId=your-tenant-id \
  -e AuthSettings__AzureAD__ClientId=your-azure-client-id \
  todo-backend:latest
```

#### Frontend Container:
```bash
cd todo-frontend-repo

# Build Docker image
docker build -t todo-frontend:latest .

# Run container
docker run -p 4200:8080 todo-frontend:latest
```

### 2. Docker Compose (Recommended)

#### From root directory:
```bash
# Start all services
docker-compose up -d

# Services will be available at:
# Frontend: http://localhost:4200
# Backend: http://localhost:5000
```

#### Check service status:
```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs todo-backend
docker-compose logs todo-frontend
```

#### Stop services:
```bash
docker-compose down
```

### 3. Docker Compose with Custom Configuration

#### Create `docker-compose.override.yml`:
```yaml
version: '3.8'

services:
  todo-backend:
    environment:
      - AuthSettings__Cognito__Region=${COGNITO_REGION}
      - AuthSettings__Cognito__UserPoolId=${COGNITO_USER_POOL_ID}
      - AuthSettings__Cognito__ClientId=${COGNITO_CLIENT_ID}
      - AuthSettings__AzureAD__TenantId=${AZURE_TENANT_ID}
      - AuthSettings__AzureAD__ClientId=${AZURE_CLIENT_ID}
    ports:
      - "5001:8080"  # Custom port mapping

  todo-frontend:
    ports:
      - "4201:8080"  # Custom port mapping
```

## 🧪 Testing Setup

### 1. Run All Tests
```bash
# From root directory
./run-tests.sh

# Or run specific test suites
./run-tests.sh backend
./run-tests.sh frontend
```

### 2. Backend Tests Only
```bash
cd todo-backend-repo

# Run all tests
dotnet test

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"

# Run specific test category
dotnet test Tests/Controllers/
dotnet test Tests/Services/
dotnet test Tests/Integration/
```

### 3. Frontend Tests Only
```bash
cd todo-frontend-repo

# Run tests in watch mode
npm test

# Run tests once (headless)
npm run test:headless

# Run tests with coverage
npm run test:coverage
```

## 🚀 Production Deployment

### 1. Build for Production

#### Using Build Scripts:
```bash
# Build backend
cd todo-backend-repo
./build.sh latest

# Build frontend  
cd todo-frontend-repo
./build.sh latest
```

#### With Testing:
```bash
# Enable tests during build
export RUN_TESTS=true

# Build with tests
./build.sh latest
```

### 2. ECR Deployment

#### Configure AWS CLI:
```bash
aws configure
# Enter your AWS credentials
```

#### Login to ECR:
```bash
aws ecr get-login-password --region us-east-1 | \
docker login --username AWS --password-stdin \
your-account.dkr.ecr.us-east-1.amazonaws.com
```

#### Push to ECR:
```bash
# Set registry
export ECR_REGISTRY=your-account.dkr.ecr.us-east-1.amazonaws.com

# Build and push
./deploy.sh
```

### 3. ECS Fargate Deployment

#### Update ECS Task Definitions:
Use the provided task definition examples in the main README.md

#### Deploy to ECS:
```bash
# Update services
aws ecs update-service \
  --cluster todo-cluster \
  --service todo-backend-service \
  --force-new-deployment

aws ecs update-service \
  --cluster todo-cluster \
  --service todo-frontend-service \
  --force-new-deployment
```

## 🔧 Development Workflow

### 1. Daily Development

#### Start Development Environment:
```bash
# Option 1: Local development
# Terminal 1 - Backend
cd todo-backend-repo && dotnet run

# Terminal 2 - Frontend  
cd todo-frontend-repo && npm start

# Option 2: Docker development
docker-compose up -d
```

#### Make Changes and Test:
```bash
# Run tests after changes
./run-tests.sh

# Or run specific tests
dotnet test  # Backend only
npm test     # Frontend only
```

### 2. Feature Development

#### Create Feature Branch:
```bash
git checkout -b feature/new-feature
```

#### Development Cycle:
1. Make code changes
2. Run tests: `./run-tests.sh`
3. Test locally: `docker-compose up -d`
4. Commit changes: `git commit -m "Add new feature"`
5. Push and create PR: `git push origin feature/new-feature`

### 3. Code Quality Checks

#### Pre-commit Validation:
```bash
# Backend linting/formatting
cd todo-backend-repo
dotnet format

# Frontend linting
cd todo-frontend-repo
npm run lint
```

#### Security Validation:
```bash
# Check for vulnerabilities
npm audit
dotnet list package --vulnerable
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Backend Won't Start
```bash
# Check .NET version
dotnet --version  # Should be 8.0.x

# Check port availability
netstat -an | grep 5000

# Check logs
dotnet run --verbosity detailed
```

#### 2. Frontend Build Fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18+
```

#### 3. Docker Issues
```bash
# Check Docker status
docker info

# Clean Docker system
docker system prune -a

# Check container logs
docker logs container-name
```

#### 4. Authentication Issues
```bash
# Verify Cognito configuration
aws cognito-idp describe-user-pool --user-pool-id us-east-1_XXXXXXXXX

# Check redirect URIs match exactly
# Verify client IDs and secrets
```

### Environment-Specific Issues

#### Linux/WSL:
```bash
# If permission denied on scripts
chmod +x build.sh deploy.sh run-tests.sh
```

#### Windows:
```bash
# Use PowerShell or Git Bash
# Ensure line endings are correct
git config core.autocrlf true
```

#### macOS:
```bash
# Install Docker Desktop
# Use Homebrew for dependencies
brew install node dotnet
```

## 📚 Additional Resources

### Documentation
- [Main README](./README.md) - Project overview
- [Testing Guide](./TESTING.md) - Comprehensive testing documentation
- [Test Validation Report](./TEST_VALIDATION_REPORT.md) - Test results

### Useful Commands
```bash
# Development commands
npm start                    # Start frontend dev server
dotnet run                   # Start backend dev server
docker-compose up -d         # Start all services

# Testing commands
./run-tests.sh              # Run all tests
npm test                    # Frontend tests only
dotnet test                 # Backend tests only

# Build commands
./build.sh                  # Build Docker images
docker-compose build        # Build all services
npm run build               # Build frontend only

# Deployment commands
./deploy.sh                 # Deploy to AWS
docker-compose down         # Stop all services
```

### Support
- Check logs first: `docker-compose logs service-name`
- Verify environment variables are set correctly
- Ensure all ports are available and not blocked by firewall
- Validate authentication provider configurations

---

## 🎯 Quick Start Checklist

- [ ] Install prerequisites (Node.js, .NET 8, Docker)
- [ ] Configure AWS Cognito and Azure Entra ID
- [ ] Update environment variables in `.env`
- [ ] Update application configuration files
- [ ] Run `docker-compose up -d`
- [ ] Navigate to `http://localhost:4200`
- [ ] Test login with both SSO providers
- [ ] Create, read, update, delete todos
- [ ] Run tests: `./run-tests.sh`
- [ ] Deploy to production when ready

**Happy coding! 🚀**