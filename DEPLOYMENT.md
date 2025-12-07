# Web Server Deployment Guide

## ✅ What's Done
All code is synced and ready for deployment:
- Database schema updated
- 7 API routes created
- Frontend fully synced (20 pages, 10 components)
- Configuration files created

## 🚀 Next Steps to Deploy

### Step 1: Install PostgreSQL
Download and install PostgreSQL 12+ from https://www.postgresql.org/download/windows/

### Step 2: Create Database
Open pgAdmin or psql and run:
```sql
CREATE DATABASE pmq_database;
CREATE USER pmq_user WITH PASSWORD 'YourSecurePassword123!';
GRANT ALL PRIVILEGES ON DATABASE pmq_database TO pmq_user;
```

### Step 3: Configure Environment
Edit `d:\pmq\web-server\.env`:
```env
DB_PASSWORD=YourSecurePassword123!
SESSION_SECRET=Generate32CharRandomStringHere
```

### Step 4: Install Dependencies
```bash
cd d:\pmq\web-server
npm install
```

### Step 5: Run Database Migration
```bash
npm run migrate
```

This creates all tables (users, assets, work_orders, parts, etc.)

### Step 6: Build Frontend
```bash
npm run build:client
```

### Step 7: Run Server
**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

**Access:**
- Local: http://localhost:3000
- Network: http://192.168.100.192:3000

Login: admin / admin (CHANGE PASSWORD!)

### Step 8: Configure Firewall
To allow other computers to access the server:
1. Open **Windows Defender Firewall with Advanced Security**.
2. Click **Inbound Rules** -> **New Rule**.
3. Select **Port** -> **TCP** -> Specific local ports: **3000**.
4. Allow the connection.
5. Name it "PMQ Web Server".

### Optional: PM2 for Production
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 📁 Project Structure
```
web-server/
├── server/          # Express backend
│   ├── routes/      # 11 API routes
│   └── config/      # Database config
├── client/          # React frontend
│   └── src/         # All pages & components (synced)
├── database/        # Schema & migrations
└── .env             # Configuration
```

## 🔐 Security Notes
1. Change admin password immediately
2. Use strong SESSION_SECRET
3. Keep DB_PASSWORD secure
4. Configure Windows Firewall for port 3000

## ✨ Features Available
- All desktop features (Equipment, Work Orders, PM Plans, Parts)
- Multi-user with roles (admin, manager, technician)
- Activity logging
- Notifications
- Reports & Dashboard
- Calibration tracking
- Retired/Broken status support
