-- Users Table (Auth & Roles)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) CHECK(role IN ('admin', 'manager', 'technician')) DEFAULT 'technician',
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session Table (for connect-pg-simple)
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX "IDX_session_expire" ON "session" ("expire");

-- Locations Table (Hierarchy)
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES locations(id) ON DELETE CASCADE
);

-- Assets Table (Equipment)
CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    model VARCHAR(255),
    serial_number VARCHAR(255),
    manufacturer VARCHAR(255),
    purchase_date DATE,
    price DECIMAL(10, 2),
    warranty_expiry DATE,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active', -- Removed CHECK constraint to support retired/broken
    image_url TEXT,
    notes TEXT,
    registration_number VARCHAR(255),
    last_calibration_date DATE,
    next_calibration_date DATE,
    vendor_name VARCHAR(255),
    vendor_contact VARCHAR(255),
    vendor_phone VARCHAR(255),
    vendor_address TEXT,
    technician_name VARCHAR(255),
    technician_phone VARCHAR(255),
    technician_address TEXT,
    manual_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parts Table (Inventory)
CREATE TABLE IF NOT EXISTS parts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    part_number VARCHAR(255),
    quantity INTEGER DEFAULT 0,
    min_quantity INTEGER DEFAULT 0,
    cost DECIMAL(10, 2) DEFAULT 0,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PM Plans (Preventive Maintenance Patterns)
CREATE TABLE IF NOT EXISTS pm_plans (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    frequency_days INTEGER,
    checklist JSONB,
    next_due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work Orders (Jobs)
CREATE TABLE IF NOT EXISTS work_orders (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL,
    type VARCHAR(50) CHECK(type IN ('pm', 'repair', 'installation')) NOT NULL,
    priority VARCHAR(50) CHECK(priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status VARCHAR(50) CHECK(status IN ('open', 'in_progress', 'on_hold', 'completed', 'closed')) DEFAULT 'open',
    assigned_to INTEGER REFERENCES users(id),
    description TEXT,
    notes TEXT,
    cost DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    completed_date DATE
);

-- Work Order Parts (Consumption)
CREATE TABLE IF NOT EXISTS wo_parts (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    part_id INTEGER NOT NULL REFERENCES parts(id),
    quantity_used INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    entity_name VARCHAR(255),
    changes JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Application Settings
CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    notification_window_days INTEGER DEFAULT 30,
    default_currency VARCHAR(10) DEFAULT 'USD',
    data_storage VARCHAR(50) CHECK(data_storage IN ('local', 'server')) DEFAULT 'server',
    auto_backup_enabled BOOLEAN DEFAULT FALSE,
    last_backup_date TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_assets_location ON assets(location_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_calibration ON assets(next_calibration_date);
CREATE INDEX IF NOT EXISTS idx_assets_serial ON assets(serial_number);
CREATE INDEX IF NOT EXISTS idx_assets_created ON assets(created_at);
CREATE INDEX IF NOT EXISTS idx_work_orders_asset ON work_orders(asset_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned ON work_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- Insert default settings
INSERT INTO app_settings (id, notification_window_days, default_currency, data_storage, auto_backup_enabled) 
VALUES (1, 30, 'USD', 'server', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Default Admin User (password: admin)
-- Hash generated with bcrypt cost 10: $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO users (username, password_hash, full_name, role, email) 
VALUES ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin', 'admin@example.com')
ON CONFLICT (username) DO NOTHING;
