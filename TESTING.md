# Testing Guide

Comprehensive testing suite for the Todo Application with .NET 8 backend and Angular frontend.

## 🎯 Testing Overview

This project implements a multi-layered testing strategy:

- **Unit Tests**: Test individual components and services in isolation
- **Integration Tests**: Test API endpoints and service interactions
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Validate system performance under load

## 📊 Test Coverage Goals

- **Backend**: 90%+ code coverage for controllers and services
- **Frontend**: 85%+ code coverage for components and services
- **Integration**: 100% API endpoint coverage
- **Critical Paths**: 100% coverage for authentication and CRUD operations

## 🧪 Backend Testing (.NET 8)

### Test Structure
```
Tests/
├── Controllers/           # Controller unit tests
│   ├── AuthControllerTests.cs
│   └── TodoControllerTests.cs
├── Services/             # Service unit tests
│   └── InMemoryTodoServiceTests.cs
└── Integration/          # Integration tests
    └── TodoApiIntegrationTests.cs
```

### Testing Technologies
- **xUnit**: Testing framework
- **Moq**: Mocking framework
- **FluentAssertions**: Assertion library
- **Microsoft.AspNetCore.Mvc.Testing**: Integration testing

### Running Backend Tests

```bash
# Run all tests
dotnet test

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"

# Run specific test category
dotnet test Tests/Controllers/
dotnet test Tests/Services/
dotnet test Tests/Integration/

# Run with detailed output
dotnet test --verbosity detailed

# Generate test report
dotnet test --logger "trx;LogFileName=TestResults.trx"
```

### Backend Test Categories

#### Controller Tests
- **AuthController**: User authentication and authorization
- **TodoController**: CRUD operations with proper authorization
- **Error Handling**: Validates proper HTTP status codes
- **Security**: Ensures user isolation and access control

#### Service Tests
- **InMemoryTodoService**: Business logic validation
- **Data Persistence**: CRUD operations
- **Concurrency**: Thread-safety validation
- **Edge Cases**: Null handling, invalid inputs

#### Integration Tests
- **API Endpoints**: Full request/response cycle
- **Authentication Flow**: JWT token validation
- **User Isolation**: Data security between users
- **Error Scenarios**: Network failures, invalid requests

## 🎨 Frontend Testing (Angular)

### Test Structure
```
src/app/
├── services/
│   ├── auth.service.spec.ts
│   └── todo.service.spec.ts
├── guards/
│   └── auth.guard.spec.ts
└── components/
    ├── login/login.component.spec.ts
    ├── dashboard/dashboard.component.spec.ts
    ├── callback/callback.component.spec.ts
    └── todo-list/todo-list.component.spec.ts
```

### Testing Technologies
- **Jasmine**: Testing framework
- **Karma**: Test runner
- **Angular Testing Utilities**: Component testing
- **HttpClientTestingModule**: HTTP service mocking

### Running Frontend Tests

```bash
# Run tests in development mode
npm test

# Run tests in headless mode (CI)
npm run test:headless

# Run tests with coverage
npm run test:coverage

# Run linter
npm run lint
```

### Frontend Test Categories

#### Service Tests
- **AuthService**: Authentication workflows, token management
- **TodoService**: API communication, error handling
- **HTTP Interceptors**: Request/response processing

#### Component Tests
- **LoginComponent**: SSO button interactions
- **DashboardComponent**: User information display
- **TodoListComponent**: CRUD operations, form validation
- **CallbackComponent**: OAuth callback handling

#### Guard Tests
- **AuthGuard**: Route protection, redirect logic

## 🔗 Integration Testing

### Docker Compose Testing
```bash
# Start services for integration testing
docker-compose up -d

# Run health checks
curl http://localhost:5000/api/auth/health
curl http://localhost:4200/health

# Stop services
docker-compose down
```

### API Testing with Postman/Newman
Collection available for automated API testing covering:
- Authentication workflows
- CRUD operations
- Error scenarios
- Security validation

## 🚀 Running All Tests

### Comprehensive Test Script
```bash
# Run all tests
./run-tests.sh

# Run specific test suites
./run-tests.sh backend
./run-tests.sh frontend
./run-tests.sh integration

# Clean test artifacts
./run-tests.sh clean
```

### Environment Variables
```bash
# Enable test execution in build scripts
export RUN_TESTS=true

# Set coverage thresholds
export COVERAGE_THRESHOLD=85

# Generate detailed reports
export GENERATE_REPORTS=true
```

## 📈 Continuous Integration

### GitHub Actions
Both repositories include GitHub Actions workflows:

**Backend Workflow** (`.github/workflows/tests.yml`):
- .NET 8 setup
- Dependency restoration
- Unit and integration tests
- Coverage reporting
- Artifact upload

**Frontend Workflow** (`.github/workflows/tests.yml`):
- Node.js 18 setup
- Dependency installation
- Linting and testing
- Coverage reporting
- Artifact upload

### Build Integration
Tests are integrated into Docker build process:
```bash
# Build with tests
RUN_TESTS=true ./build.sh

# Build and push to ECR with tests
RUN_TESTS=true ECR_REGISTRY=your-registry ./build.sh
```

## 🛡️ Security Testing

### Authentication Tests
- JWT token validation
- User authorization
- Session management
- CORS configuration

### Data Security Tests
- User data isolation
- Input validation
- SQL injection prevention
- XSS protection

## 📊 Test Reports

### Coverage Reports
- **Backend**: XML and HTML reports in `TestResults/`
- **Frontend**: HTML reports in `coverage/`
- **Combined**: Codecov integration for unified reporting

### Test Results
- **Backend**: TRX format reports
- **Frontend**: Karma JSON reports
- **CI/CD**: JUnit XML for pipeline integration

## 🔍 Test Data Management

### Test Users
```typescript
// Predefined test users for consistent testing
const testUsers = {
  cognitoUser: { id: 'cognito-123', provider: 'Cognito' },
  azureUser: { id: 'azure-456', provider: 'AzureAD' }
};
```

### Test Todos
```csharp
// Sample test data for consistent testing
var testTodos = new[]
{
    new TodoItem { Title = "Test Todo 1", Description = "Description 1" },
    new TodoItem { Title = "Test Todo 2", Description = "Description 2", IsCompleted = true }
};
```

## 🐛 Debugging Tests

### Backend Debugging
```bash
# Run tests with debugger
dotnet test --logger "console;verbosity=detailed"

# Run specific test with debugging
dotnet test --filter "MethodName=CreateTodo_WithValidRequest_ReturnsCreatedAtAction"
```

### Frontend Debugging
```bash
# Run tests with browser debugging
ng test --browsers Chrome

# Run single test file
ng test --include="**/auth.service.spec.ts"
```

## 📝 Test Best Practices

### AAA Pattern
All tests follow the Arrange-Act-Assert pattern:
```csharp
[Fact]
public async Task CreateTodo_WithValidRequest_ReturnsCreatedAtAction()
{
    // Arrange
    var request = new CreateTodoRequest { Title = "Test", Description = "Test" };
    
    // Act
    var result = await _controller.CreateTodo(request);
    
    // Assert
    result.Should().BeOfType<CreatedAtActionResult>();
}
```

### Test Naming Convention
- Method name describes the scenario
- Clear expected outcome
- Descriptive test data

### Mocking Strategy
- Mock external dependencies
- Use real objects for domain logic
- Verify interactions with mocks

## 🎯 Quality Gates

### Definition of Done
- [ ] All tests pass
- [ ] Code coverage meets threshold (85%+)
- [ ] No critical security vulnerabilities
- [ ] Performance benchmarks met
- [ ] Documentation updated

### Pre-commit Hooks
- Run linting
- Execute fast tests
- Validate code coverage
- Check security vulnerabilities

## 📚 Additional Resources

- [xUnit Documentation](https://xunit.net/)
- [Angular Testing Guide](https://angular.io/guide/testing)
- [Moq Documentation](https://github.com/moq/moq4)
- [Jasmine Documentation](https://jasmine.github.io/)
- [FluentAssertions Documentation](https://fluentassertions.com/)

## 🤝 Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all existing tests pass
3. Add integration tests for new endpoints
4. Update test documentation
5. Maintain coverage thresholds

---

This comprehensive testing suite ensures the reliability, security, and maintainability of the Todo application across all layers.