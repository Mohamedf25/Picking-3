CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('picker', 'supervisor', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id INTEGER NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL CHECK (status IN ('in_progress', 'finished')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id),
    product_id INTEGER NOT NULL,
    sku VARCHAR(255) NOT NULL,
    expected_qty INTEGER NOT NULL,
    picked_qty INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id),
    line_id UUID NULL REFERENCES lines(id),
    url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('scan', 'photo', 'finish', 'error', 'exception_created', 'exception_approved', 'exception_rejected')),
    payload JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id),
    picker_id UUID NOT NULL REFERENCES users(id),
    supervisor_id UUID REFERENCES users(id),
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX idx_sessions_order_id ON sessions(order_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_lines_session_id ON lines(session_id);
CREATE INDEX idx_lines_sku ON lines(sku);
CREATE INDEX idx_photos_session_id ON photos(session_id);
CREATE INDEX idx_events_session_id ON events(session_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_exceptions_session_id ON exceptions(session_id);
CREATE INDEX idx_exceptions_status ON exceptions(status);

CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN warehouse_id UUID REFERENCES warehouses(id);
ALTER TABLE sessions ADD COLUMN warehouse_id UUID REFERENCES warehouses(id);

CREATE INDEX idx_users_warehouse_id ON users(warehouse_id);
CREATE INDEX idx_sessions_warehouse_id ON sessions(warehouse_id);

INSERT INTO warehouses (id, name, code, address) VALUES 
('660e8400-e29b-41d4-a716-446655440000', 'Almacén Principal', 'MAIN', 'Dirección del almacén principal');

INSERT INTO users (email, password_hash, role, warehouse_id) VALUES 
('admin@picking.com', '$2b$12$e9ZunD4BIOclyG2zSeihP.Ie8prZebWBGOzZ57gju3WiDvf0DS0R6', 'admin', '660e8400-e29b-41d4-a716-446655440000');
