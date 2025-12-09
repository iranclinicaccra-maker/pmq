-- Run this in PostgreSQL (pgAdmin or psql)
-- Step 1: Create Database and User

CREATE DATABASE pmq_database
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'English_United States.1252'
    LC_CTYPE = 'English_United States.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Step 2: Create User
CREATE USER pmq_user WITH PASSWORD 'PMQ_Secure_Password_2024!';

-- Step 3: Grant Privileges
GRANT ALL PRIVILEGES ON DATABASE pmq_database TO pmq_user;

-- Step 4: Connect to pmq_database and grant schema privileges
\c pmq_database
GRANT ALL ON SCHEMA public TO pmq_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pmq_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pmq_user;

-- Done! Now update .env file with:
-- DB_PASSWORD=PMQ_Secure_Password_2024!
