# Todo Backend API

A .NET 8 Web API backend for the Todo application with AWS Cognito and Azure Entra ID authentication support.

## Features

- JWT-based authentication with AWS Cognito and Azure Entra ID
- RESTful API for Todo CRUD operations
- User-specific data isolation
- Health check endpoint
- Swagger/OpenAPI documentation
- Docker support for containerization

## Prerequisites

- .NET 8 SDK
- Docker (for containerization)
- AWS Cognito User Pool (configured)
- Azure Entra ID Application (configured)

## Configuration

Update `appsettings.json` with your authentication provider settings:

```json
{
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

## Local Development

```bash
# Restore dependencies
dotnet restore

# Run the application
dotnet run

# The API will be available at https://localhost:5001
```

## Docker Build

```bash
# Build the Docker image
docker build -t todo-backend .

# Run the container
docker run -p 8080:8080 \
  -e AuthSettings__Cognito__Region=us-east-1 \
  -e AuthSettings__Cognito__UserPoolId=your-pool-id \
  -e AuthSettings__Cognito__ClientId=your-client-id \
  -e AuthSettings__AzureAD__TenantId=your-tenant-id \
  -e AuthSettings__AzureAD__ClientId=your-azure-client-id \
  todo-backend
```

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user information
- `GET /api/auth/health` - Health check

### Todos
- `GET /api/todo` - Get all todos for the authenticated user
- `GET /api/todo/{id}` - Get a specific todo
- `POST /api/todo` - Create a new todo
- `PUT /api/todo/{id}` - Update a todo
- `DELETE /api/todo/{id}` - Delete a todo

## ECS Fargate Deployment

The application is designed to run on AWS ECS Fargate. Key considerations:

1. **Port Configuration**: Application runs on port 8080
2. **Health Checks**: Available at `/api/auth/health`
3. **Environment Variables**: Configure authentication settings via environment variables
4. **Security**: Runs as non-root user in container
5. **Logging**: Uses structured logging compatible with CloudWatch

## Environment Variables for Production

```bash
ASPNETCORE_ENVIRONMENT=Production
AuthSettings__Cognito__Region=us-east-1
AuthSettings__Cognito__UserPoolId=your-pool-id
AuthSettings__Cognito__ClientId=your-client-id
AuthSettings__AzureAD__TenantId=your-tenant-id
AuthSettings__AzureAD__ClientId=your-azure-client-id
```

## Architecture

- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and data access
- **Models**: Data transfer objects and domain models
- **Configuration**: Authentication and application settings
- **Middleware**: JWT authentication and CORS handling