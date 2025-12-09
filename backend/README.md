# Medical PM Manager - Web Server Version

This is the web-based server version of the Medical PM Manager application, designed for deployment on Windows Server with PostgreSQL.

## Project Structure

- `server/`: Backend API (Express.js + PostgreSQL)
- `client/`: Frontend (React + Vite)
- `database/`: Database schema and migration scripts
- `uploads/`: Directory for uploaded files

## Setup Instructions

### 1. Database Setup (PostgreSQL)

1. Install PostgreSQL 12 or higher.
2. Create a database named `pmq_database`.
3. Create a user `pmq_user` with password `your_password` (or update `.env`).

```sql
CREATE DATABASE pmq_database;
CREATE USER pmq_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE pmq_database TO pmq_user;
```

### 2. Backend Setup

1. Open `d:\pmq\web-server` in terminal.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update DB credentials and SESSION_SECRET

4. Run database migrations:
   ```bash
   npm run migrate
   ```

### 3. Frontend Setup

**IMPORTANT:** You need to copy your existing frontend code to the `client` folder.

1. Copy the **contents** of your original `d:\pmq\src` folder to `d:\pmq\web-server\client\src`.
   - **Do NOT** overwrite `api.js` and `context/AuthContext.jsx` if asked (keep the ones created for web).
   - If you accidentally overwrite them, you can revert them or copy the code from `api.js` and `AuthContext.jsx` provided in this project.

2. Install client dependencies:
   ```bash
   cd client
   npm install
   ```

3. Build the frontend:
   ```bash
   npm run build
   ```

### 4. Running the Application

**Development:**
```bash
# In root folder
npm run dev
```

**Production:**
```bash
# In root folder
npm start
```

## Deployment on Windows Server

### Option 1: PM2 (Recommended)

1. Install PM2 globally: `npm install -g pm2`
2. Start the application:
   ```bash
   pm2 start ecosystem.config.js
   ```
3. Save for startup:
   ```bash
   pm2 save
   pm2 startup
   ```

### Option 2: IIS

1. Install **IIS** and **URL Rewrite Module**.
2. Install **Node.js** and **iisnode**.
3. Point a new IIS Site to `d:\pmq\web-server`.
4. Ensure `web.config` is in the root.
5. Ensure `IIS_IUSRS` has write permission to `uploads/` and `server/`.

## API Endpoints

- `POST /api/auth/login`: Login
- `GET /api/assets`: List assets
- `POST /api/query`: Execute SQL (Legacy support)
