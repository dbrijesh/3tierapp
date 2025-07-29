# 🚀 Quick Start Guide - Todo Application

## ⚡ 5-Minute Setup

Get your Todo application running in 5 minutes with this streamlined guide.

## 📋 Prerequisites Check

```bash
# Check if you have the required tools
node --version    # Should be 18+
npm --version     # Should be 9+
docker --version  # Should be 20+
dotnet --version  # Should be 8.0+
```

If missing any tools, see the [full setup guide](./SETUP_GUIDE.md).

## 🔧 Step 1: Environment Setup

### Copy and Configure Environment
```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit with your credentials (required for authentication)
nano .env
```

### Minimal Configuration
Replace these values in `.env`:
```bash
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=your-cognito-client-id
AZURE_TENANT_ID=your-tenant-id  
AZURE_CLIENT_ID=your-azure-client-id
```

## 🐳 Step 2: Start with Docker (Easiest)

```bash
# Start all services
docker-compose up -d

# Wait ~30 seconds for services to start
sleep 30

# Check if services are running
docker-compose ps
```

**Access your application:**
- Frontend: http://localhost:4200
- Backend API: http://localhost:5000

## 🏃‍♂️ Step 3: Alternative - Manual Start

### If you prefer running without Docker:

#### Terminal 1 - Backend:
```bash
cd todo-backend-repo
dotnet restore
dotnet run
```

#### Terminal 2 - Frontend:
```bash
cd todo-frontend-repo
npm install
npm start
```

## ✅ Step 4: Verify Setup

### Test Backend API:
```bash
curl http://localhost:5000/api/auth/health
# Expected: {"status":"healthy","timestamp":"..."}
```

### Test Frontend:
1. Open http://localhost:4200
2. You should see login page with two SSO buttons
3. Click either "Sign in with AWS Cognito" or "Sign in with Azure AD"

## 🧪 Step 5: Run Tests (Optional)

```bash
# Run all tests
./run-tests.sh

# Or run specific tests
./run-tests.sh backend   # Backend only
./run-tests.sh frontend  # Frontend only
```

## 🎯 What You Should See

### 1. Login Page
- Clean interface with two authentication buttons
- "Sign in with AWS Cognito" button (blue)
- "Sign in with Azure AD" button (gray)

### 2. After Authentication
- Dashboard with welcome message
- User's name and email displayed
- "Manage Todos" button

### 3. Todo Management
- Create new todos with title and description
- View all todos in a list format
- Edit todos inline
- Mark todos as complete/incomplete
- Delete todos with confirmation

## 🚨 Troubleshooting

### Services Won't Start?
```bash
# Check what's using the ports
netstat -an | grep :4200
netstat -an | grep :5000

# Stop conflicting services or change ports in docker-compose.yml
```

### Authentication Not Working?
1. Verify `.env` file has correct values
2. Check Cognito User Pool is active
3. Ensure Azure AD app registration is complete
4. Verify redirect URIs match exactly: `http://localhost:4200/callback`

### Frontend Build Errors?
```bash
# Clear cache and reinstall
cd todo-frontend-repo
rm -rf node_modules package-lock.json
npm install
```

### Backend API Errors?
```bash
# Check .NET version
dotnet --version

# Restore packages
cd todo-backend-repo
dotnet restore
dotnet build
```

## 📱 Test the Application

### 1. Authentication Flow
- Click "Sign in with AWS Cognito"
- Complete OAuth flow in popup/redirect
- Should return to dashboard with user info

### 2. Todo Operations
- Click "Manage Todos"
- Create a todo: "Test Todo" with description
- Edit the todo title
- Mark as complete
- Delete the todo

### 3. Security Testing
- Try accessing `/todos` directly without login
- Should redirect to `/login`
- After login, should access todos successfully

## 🔧 Development Mode

### Enable Hot Reload:
```bash
# Frontend (auto-enabled with npm start)
cd todo-frontend-repo
npm start

# Backend (with watch mode)
cd todo-backend-repo
dotnet watch run
```

### View Logs:
```bash
# Docker logs
docker-compose logs -f todo-backend
docker-compose logs -f todo-frontend

# Or view all logs
docker-compose logs -f
```

## 🚀 Next Steps

Once everything is working:

1. **Customize the UI**: Edit components in `todo-frontend-repo/src/app/components/`
2. **Add Features**: Extend the todo model or add new endpoints
3. **Configure Production**: Update environment files for production deployment
4. **Set up CI/CD**: Use the included GitHub Actions workflows
5. **Deploy**: Follow the deployment section in [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## 📚 Additional Resources

- **[Full Setup Guide](./SETUP_GUIDE.md)**: Comprehensive setup instructions
- **[Testing Guide](./TESTING.md)**: Run and write tests
- **[Main README](./README.md)**: Project architecture and deployment
- **[Test Report](./TEST_VALIDATION_REPORT.md)**: Validation results

## 🆘 Need Help?

### Check These First:
1. All services running: `docker-compose ps`
2. Ports available: `netstat -an | grep -E ':(4200|5000)'`
3. Environment variables set: `cat .env`
4. Browser console for frontend errors
5. Container logs: `docker-compose logs`

### Common Solutions:
```bash
# Restart everything
docker-compose down
docker-compose up -d

# Clear everything and start fresh
docker-compose down -v
docker system prune -f
docker-compose up -d --build
```

---

## ✨ Success Checklist

- [ ] ✅ Services started successfully
- [ ] ✅ Frontend loads at http://localhost:4200
- [ ] ✅ Backend health check responds
- [ ] ✅ Login page displays correctly
- [ ] ✅ Authentication redirects work
- [ ] ✅ Todo operations function properly
- [ ] ✅ Tests pass (optional)

**🎉 Congratulations! Your Todo application is ready to use!**

For production deployment and advanced configuration, see the [complete setup guide](./SETUP_GUIDE.md).