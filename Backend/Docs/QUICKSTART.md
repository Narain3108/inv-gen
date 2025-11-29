# Quick Start Guide - Invoice Management API

## ⚡ 5-Minute Setup

### Step 1: Setup PostgreSQL Database
```powershell
# Install PostgreSQL if not already installed
# Download from: https://www.postgresql.org/download/windows/

# Create database
psql -U postgres
CREATE DATABASE invoice_db;
CREATE USER invoice_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE invoice_db TO invoice_user;
\q
```

### Step 2: Setup Python Environment
```powershell
# Navigate to Backend folder
cd Backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Configure Environment
```powershell
# Copy environment template
Copy-Item .env.example .env

# Edit .env file with your database credentials
# Update DATABASE_URL:
# DATABASE_URL=postgresql+asyncpg://invoice_user:your_password@localhost:5432/invoice_db
```

### Step 4: Run the API
```powershell
# Start the server
uvicorn app.main:app --reload

# Or use Python directly
python -m app.main
```

### Step 5: Test the API
Open your browser:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 🧪 Test with Sample Data

### Create a User
```powershell
curl -X POST http://localhost:8000/api/v1/users -H "Content-Type: application/json" -d '{\"email\":\"admin@test.com\",\"name\":\"Admin User\"}'
```

### Create a Company
```powershell
curl -X POST http://localhost:8000/api/v1/companies -H "Content-Type: application/json" -d '{\"user_id\":\"<USER_ID_FROM_ABOVE>\",\"name\":\"Test Company\",\"gstin\":\"27AAAAA1234A1Z5\",\"address\":{\"line1\":\"123 Main St\",\"city\":\"Mumbai\",\"state\":\"Maharashtra\",\"pincode\":\"400001\",\"country\":\"India\"},\"contact\":{\"email\":\"company@test.com\",\"phone\":\"+91-9876543210\"}}'
```

## 📝 Common Tasks

### View All Endpoints
Visit http://localhost:8000/docs for interactive API documentation

### Check Database Tables
```powershell
psql -U invoice_user -d invoice_db
\dt  # List tables
\d users  # Describe users table
```

### Reset Database (Development Only)
```powershell
# Drop and recreate
psql -U postgres
DROP DATABASE invoice_db;
CREATE DATABASE invoice_db;
\q
```

### Stop the Server
Press `Ctrl + C` in the terminal

### Deactivate Virtual Environment
```powershell
deactivate
```

## 🔧 Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running: `Get-Service postgresql*`
- Check credentials in `.env` file
- Test connection: `psql -U invoice_user -d invoice_db`

### Port 8000 Already in Use
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or use different port
uvicorn app.main:app --port 8001
```

### Module Import Errors
```powershell
# Ensure virtual environment is activated
.\venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

## 📦 Production Deployment

### Using Gunicorn (Linux)
```bash
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Using Docker
```powershell
docker build -t invoice-api .
docker run -p 8000:8000 --env-file .env invoice-api
```

## 🎯 Next Steps

1. **Add Authentication**: Implement JWT tokens or Firebase Auth
2. **Database Migrations**: Setup Alembic for schema versioning
3. **Add Tests**: Write pytest test cases
4. **API Rate Limiting**: Add throttling middleware
5. **Logging**: Configure structured logging
6. **Monitoring**: Add health checks and metrics

## 📚 Documentation

- Full README: `Backend/README.md`
- API Docs: http://localhost:8000/docs
- Postman Collection: Export from Swagger UI

---

**Ready to build your invoice management system! 🚀**
