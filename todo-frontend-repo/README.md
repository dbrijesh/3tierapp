# Todo Frontend

An Angular 17 frontend application for the Todo app with AWS Cognito and Azure Entra ID authentication support.

## Features

- Single Sign-On (SSO) with AWS Cognito and Azure Entra ID
- Responsive Material Design-inspired UI
- Complete Todo CRUD operations
- Real-time user authentication status
- Protected routes with authentication guards
- Mobile-friendly responsive design

## Prerequisites

- Node.js 18+ and npm
- Docker (for containerization)
- Backend API running (todo-backend-repo)

## Configuration

Update the environment files with your settings:

### `src/environments/environment.ts` (Development)
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

### `src/environments/environment.prod.ts` (Production)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com',
  cognito: {
    region: 'us-east-1',
    userPoolId: 'us-east-1_XXXXXXXXX',
    clientId: 'your-cognito-client-id',
    domain: 'your-cognito-domain',
    redirectUri: 'https://your-frontend-domain.com/callback'
  },
  azureAD: {
    tenantId: 'your-tenant-id',
    clientId: 'your-azure-client-id',
    clientSecret: 'your-azure-client-secret',
    redirectUri: 'https://your-frontend-domain.com/callback'
  }
};
```

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# The application will be available at http://localhost:4200
```

## Building for Production

```bash
# Build for production
npm run build

# The built files will be in the dist/ directory
```

## Docker Build

```bash
# Build the Docker image
docker build -t todo-frontend .

# Run the container
docker run -p 8080:8080 todo-frontend

# The application will be available at http://localhost:8080
```

## Application Structure

```
src/
├── app/
│   ├── components/
│   │   ├── login/           # Login page with SSO options
│   │   ├── callback/        # OAuth callback handler
│   │   ├── dashboard/       # User dashboard
│   │   └── todo-list/       # Todo management
│   ├── guards/
│   │   └── auth.guard.ts    # Route protection
│   ├── models/
│   │   ├── user.model.ts    # User data model
│   │   └── todo.model.ts    # Todo data models
│   ├── services/
│   │   ├── auth.service.ts  # Authentication service
│   │   └── todo.service.ts  # Todo API service
│   └── app.routes.ts        # Application routing
├── environments/            # Environment configurations
└── styles.css              # Global styles
```

## Routes

- `/login` - Login page with SSO options
- `/callback` - OAuth callback handler
- `/dashboard` - User dashboard (protected)
- `/todos` - Todo management (protected)

## ECS Fargate Deployment

The application is optimized for AWS ECS Fargate deployment:

1. **Port Configuration**: Runs on port 8080
2. **Health Checks**: Available at `/health`
3. **Security**: Runs as non-root user
4. **Performance**: Nginx with gzip compression and caching
5. **Routing**: Handles Angular routing with fallback to index.html

## Environment Variables for Production

When deploying to ECS, you can configure the application using environment variables by mounting configuration files or using init containers to update the environment files.

## Security Features

- Content Security Policy (CSP) headers
- XSS protection headers
- CSRF protection through JWT tokens
- Secure cookie handling
- Non-root container execution

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimizations

- Lazy loading of routes
- OnPush change detection strategy
- TrackBy functions for ngFor loops
- Nginx compression and caching
- Angular standalone components