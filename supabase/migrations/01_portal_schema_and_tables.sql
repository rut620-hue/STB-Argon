-- =============================================================================
-- Migration: 01_portal_schema_and_tables.sql
-- Description: สร้าง Schema portal, ตารางทั้ง 8 ตาราง (ครบ 68 คอลัมน์), Sequences,
--              PostgREST Grants, และ Indexes ทั้งหมด
-- Project: STB APP n2 (Central Portal & SSO)
-- Database: Supabase PostgreSQL 17.11
-- =============================================================================

-- 1. เปิดใช้งาน Extensions ที่จำเป็น
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. สร้าง Schema portal
CREATE SCHEMA IF NOT EXISTS portal;

-- 3. ตั้งค่า PostgREST Expose Schema และกำหนดสิทธิ์
DO $$
BEGIN
    EXECUTE 'ALTER ROLE authenticator SET pgrst.db_schemas = ''public, storage, graphql_public, portal''';
    NOTIFY pgrst, 'reload config';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not set pgrst.db_schemas on authenticator: %', SQLERRM;
END $$;

GRANT USAGE ON SCHEMA portal TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA portal GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA portal GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA portal GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 4. สร้าง Sequences สำหรับสร้าง Custom ID อัตโนมัติ (Zero-Padding 4 หลัก)
CREATE SEQUENCE IF NOT EXISTS portal.seq_personnel START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS portal.seq_tokens START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS portal.seq_webapps START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS portal.seq_reference START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS portal.seq_positions START WITH 1 INCREMENT BY 1;

-- ฟังก์ชันช่วย Generate Custom ID
CREATE OR REPLACE FUNCTION portal.fn_next_personnel_id()
RETURNS varchar(50) LANGUAGE sql AS $$
    SELECT 'PS' || LPAD(nextval('portal.seq_personnel')::text, 4, '0');
$$;

CREATE OR REPLACE FUNCTION portal.fn_next_token_id()
RETURNS varchar(50) LANGUAGE sql AS $$
    SELECT 'TK' || LPAD(nextval('portal.seq_tokens')::text, 4, '0');
$$;

CREATE OR REPLACE FUNCTION portal.fn_next_webapp_id()
RETURNS varchar(50) LANGUAGE sql AS $$
    SELECT 'APP' || LPAD(nextval('portal.seq_webapps')::text, 4, '0');
$$;

CREATE OR REPLACE FUNCTION portal.fn_next_reference_id()
RETURNS varchar(50) LANGUAGE sql AS $$
    SELECT 'REF' || LPAD(nextval('portal.seq_reference')::text, 4, '0');
$$;

CREATE OR REPLACE FUNCTION portal.fn_next_pos_id()
RETURNS varchar(50) LANGUAGE sql AS $$
    SELECT 'POS' || LPAD(nextval('portal.seq_positions')::text, 4, '0');
$$;

-- =============================================================================
-- 5. สร้างตารางทั้ง 8 ตาราง (ครบ 68 คอลัมน์ตาม Wiki/Database_Schema.md)
-- =============================================================================

-- ตารางที่ 1: portal.personnel (20 คอลัมน์)
CREATE TABLE IF NOT EXISTS portal.personnel (
    personnel_id            VARCHAR(50) PRIMARY KEY DEFAULT portal.fn_next_personnel_id(),
    id_card_number          VARCHAR(13) NOT NULL UNIQUE,
    prefix                  VARCHAR(50) DEFAULT '',
    first_name              VARCHAR(100) NOT NULL,
    last_name               VARCHAR(100) NOT NULL,
    position_type           VARCHAR(100) DEFAULT '',
    position                VARCHAR(150) DEFAULT '',
    position_level          VARCHAR(100) DEFAULT '',
    position_2              VARCHAR(200) DEFAULT '',
    bureau_name             VARCHAR(150) DEFAULT 'สำนักเทศกิจ',
    office                  VARCHAR(150) DEFAULT '',
    department              VARCHAR(150) DEFAULT '',
    division                VARCHAR(150) DEFAULT '',
    start_service_year_be   VARCHAR(10) DEFAULT '',
    current_salary          NUMERIC(12,2) DEFAULT 0.00,
    signature_url           TEXT DEFAULT '',
    photo_url               TEXT DEFAULT '',
    status                  VARCHAR(50) DEFAULT 'ทำงานอยู่',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- ตารางที่ 2: portal.users (11 คอลัมน์)
CREATE TABLE IF NOT EXISTS portal.users (
    personnel_ref_id        VARCHAR(50) PRIMARY KEY REFERENCES portal.personnel(personnel_id) ON DELETE CASCADE,
    username                VARCHAR(100) NOT NULL UNIQUE,
    email                   VARCHAR(255) NOT NULL UNIQUE,
    password_salt           TEXT NOT NULL,
    password_hash           VARCHAR(64) NOT NULL,
    role                    VARCHAR(20) NOT NULL DEFAULT 'USER',
    status                  VARCHAR(50) NOT NULL DEFAULT 'รอการยืนยันอีเมล',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_login_at           TIMESTAMPTZ,
    username_changed        BOOLEAN NOT NULL DEFAULT FALSE
);

-- ตารางที่ 3: portal.security_tokens (10 คอลัมน์)
CREATE TABLE IF NOT EXISTS portal.security_tokens (
    token_id                VARCHAR(50) PRIMARY KEY DEFAULT portal.fn_next_token_id(),
    user_id                 VARCHAR(50) NOT NULL,
    token_type              VARCHAR(50) NOT NULL,
    token_string            VARCHAR(255) NOT NULL UNIQUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    expiry_date             TIMESTAMPTZ NOT NULL,
    is_used                 BOOLEAN NOT NULL DEFAULT FALSE,
    ref_app_id              VARCHAR(50) DEFAULT '',
    expires_at              TIMESTAMPTZ,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE
);

-- ตารางที่ 4: portal.webapps (7 คอลัมน์)
CREATE TABLE IF NOT EXISTS portal.webapps (
    webapp_id               VARCHAR(50) PRIMARY KEY DEFAULT portal.fn_next_webapp_id(),
    name                    VARCHAR(150) NOT NULL,
    url                     TEXT NOT NULL,
    icon_url                TEXT DEFAULT '',
    status                  VARCHAR(50) NOT NULL DEFAULT 'เปิดใช้งาน',
    description             TEXT DEFAULT '',
    sort_order              INTEGER NOT NULL DEFAULT 0
);

-- ตารางที่ 5: portal.permissions (3 คอลัมน์)
CREATE TABLE IF NOT EXISTS portal.permissions (
    personnel_ref_id        VARCHAR(50) NOT NULL REFERENCES portal.personnel(personnel_id) ON DELETE CASCADE,
    webapp_id               VARCHAR(50) NOT NULL REFERENCES portal.webapps(webapp_id) ON DELETE CASCADE,
    access_level            VARCHAR(20) NOT NULL DEFAULT 'USER',
    PRIMARY KEY (personnel_ref_id, webapp_id)
);

-- ตารางที่ 6: portal.system_settings (3 คอลัมน์)
CREATE TABLE IF NOT EXISTS portal.system_settings (
    key                     VARCHAR(100) PRIMARY KEY,
    value                   TEXT DEFAULT '',
    description             TEXT DEFAULT ''
);

-- ตารางที่ 7: portal.reference_data (8 คอลัมน์)
CREATE TABLE IF NOT EXISTS portal.reference_data (
    reference_id            VARCHAR(50) PRIMARY KEY DEFAULT portal.fn_next_reference_id(),
    type                    VARCHAR(50) NOT NULL,
    value                   VARCHAR(200) NOT NULL,
    short_name              VARCHAR(50) DEFAULT '',
    parent_type             VARCHAR(50) DEFAULT '',
    parent_value            VARCHAR(200) DEFAULT '',
    sort_order              INTEGER NOT NULL DEFAULT 0,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE
);

-- ตารางที่ 8: portal.position_structure (6 คอลัมน์)
CREATE TABLE IF NOT EXISTS portal.position_structure (
    pos_id                  VARCHAR(50) PRIMARY KEY DEFAULT portal.fn_next_pos_id(),
    position_type           VARCHAR(100) NOT NULL,
    position_name           VARCHAR(150) NOT NULL,
    position_level          VARCHAR(100) NOT NULL DEFAULT 'ไม่มีระดับ',
    sort_order              INTEGER NOT NULL DEFAULT 0,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE
);

-- =============================================================================
-- 6. สร้าง Indexes ประสิทธิภาพสูงสำหรับการค้นหา
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON portal.users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON portal.users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_role_status ON portal.users (role, status);

CREATE INDEX IF NOT EXISTS idx_personnel_id_card ON portal.personnel (id_card_number);
CREATE INDEX IF NOT EXISTS idx_personnel_office ON portal.personnel (office, department, division);

CREATE INDEX IF NOT EXISTS idx_tokens_string ON portal.security_tokens (token_string);
CREATE INDEX IF NOT EXISTS idx_tokens_lookup ON portal.security_tokens (token_type, is_used, expiry_date);
CREATE INDEX IF NOT EXISTS idx_tokens_user ON portal.security_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_ref_type_parent ON portal.reference_data (type, parent_value);
CREATE INDEX IF NOT EXISTS idx_pos_type ON portal.position_structure (position_type);
CREATE INDEX IF NOT EXISTS idx_perms_user ON portal.permissions (personnel_ref_id);
CREATE INDEX IF NOT EXISTS idx_perms_app ON portal.permissions (webapp_id);

-- 7. ให้สิทธิ์ Table, Sequences แก่ Roles ทั้งหมด
GRANT ALL ON ALL TABLES IN SCHEMA portal TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA portal TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA portal TO anon, authenticated, service_role;

