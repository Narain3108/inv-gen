# 🎯 QUICK START GUIDE

## ⚡ 5-Minute Setup

### 1. Install & Configure (2 minutes)

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edit `.env` - **Only change these**:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/invoice_db
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

### 2. Run Django (2 minutes)

```powershell
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8000
```

### 3. Test API (1 minute)

Visit: http://localhost:8000/api/docs/

Register a user:
```
POST /api/auth/register/
{
  "email": "test@example.com",
  "password": "test123456",
  "password2": "test123456",
  "name": "Test User"
}
```

---

## 🔥 Firebase → Django Migration Map

| What You Did Before | What You Do Now |
|---------------------|----------------|
| `import { db } from '@/lib/firebase'` | `import { djangoAPI } from '@/lib/api/django-client'` |
| `getDocs(collection(db, 'companies'))` | `djangoAPI.getCompanies()` |
| `addDoc(collection(db, 'companies'), data)` | `djangoAPI.createCompany(data)` |
| `updateDoc(doc(db, 'companies', id), data)` | `djangoAPI.updateCompany(id, data)` |
| `deleteDoc(doc(db, 'companies', id))` | `djangoAPI.deleteCompany(id)` |
| `signInWithEmailAndPassword(auth, email, password)` | `djangoAPI.login(email, password)` |
| `uploadToCloudinary(file)` (client-side) | `djangoAPI.uploadImage(file)` (server-side) |

---

## 📂 Project Structure

```
Invoice-generator/
├── backend/                    ← NEW Django Backend
│   ├── apps/
│   │   ├── users/             ← Auth (JWT)
│   │   ├── companies/         ← Companies CRUD
│   │   ├── clients/           ← Clients CRUD
│   │   ├── products/          ← Products CRUD
│   │   ├── categories/        ← Categories CRUD
│   │   ├── invoices/          ← Invoices CRUD + Payments
│   │   ├── quotations/        ← Quotations CRUD + Conversion
│   │   └── uploads/           ← Cloudinary Server-Side
│   ├── config/
│   │   ├── settings.py        ← Django settings
│   │   └── urls.py            ← API routes
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env                   ← Your config
│   └── README.md              ← Full documentation
│
└── src/                        ← Next.js Frontend (Update this)
    ├── lib/
    │   ├── api/
    │   │   └── django-client.ts  ← NEW: Add this
    │   └── firebase/          ← OLD: Delete this folder
    └── ...
```

---

## 🔧 Common Commands

```powershell
# Start backend
cd backend
venv\Scripts\activate
python manage.py runserver 8000

# Create new migration
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Django shell
python manage.py shell

# Run tests
python manage.py test
```

---

## 🌐 API Endpoints Cheatsheet

### Auth
```
POST /api/auth/register/       → Register user
POST /api/auth/login/          → Get JWT tokens
POST /api/auth/refresh/        → Refresh token
GET  /api/auth/profile/        → User profile
```

### Data (All follow same pattern)
```
GET    /api/{resource}/           → List all
POST   /api/{resource}/           → Create
GET    /api/{resource}/{id}/      → Get by ID
PUT    /api/{resource}/{id}/      → Update
DELETE /api/{resource}/{id}/      → Delete

Resources: companies, clients, products, categories, invoices, quotations
```

### Filters
```
GET /api/clients/?company_id=xxx
GET /api/products/?company_id=xxx
GET /api/invoices/?company_id=xxx
```

### Special
```
POST /api/invoices/{id}/add_payment/               → Add payment
POST /api/quotations/{id}/convert_to_invoice/      → Convert
POST /api/uploads/image/                           → Upload image
```

---

## 🐛 Troubleshooting

### Database Connection Failed
```powershell
# Install PostgreSQL
choco install postgresql

# Or use SQLite for development
# In .env:
DATABASE_URL=sqlite:///db.sqlite3
```

### CORS Errors
```env
# In .env, add your frontend URL:
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Migrations Error
```powershell
# Delete migrations and rebuild
python manage.py migrate --fake-initial
```

### Module Not Found
```powershell
# Reinstall dependencies
pip install -r requirements.txt
```

---

## 📖 Full Documentation

- **Backend Setup**: `backend/README.md`
- **Migration Guide**: `backend/MIGRATION_GUIDE.md`
- **API Docs (Swagger)**: http://localhost:8000/api/docs/

---

## ✅ Verification Checklist

After setup, verify:

```powershell
# 1. Backend running
curl http://localhost:8000/api/docs/

# 2. Can register user
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234","password2":"test1234","name":"Test"}'

# 3. Can create company
curl -X GET http://localhost:8000/api/companies/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

All working? **You're ready to migrate your Next.js frontend!** 🎉

---

## 🆘 Need Help?

1. Check logs: `backend/logs/django.log`
2. Django admin: http://localhost:8000/admin/
3. API docs: http://localhost:8000/api/docs/
4. Run tests: `python manage.py test`

---

**Your complete Django backend is ready! No more Firebase client SDK! 🔥→🐍**
