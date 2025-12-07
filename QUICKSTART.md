# Quick Start Guide

## ✅ Code Ready
All code is synced and ready!

## 📋 Manual Steps Required

### 1. Install PostgreSQL (Manual)
1. Download PostgreSQL 16 from: https://www.postgresql.org/download/windows/
2. Run installer
3. Set password for `postgres` user
4. Keep default port: 5432

### 2. Create Database (Run in pgAdmin or psql)
Open the SQL file we created:
```
d:\pmq\web-server\database\setup-db.sql
```

Or manually run:
```sql
CREATE DATABASE pmq_database;
CREATE USER pmq_user WITH PASSWORD 'PMQ_Secure_Password_2024!';
GRANT ALL PRIVILEGES ON DATABASE pmq_database TO pmq_user;
```

### 3. Update .env
Edit `d:\pmq\web-server\.env`:
```
DB_PASSWORD=PMQ_Secure_Password_2024!
SESSION_SECRET=YourRandom32CharactersHerePlease123456
```

### 4. Run Commands (I'll do this)
```bash
cd d:\pmq\web-server
npm install          # Install dependencies
npm run migrate      # Create tables
npm run build:client # Build frontend
npm start            # Start server
```

## 🎯 After Setup
- Access: http://localhost:3000
- Login: admin / admin
- **CHANGE PASSWORD IMMEDIATELY!**

## Need Help?
Let me know if you encounter any errors!
