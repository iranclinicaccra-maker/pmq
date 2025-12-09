-- Run this in pgAdmin (Query Tool) while connected to 'pmq_database'
-- You must be logged in as 'postgres' (superuser)

GRANT ALL ON SCHEMA public TO pmq_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pmq_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pmq_user;

-- Verify permissions
SELECT has_schema_privilege('pmq_user', 'public', 'CREATE');
