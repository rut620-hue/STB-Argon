-- =============================================================================
-- Migration: 02_portal_rpc_and_seed.sql
-- Description: RPC Functions (Security Definer), First-Time Setup Guard,
--              38-field User Payload, SSO Handshake, Admin CRUD, Reset Test Data,
--              และ Seed ข้อมูลระบบเริ่มต้น (13 Settings, Org 4 Levels, Pos 6 Types)
-- Project: STB APP n2 (Central Portal & SSO)
-- Database: Supabase PostgreSQL 17.11
-- =============================================================================

-- =============================================================================
-- 1. Helper Functions
-- =============================================================================

-- 1.1 ตรวจเลขบัตรประชาชน 13 หลักด้วยสูตร Modulo-11
CREATE OR REPLACE FUNCTION portal.fn_validate_thai_id(p_id text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_clean text;
    v_sum integer := 0;
    v_i integer;
    v_check integer;
BEGIN
    v_clean := regexp_replace(COALESCE(p_id, ''), '\D', '', 'g');
    IF length(v_clean) != 13 THEN
        RETURN false;
    END IF;
    
    FOR v_i IN 1..12 LOOP
        v_sum := v_sum + (substring(v_clean from v_i for 1)::integer * (14 - v_i));
    END LOOP;
    
    v_check := (11 - (v_sum % 11)) % 10;
    RETURN v_check = substring(v_clean from 13 for 1)::integer;
END;
$$;

-- 1.2 รวมชื่อ-นามสกุลตามไวยากรณ์ไทย (นาย/นาง/นางสาว ติดชื่อ, คำนำหน้าอื่นเว้นวรรค)
CREATE OR REPLACE FUNCTION portal.fn_build_full_name(p_prefix text, p_first_name text, p_last_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_p text := trim(COALESCE(p_prefix, ''));
    v_f text := trim(COALESCE(p_first_name, ''));
    v_l text := trim(COALESCE(p_last_name, ''));
BEGIN
    IF v_f = '' AND v_l = '' THEN
        RETURN '';
    END IF;
    IF v_p = '' THEN
        RETURN trim(v_f || ' ' || v_l);
    END IF;
    IF v_p IN ('นาย', 'นาง', 'นางสาว') THEN
        RETURN v_p || v_f || ' ' || v_l;
    ELSE
        RETURN v_p || ' ' || v_f || ' ' || v_l;
    END IF;
END;
$$;

-- 1.3 แฮชรหัสผ่าน Salted SHA-256 (encode hex lowercase)
CREATE OR REPLACE FUNCTION portal.fn_hash_password(p_salt text, p_password text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = extensions, public
AS $$
BEGIN
    RETURN encode(digest(convert_to(COALESCE(p_salt, '') || '|' || COALESCE(p_password, ''), 'UTF8'), 'sha256'), 'hex');
END;
$$;

-- 1.4 สร้างโทเค็นสตริงสุ่มความปลอดภัยสูง (tk_ + 32 hex uuid + timestamp hex)
CREATE OR REPLACE FUNCTION portal.fn_generate_token_string()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = extensions, public
AS $$
BEGIN
    RETURN 'tk_' || replace(gen_random_uuid()::text, '-', '') || to_hex(extract(epoch from clock_timestamp())::bigint);
END;
$$;

-- 1.5 ตรวจสอบว่าในระบบมี SUPERADMIN ที่สถานะ 'ใช้งานปกติ' แล้วหรือไม่
CREATE OR REPLACE FUNCTION portal.fn_has_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = portal, public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM portal.users
        WHERE role = 'SUPERADMIN' AND status = 'ใช้งานปกติ'
    );
$$;

-- 1.6 สร้าง User Payload ครบทั้ง 38 ฟิลด์ (PascalCase & camelCase ตรงตาม Blueprint 100%)
CREATE OR REPLACE FUNCTION portal.fn_build_user_payload(p_personnel_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_personnel record;
    v_user record;
BEGIN
    SELECT * INTO v_personnel FROM portal.personnel WHERE personnel_id = p_personnel_id;
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    SELECT * INTO v_user FROM portal.users WHERE personnel_ref_id = p_personnel_id;

    RETURN jsonb_build_object(
        -- PascalCase Fields (Legacy & Sub-app Identity)
        'Username', COALESCE(v_user.username, ''),
        'Email', COALESCE(v_user.email, ''),
        'Role', COALESCE(v_user.role, 'USER'),
        'Status', COALESCE(v_user.status, 'ใช้งานปกติ'),
        'Status_Personnel', COALESCE(v_personnel.status, 'ทำงานอยู่'),
        'Prefix', COALESCE(v_personnel.prefix, ''),
        'First_Name', COALESCE(v_personnel.first_name, ''),
        'Last_Name', COALESCE(v_personnel.last_name, ''),
        'Position', COALESCE(v_personnel.position, ''),
        'Position_Level', COALESCE(v_personnel.position_level, ''),
        'Position_Type', COALESCE(v_personnel.position_type, ''),
        'Position_2', COALESCE(v_personnel.position_2, ''),
        'Bureau_Name', COALESCE(v_personnel.bureau_name, 'สำนักเทศกิจ'),
        'Division', COALESCE(v_personnel.division, ''),
        'Department', COALESCE(v_personnel.department, ''),
        'Office', COALESCE(v_personnel.office, ''),
        'Signature_URL', COALESCE(v_personnel.signature_url, ''),
        'Photo_URL', COALESCE(v_personnel.photo_url, ''),
        'Profile_Photo_URL', COALESCE(v_personnel.photo_url, ''),
        'User_ID', v_personnel.personnel_id,
        'Personnel_ID', v_personnel.personnel_id,
        'ID_Card_Number', COALESCE(v_personnel.id_card_number, ''),
        'Start_Service_Year_BE', COALESCE(v_personnel.start_service_year_be, ''),
        'Current_Salary', COALESCE(v_personnel.current_salary::text, '0'),
        'Username_Changed', COALESCE(v_user.username_changed, false),
        
        -- camelCase Fields (Modern Web & SDK)
        'userId', v_personnel.personnel_id,
        'role', COALESCE(v_user.role, 'USER'),
        'department', COALESCE(v_personnel.department, ''),
        'firstName', COALESCE(v_personnel.first_name, ''),
        'lastName', COALESCE(v_personnel.last_name, ''),
        'prefix', COALESCE(v_personnel.prefix, ''),
        'position', COALESCE(v_personnel.position, ''),
        'positionType', COALESCE(v_personnel.position_type, ''),
        'division', COALESCE(v_personnel.division, ''),
        'office', COALESCE(v_personnel.office, ''),
        'signatureUrl', COALESCE(v_personnel.signature_url, ''),
        'fullName', portal.fn_build_full_name(v_personnel.prefix, v_personnel.first_name, v_personnel.last_name),
        'positionLevel', COALESCE(v_personnel.position_level, ''),
        'profilePhotoUrl', COALESCE(v_personnel.photo_url, ''),
        'position2', COALESCE(v_personnel.position_2, ''),
        'bureauName', COALESCE(v_personnel.bureau_name, 'สำนักเทศกิจ'),
        'usernameChanged', COALESCE(v_user.username_changed, false)
    );
END;
$$;

-- 1.7 ตรวจสอบเซสชันผู้ใช้ หรือ Bypass ใน First-Time Setup Mode
CREATE OR REPLACE FUNCTION portal.fn_assert_session_or_setup(
    p_session_token text,
    p_min_role text DEFAULT 'USER'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_has_superadmin boolean;
    v_token_rec record;
    v_user record;
BEGIN
    v_has_superadmin := portal.fn_has_superadmin();
    
    -- ถ้ายังไม่มี SUPERADMIN ให้ Bypass เข้า Setup Mode อัตโนมัติ
    IF NOT v_has_superadmin THEN
        RETURN jsonb_build_object(
            'is_setup_mode', true,
            'role', 'SUPERADMIN',
            'user_id', 'SETUP_MODE',
            'username', 'First-Time Setup Bypass'
        );
    END IF;
    
    -- ถ้ามี SUPERADMIN แล้ว ต้องตรวจสอบ Session Token อย่างเข้มงวด
    IF p_session_token IS NULL OR trim(p_session_token) = '' THEN
        RAISE EXCEPTION 'SESSION_EXPIRED: กรุณาเข้าสู่ระบบใหม่อีกครั้ง';
    END IF;
    
    SELECT * INTO v_token_rec
    FROM portal.security_tokens
    WHERE token_string = p_session_token
      AND token_type = 'LOGIN_SESSION'
      AND is_used = false
      AND expiry_date > clock_timestamp();
      
    IF NOT FOUND THEN
        RAISE EXCEPTION 'SESSION_EXPIRED: เซสชันหมดอายุหรือไม่มีอยู่ในระบบ';
    END IF;
    
    SELECT * INTO v_user
    FROM portal.users
    WHERE personnel_ref_id = v_token_rec.user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'USER_NOT_FOUND: ไม่พบข้อมูลบัญชีผู้ใช้';
    END IF;
    
    IF v_user.status IN ('ระงับบัญชี', 'ระงับการใช้งาน') THEN
        RAISE EXCEPTION 'ACCOUNT_SUSPENDED: บัญชีนี้ถูกระงับการใช้งาน';
    END IF;
    
    IF p_min_role = 'SUPERADMIN' AND v_user.role != 'SUPERADMIN' THEN
        RAISE EXCEPTION 'FORBIDDEN: สิทธิ์ไม่เพียงพอ (ต้องเป็น SUPERADMIN เท่านั้น)';
    ELSIF p_min_role = 'ADMIN' AND v_user.role NOT IN ('ADMIN', 'SUPERADMIN') THEN
        RAISE EXCEPTION 'FORBIDDEN: สิทธิ์ไม่เพียงพอ (ต้องเป็น ADMIN ขึ้นไป)';
    END IF;
    
    RETURN jsonb_build_object(
        'is_setup_mode', false,
        'role', v_user.role,
        'user_id', v_user.personnel_ref_id,
        'username', v_user.username
    );
END;
$$;

-- =============================================================================
-- 2. System Init & Authentication RPCs
-- =============================================================================

-- 2.1 โหลดข้อมูลเริ่มต้นทั้งระบบ (Boot API: ตรวจสอบ Setup Mode + โหลด Settings + โครงสร้าง 4 ระดับ + ตำแหน่ง 6 ประเภท)
CREATE OR REPLACE FUNCTION portal.fn_check_system_init(p_session_token text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_has_superadmin boolean;
    v_settings jsonb;
    v_references jsonb;
    v_positions jsonb;
    v_user_payload jsonb := null;
    v_token_rec record;
    v_is_setup boolean := false;
BEGIN
    v_has_superadmin := portal.fn_has_superadmin();
    
    SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb)
    INTO v_settings
    FROM portal.system_settings;
    
    SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.type, r.sort_order, r.reference_id), '[]'::jsonb)
    INTO v_references
    FROM (
        SELECT reference_id, type, value, short_name, parent_type, parent_value, sort_order, is_active
        FROM portal.reference_data
        WHERE is_active = true
    ) r;
    
    SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.sort_order, p.pos_id), '[]'::jsonb)
    INTO v_positions
    FROM (
        SELECT pos_id, position_type, position_name, position_level, sort_order, is_active
        FROM portal.position_structure
        WHERE is_active = true
    ) p;
    
    IF NOT v_has_superadmin THEN
        v_is_setup := true;
        v_user_payload := jsonb_build_object(
            'role', 'SUPERADMIN',
            'Role', 'SUPERADMIN',
            'username', 'setup_admin',
            'Username', 'setup_admin',
            'is_setup', true,
            'is_setup_mode', true,
            'fullName', 'โหมดตั้งค่าระบบครั้งแรก (Setup Mode)',
            'Position', 'ผู้ดูแลระบบสูงสุด (ตั้งค่าเริ่มต้น)'
        );
    ELSIF p_session_token IS NOT NULL AND trim(p_session_token) != '' THEN
        SELECT * INTO v_token_rec
        FROM portal.security_tokens
        WHERE token_string = p_session_token
          AND token_type = 'LOGIN_SESSION'
          AND is_used = false
          AND expiry_date > clock_timestamp();
          
        IF FOUND THEN
            v_user_payload := portal.fn_build_user_payload(v_token_rec.user_id);
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'has_superadmin', v_has_superadmin,
        'is_setup_mode', v_is_setup,
        'settings', v_settings,
        'reference_data', v_references,
        'position_structure', v_positions,
        'user', v_user_payload
    );
END;
$$;

-- 2.2 เข้าสู่ระบบ (Login)
CREATE OR REPLACE FUNCTION portal.fn_login(p_username text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = portal, public, extensions
AS $$
DECLARE
    v_clean text := lower(trim(COALESCE(p_username, '')));
    v_user record;
    v_hash text;
    v_session_hours integer;
    v_token text;
    v_expiry timestamptz;
BEGIN
    IF v_clean = '' OR p_password IS NULL OR p_password = '' THEN
        RAISE EXCEPTION 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน';
    END IF;
    
    SELECT * INTO v_user
    FROM portal.users
    WHERE lower(username) = v_clean OR lower(email) = v_clean;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
    END IF;
    
    IF v_user.status = 'รอการยืนยันอีเมล' THEN
        RAISE EXCEPTION 'บัญชีนี้ยังไม่ได้รับการยืนยันอีเมล กรุณาตรวจสอบลิงก์ในอีเมลของท่าน';
    ELSIF v_user.status = 'รออนุมัติ' THEN
        RAISE EXCEPTION 'บัญชีนี้กำลังรอการอนุมัติจากผู้ดูแลระบบ';
    ELSIF v_user.status IN ('ระงับบัญชี', 'ระงับการใช้งาน') THEN
        RAISE EXCEPTION 'บัญชีนี้ถูกระงับการใช้งาน';
    END IF;
    
    v_hash := portal.fn_hash_password(v_user.password_salt, p_password);
    IF v_hash != v_user.password_hash THEN
        RAISE EXCEPTION 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
    END IF;
    
    SELECT COALESCE(NULLIF(value, '')::integer, 12) INTO v_session_hours
    FROM portal.system_settings
    WHERE key = 'Session_Hours';
    
    IF v_session_hours IS NULL OR v_session_hours <= 0 THEN
        v_session_hours := 12;
    END IF;
    
    v_token := portal.fn_generate_token_string();
    v_expiry := clock_timestamp() + (v_session_hours || ' hours')::interval;
    
    INSERT INTO portal.security_tokens (
        user_id, token_type, token_string, expiry_date, expires_at, is_used, is_active
    ) VALUES (
        v_user.personnel_ref_id, 'LOGIN_SESSION', v_token, v_expiry, v_expiry, false, true
    );
    
    UPDATE portal.users
    SET last_login_at = clock_timestamp()
    WHERE personnel_ref_id = v_user.personnel_ref_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'เข้าสู่ระบบสำเร็จ',
        'token', v_token,
        'role', v_user.role,
        'userId', v_user.personnel_ref_id,
        'mustChangeUsername', (v_user.role != 'SUPERADMIN' AND NOT COALESCE(v_user.username_changed, false)),
        'user', portal.fn_build_user_payload(v_user.personnel_ref_id)
    );
END;
$$;

-- 2.3 ออกจากระบบ (Logout)
CREATE OR REPLACE FUNCTION portal.fn_logout(p_session_token text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = portal, public
AS $$
BEGIN
    UPDATE portal.security_tokens
    SET is_used = true, is_active = false
    WHERE token_string = p_session_token;
    
    RETURN jsonb_build_object('success', true, 'message', 'ออกจากระบบสำเร็จ');
END;
$$;

-- 2.4 ตรวจสอบเลขบัตรประชาชนสำหรับหน้าสมัครสมาชิก (Step 1)
CREATE OR REPLACE FUNCTION portal.fn_check_id_card_for_register(p_id_card text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_id text;
    v_personnel record;
    v_user record;
BEGIN
    v_id := regexp_replace(trim(COALESCE(p_id_card, '')), '\D', '', 'g');
    
    IF NOT portal.fn_validate_thai_id(v_id) THEN
        RAISE EXCEPTION 'เลขบัตรประจำตัวประชาชนไม่ถูกต้องตามสูตรคำนวณ Modulo-11';
    END IF;
    
    SELECT * INTO v_personnel FROM portal.personnel WHERE id_card_number = v_id;
    
    IF FOUND THEN
        SELECT * INTO v_user FROM portal.users WHERE personnel_ref_id = v_personnel.personnel_id;
        IF FOUND THEN
            RAISE EXCEPTION 'เลขบัตรประชาชนนี้มีการลงทะเบียนบัญชีแล้ว (อีเมล: %)',
                substr(v_user.email, 1, 3) || '***@' || split_part(v_user.email, '@', 2);
        END IF;
        
        RETURN jsonb_build_object(
            'success', true,
            'exists', true,
            'has_account', false,
            'personnel', jsonb_build_object(
                'personnel_id', v_personnel.personnel_id,
                'prefix', v_personnel.prefix,
                'first_name', v_personnel.first_name,
                'last_name', v_personnel.last_name,
                'position', v_personnel.position,
                'position_level', v_personnel.position_level,
                'position_type', v_personnel.position_type,
                'position_2', v_personnel.position_2,
                'bureau_name', v_personnel.bureau_name,
                'office', v_personnel.office,
                'department', v_personnel.department,
                'division', v_personnel.division,
                'full_name', portal.fn_build_full_name(v_personnel.prefix, v_personnel.first_name, v_personnel.last_name)
            )
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'exists', false,
        'has_account', false,
        'personnel', null
    );
END;
$$;

-- 2.5 สมัครสมาชิก (Register User: รองรับทั้งผูกบุคลากรเดิมและสร้างบุคลากรใหม่)
CREATE OR REPLACE FUNCTION portal.fn_register_user(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = portal, public, extensions
AS $$
DECLARE
    v_id_card text;
    v_username text;
    v_email text;
    v_password text;
    v_personnel_id text;
    v_salt text;
    v_hash text;
    v_token text;
    v_verify_hours integer;
    v_expiry timestamptz;
    v_existing_personnel record;
BEGIN
    v_id_card := regexp_replace(trim(COALESCE(p_payload->>'id_card_number', '')), '\D', '', 'g');
    v_username := lower(trim(COALESCE(p_payload->>'username', '')));
    v_email := lower(trim(COALESCE(p_payload->>'email', '')));
    v_password := COALESCE(p_payload->>'password', '');
    
    IF NOT portal.fn_validate_thai_id(v_id_card) THEN
        RAISE EXCEPTION 'เลขบัตรประจำตัวประชาชนไม่ถูกต้องตามสูตรคำนวณ Modulo-11';
    END IF;
    
    IF v_username !~ '^[a-z0-9_.]+$' OR length(v_username) < 3 THEN
        RAISE EXCEPTION 'ชื่อผู้ใช้ต้องประกอบด้วยตัวอักษรพิมพ์เล็ก ตัวเลข จุด หรือขีดล่าง ความยาวอย่างน้อย 3 ตัวอักษร';
    END IF;
    
    IF v_email !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
        RAISE EXCEPTION 'รูปแบบอีเมลไม่ถูกต้อง';
    END IF;
    
    IF length(v_password) < 6 THEN
        RAISE EXCEPTION 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
    END IF;
    
    IF EXISTS (SELECT 1 FROM portal.users WHERE lower(username) = v_username) THEN
        RAISE EXCEPTION 'ชื่อผู้ใช้นี้ถูกใช้งานแล้วในระบบ';
    END IF;
    
    IF EXISTS (SELECT 1 FROM portal.users WHERE lower(email) = v_email) THEN
        RAISE EXCEPTION 'อีเมลนี้ถูกใช้งานแล้วในระบบ';
    END IF;
    
    SELECT * INTO v_existing_personnel
    FROM portal.personnel
    WHERE id_card_number = v_id_card;
    
    IF FOUND THEN
        IF EXISTS (SELECT 1 FROM portal.users WHERE personnel_ref_id = v_existing_personnel.personnel_id) THEN
            RAISE EXCEPTION 'เลขบัตรประชาชนนี้มีบัญชีผู้ใช้งานในระบบแล้ว';
        END IF;
        v_personnel_id := v_existing_personnel.personnel_id;
    ELSE
        INSERT INTO portal.personnel (
            id_card_number, prefix, first_name, last_name,
            position_type, position, position_level, position_2,
            bureau_name, office, department, division,
            start_service_year_be, status
        ) VALUES (
            v_id_card,
            trim(COALESCE(p_payload->>'prefix', '')),
            trim(COALESCE(p_payload->>'first_name', '')),
            trim(COALESCE(p_payload->>'last_name', '')),
            trim(COALESCE(p_payload->>'position_type', '')),
            trim(COALESCE(p_payload->>'position', '')),
            trim(COALESCE(p_payload->>'position_level', '')),
            trim(COALESCE(p_payload->>'position_2', '')),
            COALESCE(NULLIF(trim(p_payload->>'bureau_name'), ''), 'สำนักเทศกิจ'),
            trim(COALESCE(p_payload->>'office', '')),
            trim(COALESCE(p_payload->>'department', '')),
            trim(COALESCE(p_payload->>'division', '')),
            trim(COALESCE(p_payload->>'start_service_year_be', '')),
            'ทำงานอยู่'
        )
        RETURNING personnel_id INTO v_personnel_id;
    END IF;
    
    v_salt := replace(gen_random_uuid()::text, '-', '');
    v_hash := portal.fn_hash_password(v_salt, v_password);
    
    INSERT INTO portal.users (
        personnel_ref_id, username, email, password_salt, password_hash, role, status
    ) VALUES (
        v_personnel_id, v_username, v_email, v_salt, v_hash, 'USER', 'รอการยืนยันอีเมล'
    );
    
    SELECT COALESCE(NULLIF(value, '')::integer, 24) INTO v_verify_hours
    FROM portal.system_settings
    WHERE key = 'Verify_Email_Hours';
    
    IF v_verify_hours IS NULL OR v_verify_hours <= 0 THEN
        v_verify_hours := 24;
    END IF;
    
    v_token := portal.fn_generate_token_string();
    v_expiry := clock_timestamp() + (v_verify_hours || ' hours')::interval;
    
    INSERT INTO portal.security_tokens (
        user_id, token_type, token_string, expiry_date, expires_at, is_used, is_active
    ) VALUES (
        v_personnel_id, 'VERIFY_EMAIL', v_token, v_expiry, v_expiry, false, true
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'ลงทะเบียนสำเร็จ กรุณายืนยันอีเมลของท่าน',
        'verify_token', v_token,
        'email', v_email,
        'personnel_id', v_personnel_id
    );
END;
$$;

-- 2.6 ยืนยันอีเมล (Verify Email)
CREATE OR REPLACE FUNCTION portal.fn_verify_email(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_token_rec record;
BEGIN
    SELECT * INTO v_token_rec
    FROM portal.security_tokens
    WHERE token_string = p_token
      AND token_type = 'VERIFY_EMAIL'
      AND is_used = false
      AND expiry_date > clock_timestamp();
      
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ลิงก์ยืนยันอีเมลไม่ถูกต้องหรือหมดอายุแล้ว';
    END IF;
    
    UPDATE portal.security_tokens
    SET is_used = true, is_active = false
    WHERE token_id = v_token_rec.token_id;
    
    UPDATE portal.users
    SET status = 'รออนุมัติ', updated_at = clock_timestamp()
    WHERE personnel_ref_id = v_token_rec.user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'ยืนยันอีเมลสำเร็จ บัญชีของท่านอยู่ระหว่างรอผู้ดูแลระบบอนุมัติการใช้งาน'
    );
END;
$$;

-- 2.7 ร้องขอรีเซ็ตรหัสผ่าน (Request Password Reset)
CREATE OR REPLACE FUNCTION portal.fn_request_password_reset(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_email text := lower(trim(COALESCE(p_email, '')));
    v_user record;
    v_token text;
    v_mins integer;
    v_expiry timestamptz;
BEGIN
    SELECT * INTO v_user
    FROM portal.users
    WHERE lower(email) = v_email AND status = 'ใช้งานปกติ';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ไม่พบบัญชีผู้ใช้งานที่เชื่อมโยงกับอีเมลนี้ หรือบัญชียังไม่เปิดใช้งาน';
    END IF;
    
    SELECT COALESCE(NULLIF(value, '')::integer, 15) INTO v_mins
    FROM portal.system_settings
    WHERE key = 'Reset_Token_Minutes';
    
    IF v_mins IS NULL OR v_mins <= 0 THEN
        v_mins := 15;
    END IF;
    
    v_token := portal.fn_generate_token_string();
    v_expiry := clock_timestamp() + (v_mins || ' minutes')::interval;
    
    INSERT INTO portal.security_tokens (
        user_id, token_type, token_string, expiry_date, expires_at, is_used, is_active
    ) VALUES (
        v_user.personnel_ref_id, 'RESET_PASSWORD', v_token, v_expiry, v_expiry, false, true
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'สร้างลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว',
        'reset_token', v_token,
        'email', v_email
    );
END;
$$;

-- 2.8 ตั้งรหัสผ่านใหม่ (Reset Password)
CREATE OR REPLACE FUNCTION portal.fn_reset_password(p_token text, p_new_password text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = portal, public, extensions
AS $$
DECLARE
    v_token_rec record;
    v_salt text;
    v_hash text;
BEGIN
    IF length(COALESCE(p_new_password, '')) < 6 THEN
        RAISE EXCEPTION 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
    END IF;
    
    SELECT * INTO v_token_rec
    FROM portal.security_tokens
    WHERE token_string = p_token
      AND token_type = 'RESET_PASSWORD'
      AND is_used = false
      AND expiry_date > clock_timestamp();
      
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว';
    END IF;
    
    UPDATE portal.security_tokens
    SET is_used = true, is_active = false
    WHERE token_id = v_token_rec.token_id;
    
    v_salt := replace(gen_random_uuid()::text, '-', '');
    v_hash := portal.fn_hash_password(v_salt, p_new_password);
    
    UPDATE portal.users
    SET password_salt = v_salt,
        password_hash = v_hash,
        updated_at = clock_timestamp()
    WHERE personnel_ref_id = v_token_rec.user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'ตั้งรหัสผ่านใหม่สำเร็จ สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที'
    );
END;
$$;

-- =============================================================================
-- 3. SSO Handshake & Sub-App Public API RPCs
-- =============================================================================

-- 3.1 ดึงรายการเว็บแอปบน Dashboard ตามสิทธิ์
CREATE OR REPLACE FUNCTION portal.fn_get_dashboard_apps(p_session_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_session jsonb;
    v_is_super boolean;
    v_apps jsonb;
BEGIN
    v_session := portal.fn_assert_session_or_setup(p_session_token, 'USER');
    v_is_super := (v_session->>'is_setup_mode' = 'true' OR v_session->>'role' = 'SUPERADMIN');
    
    IF v_is_super THEN
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'webapp_id', w.webapp_id,
                'name', w.name,
                'url', w.url,
                'icon_url', w.icon_url,
                'description', w.description,
                'status', w.status,
                'sort_order', w.sort_order,
                'access_level', 'ADMIN'
            ) ORDER BY w.sort_order, w.name
        ), '[]'::jsonb)
        INTO v_apps
        FROM portal.webapps w
        WHERE w.status IN ('เปิดใช้งาน', 'ACTIVE');
    ELSE
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'webapp_id', w.webapp_id,
                'name', w.name,
                'url', w.url,
                'icon_url', w.icon_url,
                'description', w.description,
                'status', w.status,
                'sort_order', w.sort_order,
                'access_level', p.access_level
            ) ORDER BY w.sort_order, w.name
        ), '[]'::jsonb)
        INTO v_apps
        FROM portal.webapps w
        JOIN portal.permissions p ON p.webapp_id = w.webapp_id
        WHERE p.personnel_ref_id = (v_session->>'user_id')
          AND p.access_level != 'None'
          AND w.status IN ('เปิดใช้งาน', 'ACTIVE');
    END IF;
    
    RETURN jsonb_build_object('success', true, 'data', v_apps);
END;
$$;

-- 3.2 สร้าง Single-Use SSO Handshake Token อายุ 5 นาที
CREATE OR REPLACE FUNCTION portal.fn_generate_sso_token(p_session_token text, p_webapp_id text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_session jsonb;
    v_app record;
    v_lvl text;
    v_token text;
    v_expiry timestamptz;
BEGIN
    v_session := portal.fn_assert_session_or_setup(p_session_token, 'USER');
    IF v_session->>'is_setup_mode' = 'true' THEN
        RAISE EXCEPTION 'กรุณาสร้างข้อมูลบุคลากรและผูกบัญชี SUPERADMIN ให้เสร็จสิ้นก่อนเปิดเว็บแอปย่อย';
    END IF;
    
    SELECT * INTO v_app
    FROM portal.webapps
    WHERE webapp_id = p_webapp_id AND status IN ('เปิดใช้งาน', 'ACTIVE');
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ไม่พบแอปพลิเคชันหรือแอปพลิเคชันปิดปรับปรุง';
    END IF;
    
    IF v_session->>'role' != 'SUPERADMIN' THEN
        SELECT access_level INTO v_lvl
        FROM portal.permissions
        WHERE personnel_ref_id = (v_session->>'user_id') AND webapp_id = p_webapp_id;
        
        IF v_lvl IS NULL OR v_lvl = 'None' THEN
            RAISE EXCEPTION 'คุณไม่มีสิทธิ์เข้าใช้งานแอปพลิเคชันนี้';
        END IF;
    END IF;
    
    v_token := portal.fn_generate_token_string();
    v_expiry := clock_timestamp() + interval '5 minutes';
    
    INSERT INTO portal.security_tokens (
        user_id, token_type, token_string, expiry_date, expires_at, ref_app_id, is_used, is_active
    ) VALUES (
        v_session->>'user_id', 'SSO_HANDSHAKE', v_token, v_expiry, v_expiry, p_webapp_id, false, true
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'sso_token', v_token,
        'target_url', v_app.url,
        'redirect_url', v_app.url || (CASE WHEN v_app.url LIKE '%?%' THEN '&' ELSE '?' END) || 'sso_token=' || v_token
    );
END;
$$;

-- 3.3 ตรวจสอบบัตรผ่าน SSO (Single-Use Guard: มาร์ก is_used = true ทันที)
CREATE OR REPLACE FUNCTION portal.fn_verify_sso_handshake(p_sso_token text, p_webapp_id text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_token_rec record;
    v_payload jsonb;
    v_access_level text := 'USER';
BEGIN
    SELECT * INTO v_token_rec
    FROM portal.security_tokens
    WHERE token_string = p_sso_token
      AND token_type = 'SSO_HANDSHAKE'
      AND is_used = false
      AND expiry_date > clock_timestamp();
      
    IF NOT FOUND THEN
        RAISE EXCEPTION 'SSO_TOKEN_INVALID: โทเค็น SSO ไม่ถูกต้อง หมดอายุ หรือถูกใช้งานไปแล้ว';
    END IF;
    
    IF p_webapp_id IS NOT NULL AND trim(p_webapp_id) != '' AND v_token_rec.ref_app_id IS NOT NULL AND v_token_rec.ref_app_id != p_webapp_id THEN
        RAISE EXCEPTION 'SSO_TARGET_MISMATCH: โทเค็นนี้ไม่ได้ออกให้กับแอปพลิเคชันปลายทางนี้';
    END IF;
    
    UPDATE portal.security_tokens
    SET is_used = true, is_active = false
    WHERE token_id = v_token_rec.token_id;
    
    v_payload := portal.fn_build_user_payload(v_token_rec.user_id);
    
    IF (v_payload->>'Role') = 'SUPERADMIN' THEN
        v_access_level := 'ADMIN';
    ELSE
        SELECT COALESCE(access_level, 'USER') INTO v_access_level
        FROM portal.permissions
        WHERE personnel_ref_id = v_token_rec.user_id AND webapp_id = v_token_rec.ref_app_id;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'user', v_payload,
        'access_level', v_access_level,
        'target_app_id', v_token_rec.ref_app_id
    );
END;
$$;

-- 3.4 API สาธารณะสำหรับแอปพลิเคชันลูก (stb-sso-guard.js) ดึง Master Data ที่ปลอดภัย
CREATE OR REPLACE FUNCTION portal.fn_get_portal_master_data(p_type text DEFAULT 'ALL')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_personnel jsonb := '[]'::jsonb;
    v_reference jsonb := '[]'::jsonb;
    v_positions jsonb := '[]'::jsonb;
BEGIN
    IF p_type IN ('ALL', 'PERSONNEL') THEN
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'personnel_id', p.personnel_id,
                'prefix', p.prefix,
                'first_name', p.first_name,
                'last_name', p.last_name,
                'full_name', portal.fn_build_full_name(p.prefix, p.first_name, p.last_name),
                'position_type', p.position_type,
                'position', p.position,
                'position_level', p.position_level,
                'position_2', p.position_2,
                'bureau_name', p.bureau_name,
                'office', p.office,
                'department', p.department,
                'division', p.division,
                'photo_url', p.photo_url,
                'signature_url', p.signature_url,
                'status', p.status
            ) ORDER BY p.first_name, p.last_name
        ), '[]'::jsonb)
        INTO v_personnel
        FROM portal.personnel p
        WHERE p.status = 'ทำงานอยู่';
    END IF;
    
    IF p_type IN ('ALL', 'REFERENCE') THEN
        SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.type, r.sort_order, r.reference_id), '[]'::jsonb)
        INTO v_reference
        FROM portal.reference_data r
        WHERE r.is_active = true;
    END IF;
    
    IF p_type IN ('ALL', 'POSITIONS') THEN
        SELECT COALESCE(jsonb_agg(to_jsonb(ps) ORDER BY ps.sort_order, ps.pos_id), '[]'::jsonb)
        INTO v_positions
        FROM portal.position_structure ps
        WHERE ps.is_active = true;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'personnel', v_personnel,
        'reference_data', v_reference,
        'position_structure', v_positions
    );
END;
$$;

-- =============================================================================
-- 4. Profile & Admin CRUD RPCs
-- =============================================================================

-- 4.1 อัปเดตข้อมูลตนเอง (Self-Service Profile)
CREATE OR REPLACE FUNCTION portal.fn_update_my_profile(p_session_token text, p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = portal, public, extensions
AS $$
DECLARE
    v_session jsonb;
    v_uid text;
    v_user record;
    v_new_username text;
    v_new_email text;
    v_new_password text;
    v_old_password text;
    v_salt text;
    v_hash text;
BEGIN
    v_session := portal.fn_assert_session_or_setup(p_session_token, 'USER');
    IF v_session->>'is_setup_mode' = 'true' THEN
        RAISE EXCEPTION 'โหมดตั้งค่าเริ่มต้นยังไม่สามารถแก้ไขโปรไฟล์ส่วนตัวได้ กรุณาสร้างบัญชี SUPERADMIN ก่อน';
    END IF;
    v_uid := v_session->>'user_id';
    
    SELECT * INTO v_user FROM portal.users WHERE personnel_ref_id = v_uid;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ไม่พบบัญชีผู้ใช้';
    END IF;
    
    -- 1. แก้ไข Username (ทำได้ครั้งเดียวสำหรับ USER ทั่วไป)
    IF p_payload ? 'username' AND trim(COALESCE(p_payload->>'username', '')) != '' THEN
        v_new_username := lower(trim(p_payload->>'username'));
        IF v_new_username != lower(v_user.username) THEN
            IF v_user.role != 'SUPERADMIN' AND COALESCE(v_user.username_changed, false) THEN
                RAISE EXCEPTION 'คุณได้ใช้สิทธิ์เปลี่ยนชื่อผู้ใช้ (Username) ครั้งเดียวไปแล้ว ไม่สามารถเปลี่ยนซ้ำได้';
            END IF;
            IF v_new_username !~ '^[a-z0-9_.]+$' OR length(v_new_username) < 3 THEN
                RAISE EXCEPTION 'ชื่อผู้ใช้ต้องเป็นตัวพิมพ์เล็ก ตัวเลข จุด หรือขีดล่าง อย่างน้อย 3 ตัวอักษร';
            END IF;
            IF EXISTS (SELECT 1 FROM portal.users WHERE lower(username) = v_new_username AND personnel_ref_id != v_uid) THEN
                RAISE EXCEPTION 'ชื่อผู้ใช้นี้มีผู้อื่นใช้งานแล้ว';
            END IF;
            UPDATE portal.users
            SET username = v_new_username,
                username_changed = true,
                updated_at = clock_timestamp()
            WHERE personnel_ref_id = v_uid;
        END IF;
    END IF;

    -- 2. แก้ไขอีเมล
    IF p_payload ? 'email' AND trim(COALESCE(p_payload->>'email', '')) != '' THEN
        v_new_email := lower(trim(p_payload->>'email'));
        IF v_new_email != lower(v_user.email) THEN
            IF EXISTS (SELECT 1 FROM portal.users WHERE lower(email) = v_new_email AND personnel_ref_id != v_uid) THEN
                RAISE EXCEPTION 'อีเมลนี้มีผู้อื่นใช้งานแล้ว';
            END IF;
            UPDATE portal.users SET email = v_new_email, updated_at = clock_timestamp() WHERE personnel_ref_id = v_uid;
        END IF;
    END IF;

    -- 3. เปลี่ยนรหัสผ่าน (ถ้ามีการส่ง new_password มา)
    IF p_payload ? 'new_password' AND trim(COALESCE(p_payload->>'new_password', '')) != '' THEN
        v_new_password := p_payload->>'new_password';
        v_old_password := COALESCE(p_payload->>'current_password', '');
        IF v_old_password != '' THEN
            IF portal.fn_hash_password(v_user.password_salt, v_old_password) != v_user.password_hash THEN
                RAISE EXCEPTION 'รหัสผ่านปัจจุบันไม่ถูกต้อง';
            END IF;
        END IF;
        IF length(v_new_password) < 6 THEN
            RAISE EXCEPTION 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
        END IF;
        v_salt := replace(gen_random_uuid()::text, '-', '');
        v_hash := portal.fn_hash_password(v_salt, v_new_password);
        UPDATE portal.users
        SET password_salt = v_salt,
            password_hash = v_hash,
            updated_at = clock_timestamp()
        WHERE personnel_ref_id = v_uid;
    END IF;

    -- 4. อัปเดตข้อมูลบุคลากรของตนเอง (ชื่อ, ตำแหน่ง, สังกัด, รูปโปรไฟล์, ลายเซ็น)
    UPDATE portal.personnel
    SET prefix                = COALESCE(p_payload->>'prefix', prefix),
        first_name            = COALESCE(NULLIF(trim(p_payload->>'first_name'), ''), first_name),
        last_name             = COALESCE(NULLIF(trim(p_payload->>'last_name'), ''), last_name),
        position_type         = COALESCE(p_payload->>'position_type', position_type),
        position              = COALESCE(p_payload->>'position', position),
        position_level        = COALESCE(p_payload->>'position_level', position_level),
        position_2            = COALESCE(p_payload->>'position_2', position_2),
        bureau_name           = COALESCE(NULLIF(trim(p_payload->>'bureau_name'), ''), bureau_name),
        office                = COALESCE(p_payload->>'office', office),
        department            = COALESCE(p_payload->>'department', department),
        division              = COALESCE(p_payload->>'division', division),
        start_service_year_be = COALESCE(p_payload->>'start_service_year_be', start_service_year_be),
        photo_url             = COALESCE(p_payload->>'photo_url', photo_url),
        signature_url         = COALESCE(p_payload->>'signature_url', signature_url),
        updated_at            = clock_timestamp()
    WHERE personnel_id = v_uid;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว',
        'user', portal.fn_build_user_payload(v_uid)
    );
END;
$$;

-- 4.2 รายการทำเนียบบุคลากรทั้งหมด (Personnel List for Admin)
CREATE OR REPLACE FUNCTION portal.fn_list_personnel(p_session_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_session jsonb;
    v_data jsonb;
BEGIN
    v_session := portal.fn_assert_session_or_setup(p_session_token, 'ADMIN');
    
    SELECT COALESCE(jsonb_agg(
        to_jsonb(p) || jsonb_build_object(
            'full_name', portal.fn_build_full_name(p.prefix, p.first_name, p.last_name),
            'has_user_account', (u.personnel_ref_id IS NOT NULL),
            'username', COALESCE(u.username, ''),
            'user_role', COALESCE(u.role, ''),
            'user_status', COALESCE(u.status, '')
        ) ORDER BY p.personnel_id
    ), '[]'::jsonb)
    INTO v_data
    FROM portal.personnel p
    LEFT JOIN portal.users u ON u.personnel_ref_id = p.personnel_id;

    RETURN jsonb_build_object('success', true, 'data', v_data);
END;
$$;

-- 4.3 เพิ่ม/แก้ไขข้อมูลบุคลากร (Save Personnel)
CREATE OR REPLACE FUNCTION portal.fn_save_personnel(p_session_token text, p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_session jsonb;
    v_pid text := trim(COALESCE(p_payload->>'personnel_id', ''));
    v_id_card text := regexp_replace(trim(COALESCE(p_payload->>'id_card_number', '')), '\D', '', 'g');
    v_salary numeric(12,2) := 0.00;
BEGIN
    v_session := portal.fn_assert_session_or_setup(p_session_token, 'ADMIN');

    IF NOT portal.fn_validate_thai_id(v_id_card) THEN
        RAISE EXCEPTION 'เลขบัตรประจำตัวประชาชน 13 หลักไม่ถูกต้องตามสูตร Modulo-11';
    END IF;

    IF trim(COALESCE(p_payload->>'first_name', '')) = '' OR trim(COALESCE(p_payload->>'last_name', '')) = '' THEN
        RAISE EXCEPTION 'กรุณาระบุชื่อและนามสกุลให้ครบถ้วน';
    END IF;

    BEGIN
        v_salary := COALESCE(NULLIF(regexp_replace(COALESCE(p_payload->>'current_salary', '0'), '[^0-9.]', '', 'g'), '')::numeric(12,2), 0.00);
    EXCEPTION WHEN OTHERS THEN
        v_salary := 0.00;
    END;

    IF v_pid = '' THEN
        IF EXISTS (SELECT 1 FROM portal.personnel WHERE id_card_number = v_id_card) THEN
            RAISE EXCEPTION 'เลขบัตรประจำตัวประชาชนนี้มีอยู่ในทำเนียบบุคลากรแล้ว';
        END IF;

        INSERT INTO portal.personnel (
            id_card_number, prefix, first_name, last_name,
            position_type, position, position_level, position_2,
            bureau_name, office, department, division,
            start_service_year_be, current_salary,
            signature_url, photo_url, status
        ) VALUES (
            v_id_card,
            trim(COALESCE(p_payload->>'prefix', '')),
            trim(COALESCE(p_payload->>'first_name', '')),
            trim(COALESCE(p_payload->>'last_name', '')),
            trim(COALESCE(p_payload->>'position_type', '')),
            trim(COALESCE(p_payload->>'position', '')),
            trim(COALESCE(p_payload->>'position_level', '')),
            trim(COALESCE(p_payload->>'position_2', '')),
            COALESCE(NULLIF(trim(p_payload->>'bureau_name'), ''), 'สำนักเทศกิจ'),
            trim(COALESCE(p_payload->>'office', '')),
            trim(COALESCE(p_payload->>'department', '')),
            trim(COALESCE(p_payload->>'division', '')),
            trim(COALESCE(p_payload->>'start_service_year_be', '')),
            v_salary,
            trim(COALESCE(p_payload->>'signature_url', '')),
            trim(COALESCE(p_payload->>'photo_url', '')),
            COALESCE(NULLIF(trim(p_payload->>'status'), ''), 'ทำงานอยู่')
        )
        RETURNING personnel_id INTO v_pid;
    ELSE
        IF EXISTS (SELECT 1 FROM portal.personnel WHERE id_card_number = v_id_card AND personnel_id != v_pid) THEN
            RAISE EXCEPTION 'เลขบัตรประจำตัวประชาชนนี้ซ้ำกับบุคลากรท่านอื่นในระบบ';
        END IF;

        UPDATE portal.personnel
        SET id_card_number        = v_id_card,
            prefix                = trim(COALESCE(p_payload->>'prefix', prefix)),
            first_name            = trim(COALESCE(p_payload->>'first_name', first_name)),
            last_name             = trim(COALESCE(p_payload->>'last_name', last_name)),
            position_type         = trim(COALESCE(p_payload->>'position_type', position_type)),
            position              = trim(COALESCE(p_payload->>'position', position)),
            position_level        = trim(COALESCE(p_payload->>'position_level', position_level)),
            position_2            = trim(COALESCE(p_payload->>'position_2', position_2)),
            bureau_name           = COALESCE(NULLIF(trim(p_payload->>'bureau_name'), ''), bureau_name),
            office                = trim(COALESCE(p_payload->>'office', office)),
            department            = trim(COALESCE(p_payload->>'department', department)),
            division              = trim(COALESCE(p_payload->>'division', division)),
            start_service_year_be = trim(COALESCE(p_payload->>'start_service_year_be', start_service_year_be)),
            current_salary        = v_salary,
            signature_url         = COALESCE(p_payload->>'signature_url', signature_url),
            photo_url             = COALESCE(p_payload->>'photo_url', photo_url),
            status                = COALESCE(NULLIF(trim(p_payload->>'status'), ''), status),
            updated_at            = clock_timestamp()
        WHERE personnel_id = v_pid;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'บันทึกข้อมูลบุคลากรสำเร็จ',
        'personnel_id', v_pid
    );
END;
$$;

-- 4.4 ลบข้อมูลบุคลากร (Delete Personnel)
CREATE OR REPLACE FUNCTION portal.fn_delete_personnel(p_session_token text, p_personnel_id text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_session jsonb;
    v_role text;
BEGIN
    v_session := portal.fn_assert_session_or_setup(p_session_token, 'ADMIN');

    IF v_session->>'user_id' = p_personnel_id THEN
        RAISE EXCEPTION 'ไม่สามารถลบข้อมูลบุคลากรของบัญชีที่กำลังล็อกอินอยู่ได้';
    END IF;

    SELECT role INTO v_role FROM portal.users WHERE personnel_ref_id = p_personnel_id;
    IF v_role = 'SUPERADMIN' THEN
        IF (SELECT count(*) FROM portal.users WHERE role = 'SUPERADMIN' AND status = 'ใช้งานปกติ') <= 1 THEN
            RAISE EXCEPTION 'ไม่สามารถลบผู้ดูแลระบบสูงสุด (SUPERADMIN) คนสุดท้ายของระบบได้';
        END IF;
    END IF;

    DELETE FROM portal.personnel WHERE personnel_id = p_personnel_id;

    RETURN jsonb_build_object('success', true, 'message', 'ลบข้อมูลบุคลากรเรียบร้อยแล้ว');
END;
$$;

-- 4.5 รายการบัญชีผู้ใช้งานทั้งหมดพร้อมสิทธิ์รายแอป (List Users)
CREATE OR REPLACE FUNCTION portal.fn_list_users(p_session_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_session jsonb;
    v_users jsonb;
BEGIN
    v_session := portal.fn_assert_session_or_setup(p_session_token, 'ADMIN');

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'personnel_ref_id', u.personnel_ref_id,
            'username', u.username,
            'email', u.email,
            'role', u.role,
            'status', u.status,
            'created_at', u.created_at,
            'updated_at', u.updated_at,
            'last_login_at', u.last_login_at,
            'username_changed', u.username_changed,
            'prefix', COALESCE(p.prefix, ''),
            'first_name', COALESCE(p.first_name, ''),
            'last_name', COALESCE(p.last_name, ''),
            'full_name', portal.fn_build_full_name(p.prefix, p.first_name, p.last_name),
            'position', COALESCE(p.position, ''),
            'position_level', COALESCE(p.position_level, ''),
            'office', COALESCE(p.office, ''),
            'department', COALESCE(p.department, ''),
            'division', COALESCE(p.division, ''),
            'photo_url', COALESCE(p.photo_url, ''),
            'permissions', COALESCE((
                SELECT jsonb_object_agg(pm.webapp_id, pm.access_level)
                FROM portal.permissions pm
                WHERE pm.personnel_ref_id = u.personnel_ref_id
            ), '{}'::jsonb)
        ) ORDER BY u.created_at DESC
    ), '[]'::jsonb)
    INTO v_users
    FROM portal.users u
    LEFT JOIN portal.personnel p ON p.personnel_id = u.personnel_ref_id;

    RETURN jsonb_build_object('success', true, 'data', v_users);
END;
$$;

-- 4.6 สร้าง/แก้ไขบัญชีผู้ใช้งาน + กำหนดสิทธิ์รายแอป + Auto-Login ทันทีเมื่อสร้าง SUPERADMIN คนแรกในโหมด Setup!
CREATE OR REPLACE FUNCTION portal.fn_save_user(p_session_token text, p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = portal, public, extensions
AS $$
DECLARE
    v_session jsonb;
    v_was_setup boolean;
    v_pid text := trim(COALESCE(p_payload->>'personnel_ref_id', ''));
    v_username text := lower(trim(COALESCE(p_payload->>'username', '')));
    v_email text := lower(trim(COALESCE(p_payload->>'email', '')));
    v_password text := COALESCE(p_payload->>'password', '');
    v_role text := COALESCE(NULLIF(trim(p_payload->>'role'), ''), 'USER');
    v_status text := COALESCE(NULLIF(trim(p_payload->>'status'), ''), 'ใช้งานปกติ');
    v_existing record;
    v_salt text;
    v_hash text;
    v_perms jsonb;
    v_app_id text;
    v_lvl text;
    v_auto_token text := null;
    v_expiry timestamptz;
BEGIN
    v_session := portal.fn_assert_session_or_setup(p_session_token, 'ADMIN');
    v_was_setup := (v_session->>'is_setup_mode' = 'true');

    IF v_pid = '' THEN
        RAISE EXCEPTION 'กรุณาเลือกข้อมูลบุคลากรที่ต้องการผูกกับบัญชีผู้ใช้งานนี้';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM portal.personnel WHERE personnel_id = v_pid) THEN
        RAISE EXCEPTION 'ไม่พบรหัสบุคลากร (%) ในทำเนียบบุคลากร กรุณาเพิ่มข้อมูลบุคลากรก่อน', v_pid;
    END IF;

    -- ในโหมด First-Time Setup บังคับให้สร้างเป็น SUPERADMIN สถานะ ใช้งานปกติ
    IF v_was_setup THEN
        v_role := 'SUPERADMIN';
        v_status := 'ใช้งานปกติ';
    END IF;

    -- ป้องกัน ADMIN ทั่วไปตั้งสิทธิ์เป็น SUPERADMIN
    IF NOT v_was_setup AND v_session->>'role' != 'SUPERADMIN' AND v_role = 'SUPERADMIN' THEN
        RAISE EXCEPTION 'เฉพาะ SUPERADMIN เท่านั้นที่สามารถกำหนดสิทธิ์ระดับ SUPERADMIN ได้';
    END IF;

    SELECT * INTO v_existing FROM portal.users WHERE personnel_ref_id = v_pid;

    IF NOT FOUND THEN
        -- กรณีสร้างบัญชีใหม่
        IF v_username = '' OR v_email = '' OR length(v_password) < 6 THEN
            RAISE EXCEPTION 'กรุณาระบุ Username, Email และรหัสผ่าน (อย่างน้อย 6 ตัวอักษร) ให้ครบถ้วน';
        END IF;
        IF EXISTS (SELECT 1 FROM portal.users WHERE lower(username) = v_username) THEN
            RAISE EXCEPTION 'Username นี้ถูกใช้งานแล้ว';
        END IF;
        IF EXISTS (SELECT 1 FROM portal.users WHERE lower(email) = v_email) THEN
            RAISE EXCEPTION 'Email นี้ถูกใช้งานแล้ว';
        END IF;

        v_salt := replace(gen_random_uuid()::text, '-', '');
        v_hash := portal.fn_hash_password(v_salt, v_password);

        INSERT INTO portal.users (
            personnel_ref_id, username, email, password_salt, password_hash, role, status
        ) VALUES (
            v_pid, v_username, v_email, v_salt, v_hash, v_role, v_status
        );
    ELSE
        -- กรณีแก้ไขบัญชีเดิม: ป้องกันการลดสิทธิ์หรือระงับบัญชีตัวเอง
        IF v_session->>'user_id' = v_pid THEN
            IF v_role != v_existing.role THEN
                RAISE EXCEPTION 'ไม่สามารถลดระดับสิทธิ์ของบัญชีที่ตนเองกำลังใช้งานอยู่ได้';
            END IF;
            IF v_status != 'ใช้งานปกติ' THEN
                RAISE EXCEPTION 'ไม่สามารถระงับบัญชีที่ตนเองกำลังใช้งานอยู่ได้';
            END IF;
        END IF;

        IF v_username != '' AND v_username != lower(v_existing.username) THEN
            IF EXISTS (SELECT 1 FROM portal.users WHERE lower(username) = v_username AND personnel_ref_id != v_pid) THEN
                RAISE EXCEPTION 'Username นี้ถูกใช้งานแล้ว';
            END IF;
        ELSE
            v_username := v_existing.username;
        END IF;

        IF v_email != '' AND v_email != lower(v_existing.email) THEN
            IF EXISTS (SELECT 1 FROM portal.users WHERE lower(email) = v_email AND personnel_ref_id != v_pid) THEN
                RAISE EXCEPTION 'Email นี้ถูกใช้งานแล้ว';
            END IF;
        ELSE
            v_email := v_existing.email;
        END IF;

        UPDATE portal.users
        SET username   = v_username,
            email      = v_email,
            role       = v_role,
            status     = v_status,
            updated_at = clock_timestamp()
        WHERE personnel_ref_id = v_pid;

        IF length(v_password) >= 6 THEN
            v_salt := replace(gen_random_uuid()::text, '-', '');
            v_hash := portal.fn_hash_password(v_salt, v_password);
            UPDATE portal.users
            SET password_salt = v_salt,
                password_hash = v_hash
            WHERE personnel_ref_id = v_pid;
        END IF;
    END IF;

    -- บันทึกสิทธิ์รายแอป (permissions) ถ้าส่งมาใน payload
    IF p_payload ? 'permissions' AND jsonb_typeof(p_payload->'permissions') = 'object' THEN
        v_perms := p_payload->'permissions';
        FOR v_app_id, v_lvl IN SELECT * FROM jsonb_each_text(v_perms) LOOP
            IF v_lvl IN ('USER', 'ADMIN') THEN
                INSERT INTO portal.permissions (personnel_ref_id, webapp_id, access_level)
                VALUES (v_pid, v_app_id, v_lvl)
                ON CONFLICT (personnel_ref_id, webapp_id)
                DO UPDATE SET access_level = EXCLUDED.access_level;
            ELSE
                DELETE FROM portal.permissions WHERE personnel_ref_id = v_pid AND webapp_id = v_app_id;
            END IF;
        END LOOP;
    END IF;

    -- ถ้าเพิ่งสร้าง SUPERADMIN คนแรกในโหมด Setup สำเร็จ ให้ออก Session Token ทันที (Seamless Auto-Login)
    IF v_was_setup AND v_role = 'SUPERADMIN' AND v_status = 'ใช้งานปกติ' THEN
        v_auto_token := portal.fn_generate_token_string();
        v_expiry := clock_timestamp() + interval '12 hours';
        INSERT INTO portal.security_tokens (
            user_id, token_type, token_string, expiry_date, expires_at, is_used, is_active
        ) VALUES (
            v_pid, 'LOGIN_SESSION', v_auto_token, v_expiry, v_expiry, false, true
        );
        UPDATE portal.users SET last_login_at = clock_timestamp() WHERE personnel_ref_id = v_pid;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', CASE WHEN v_auto_token IS NOT NULL
            THEN 'สร้างบัญชี SUPERADMIN คนแรกสำเร็จ ระบบล็อกโหมดตั้งค่าและเข้าสู่ระบบให้ท่านอัตโนมัติแล้ว'
            ELSE 'บันทึกข้อมูลบัญชีผู้ใช้งานสำเร็จ' END,
        'personnel_ref_id', v_pid,
        'auto_session_token', v_auto_token,
        'user', portal.fn_build_user_payload(v_pid)
    );
END;
$$;

-- 4.7 ลบบัญชีผู้ใช้งาน (Delete User)
CREATE OR REPLACE FUNCTION portal.fn_delete_user(p_session_token text, p_personnel_ref_id text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_session jsonb;
    v_target record;
BEGIN
    v_session := portal.fn_assert_session_or_setup(p_session_token, 'SUPERADMIN');

    IF v_session->>'user_id' = p_personnel_ref_id THEN
        RAISE EXCEPTION 'ไม่สามารถลบบัญชีที่ตนเองกำลังล็อกอินอยู่ได้';
    END IF;

    SELECT * INTO v_target FROM portal.users WHERE personnel_ref_id = p_personnel_ref_id;
    IF v_target.role = 'SUPERADMIN' THEN
        IF (SELECT count(*) FROM portal.users WHERE role = 'SUPERADMIN' AND status = 'ใช้งานปกติ') <= 1 THEN
            RAISE EXCEPTION 'ไม่สามารถลบบัญชี SUPERADMIN คนสุดท้ายของระบบได้';
        END IF;
    END IF;

    DELETE FROM portal.users WHERE personnel_ref_id = p_personnel_ref_id;
    DELETE FROM portal.permissions WHERE personnel_ref_id = p_personnel_ref_id;

    RETURN jsonb_build_object('success', true, 'message', 'ลบบัญชีผู้ใช้งานเรียบร้อยแล้ว');
END;
$$;

-- 4.8 จัดการเว็บแอปย่อย (List / Save / Delete Webapps)
CREATE OR REPLACE FUNCTION portal.fn_list_webapps(p_session_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_session jsonb;
    v_apps jsonb;
BEGIN
    v_session := portal.fn_assert_session_or_setup(p_session_token, 'ADMIN');

    SELECT COALESCE(jsonb_agg(to_jsonb(w) ORDER BY w.sort_order, w.webapp_id), '[]'::jsonb)
    INTO v_apps
    FROM portal.webapps w;

    RETURN jsonb_build_object('success', true, 'data', v_apps);
END;
$$;

CREATE OR REPLACE FUNCTION portal.fn_save_webapp(p_session_token text, p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_session jsonb;
    v_id text := trim(COALESCE(p_payload->>'webapp_id', ''));
    v_sort integer := COALESCE((p_payload->>'sort_order')::integer, 0);
BEGIN
    v_session := portal.fn_assert_session_or_setup(p_session_token, 'SUPERADMIN');

    IF trim(COALESCE(p_payload->>'name', '')) = '' OR trim(COALESCE(p_payload->>'url', '')) = '' THEN
        RAISE EXCEPTION 'กรุณาระบุชื่อเว็บแอปและ URL ปลายทาง';
    END IF;

    IF v_id = '' THEN
        INSERT INTO portal.webapps (name, url, icon_url, status, description, sort_order)
        VALUES (
            trim(p_payload->>'name'),
            trim(p_payload->>'url'),
            trim(COALESCE(p_payload->>'icon_url', '')),
            COALESCE(NULLIF(trim(p_payload->>'status'), ''), 'เปิดใช้งาน'),
            trim(COALESCE(p_payload->>'description', '')),
            v_sort
        )
        RETURNING webapp_id INTO v_id;
    ELSE
        UPDATE portal.webapps
        SET name        = trim(COALESCE(p_payload->>'name', name)),
            url         = trim(COALESCE(p_payload->>'url', url)),
            icon_url    = COALESCE(p_payload->>'icon_url', icon_url),
            status      = COALESCE(NULLIF(trim(p_payload->>'status'), ''), status),
            description = COALESCE(p_payload->>'description', description),
            sort_order  = COALESCE((p_payload->>'sort_order')::integer, sort_order)
        WHERE webapp_id = v_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'บันทึกข้อมูลเว็บแอปพลิเคชันสำเร็จ', 'webapp_id', v_id);
END;
$$;

CREATE OR REPLACE FUNCTION portal.fn_delete_webapp(p_session_token text, p_webapp_id text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_session jsonb;
BEGIN
    v_session := portal.fn_assert_session_or_setup(p_session_token, 'SUPERADMIN');
    DELETE FROM portal.webapps WHERE webapp_id = p_webapp_id;
    RETURN jsonb_build_object('success', true, 'message', 'ลบเว็บแอปพลิเคชันเรียบร้อยแล้ว');
END;
$$;

-- 4.9 จัดการโครงสร้างสังกัด 4 ระดับ & คำนำหน้า (Reference Data: Save / Batch / Move / Delete)
CREATE OR REPLACE FUNCTION portal.fn_save_reference_data(p_session_token text, p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_session jsonb;
    v_mode text := COALESCE(p_payload->>'mode', 'SINGLE');
    v_id text;
    v_item jsonb;
    v_max_sort integer;
BEGIN
    v_session := portal.fn_assert_session_or_setup(p_session_token, 'ADMIN');

    IF v_mode = 'BATCH' AND jsonb_typeof(p_payload->'items') = 'array' THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items') LOOP
            IF trim(COALESCE(v_item->>'value', '')) != '' THEN
                SELECT COALESCE(max(sort_order), 0) + 1 INTO v_max_sort
                FROM portal.reference_data
                WHERE type = (v_item->>'type');

                INSERT INTO portal.reference_data (type, value, short_name, parent_type, parent_value, sort_order, is_active)
                VALUES (
                    trim(v_item->>'type'),
                    trim(v_item->>'value'),
                    trim(COALESCE(v_item->>'short_name', '')),
                    trim(COALESCE(v_item->>'parent_type', '')),
                    trim(COALESCE(v_item->>'parent_value', '')),
                    COALESCE((v_item->>'sort_order')::integer, v_max_sort),
                    true
                );
            END IF;
        END LOOP;
        RETURN jsonb_build_object('success', true, 'message', 'เพิ่มข้อมูลอ้างอิงแบบกลุ่มเรียบร้อยแล้ว');
    END IF;

    v_id := trim(COALESCE(p_payload->>'reference_id', ''));
    IF v_id = '' THEN
        SELECT COALESCE(max(sort_order), 0) + 1 INTO v_max_sort
        FROM portal.reference_data
        WHERE type = (p_payload->>'type');

        INSERT INTO portal.reference_data (type, value, short_name, parent_type, parent_value, sort_order, is_active)
        VALUES (
            trim(p_payload->>'type'),
            trim(p_payload->>'value'),
            trim(COALESCE(p_payload->>'short_name', '')),
            trim(COALESCE(p_payload->>'parent_type', '')),
            trim(COALESCE(p_payload->>'parent_value', '')),
            COALESCE((p_payload->>'sort_order')::integer, v_max_sort),
            COALESCE((p_payload->>'is_active')::boolean, true)
        )
        RETURNING reference_id INTO v_id;
    ELSE
        UPDATE portal.reference_data
        SET type         = COALESCE(NULLIF(trim(p_payload->>'type'), ''), type),
            value        = COALESCE(NULLIF(trim(p_payload->>'value'), ''), value),
            short_name   = COALESCE(p_payload->>'short_name', short_name),
            parent_type  = COALESCE(p_payload->>'parent_type', parent_type),
            parent_value = COALESCE(p_payload->>'parent_value', parent_value),
            sort_order   = COALESCE((p_payload->>'sort_order')::integer, sort_order),
            is_active    = COALESCE((p_payload->>'is_active')::boolean, is_active)
        WHERE reference_id = v_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'บันทึกข้อมูลอ้างอิงสำเร็จ', 'reference_id', v_id);
END;
$$;

CREATE OR REPLACE FUNCTION portal.fn_delete_reference_data(p_session_token text, p_reference_id text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_session jsonb;
BEGIN
    v_session := portal.fn_assert_session_or_setup(p_session_token, 'ADMIN');
    DELETE FROM portal.reference_data WHERE reference_id = p_reference_id;
    RETURN jsonb_build_object('success', true, 'message', 'ลบข้อมูลอ้างอิงเรียบร้อยแล้ว');
END;
$$;

-- 4.10 จัดการโครงสร้างตำแหน่ง 6 ประเภท (Position Structure: Save / Batch / Delete)
CREATE OR REPLACE FUNCTION portal.fn_save_position_structure(p_session_token text, p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_session jsonb;
    v_mode text := COALESCE(p_payload->>'mode', 'SINGLE');
    v_id text;
    v_item jsonb;
    v_max_sort integer;
BEGIN
    v_session := portal.fn_assert_session_or_setup(p_session_token, 'ADMIN');

    IF v_mode = 'BATCH' AND jsonb_typeof(p_payload->'items') = 'array' THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items') LOOP
            IF trim(COALESCE(v_item->>'position_name', '')) != '' THEN
                SELECT COALESCE(max(sort_order), 0) + 1 INTO v_max_sort FROM portal.position_structure;
                INSERT INTO portal.position_structure (position_type, position_name, position_level, sort_order, is_active)
                VALUES (
                    trim(v_item->>'position_type'),
                    trim(v_item->>'position_name'),
                    COALESCE(NULLIF(trim(v_item->>'position_level'), ''), 'ไม่มีระดับ'),
                    COALESCE((v_item->>'sort_order')::integer, v_max_sort),
                    true
                );
            END IF;
        END LOOP;
        RETURN jsonb_build_object('success', true, 'message', 'เพิ่มโครงสร้างตำแหน่งแบบกลุ่มเรียบร้อยแล้ว');
    END IF;

    v_id := trim(COALESCE(p_payload->>'pos_id', ''));
    IF v_id = '' THEN
        SELECT COALESCE(max(sort_order), 0) + 1 INTO v_max_sort FROM portal.position_structure;
        INSERT INTO portal.position_structure (position_type, position_name, position_level, sort_order, is_active)
        VALUES (
            trim(p_payload->>'position_type'),
            trim(p_payload->>'position_name'),
            COALESCE(NULLIF(trim(p_payload->>'position_level'), ''), 'ไม่มีระดับ'),
            COALESCE((p_payload->>'sort_order')::integer, v_max_sort),
            COALESCE((p_payload->>'is_active')::boolean, true)
        )
        RETURNING pos_id INTO v_id;
    ELSE
        UPDATE portal.position_structure
        SET position_type  = COALESCE(NULLIF(trim(p_payload->>'position_type'), ''), position_type),
            position_name  = COALESCE(NULLIF(trim(p_payload->>'position_name'), ''), position_name),
            position_level = COALESCE(NULLIF(trim(p_payload->>'position_level'), ''), position_level),
            sort_order     = COALESCE((p_payload->>'sort_order')::integer, sort_order),
            is_active      = COALESCE((p_payload->>'is_active')::boolean, is_active)
        WHERE pos_id = v_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'บันทึกโครงสร้างตำแหน่งสำเร็จ', 'pos_id', v_id);
END;
$$;

CREATE OR REPLACE FUNCTION portal.fn_delete_position_structure(p_session_token text, p_pos_id text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_session jsonb;
BEGIN
    v_session := portal.fn_assert_session_or_setup(p_session_token, 'ADMIN');
    DELETE FROM portal.position_structure WHERE pos_id = p_pos_id;
    RETURN jsonb_build_object('success', true, 'message', 'ลบโครงสร้างตำแหน่งเรียบร้อยแล้ว');
END;
$$;

-- 4.11 บันทึกการตั้งค่าระบบ (Save System Settings - ครบ 13 Keys)
CREATE OR REPLACE FUNCTION portal.fn_save_system_settings(p_session_token text, p_settings jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_session jsonb;
    v_k text;
    v_v text;
BEGIN
    v_session := portal.fn_assert_session_or_setup(p_session_token, 'SUPERADMIN');

    FOR v_k, v_v IN SELECT * FROM jsonb_each_text(p_settings) LOOP
        INSERT INTO portal.system_settings (key, value)
        VALUES (v_k, COALESCE(v_v, ''))
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'message', 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
END;
$$;

-- 4.12 ฟังก์ชันล้างข้อมูลทดสอบ (Reset Test Data: USERS_AND_PERSONNEL หรือ FULL_FACTORY_RESET)
CREATE OR REPLACE FUNCTION portal.fn_reset_test_data(
    p_session_token text DEFAULT NULL,
    p_mode text DEFAULT 'USERS_AND_PERSONNEL'
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = portal, public
AS $$
DECLARE
    v_session jsonb;
BEGIN
    v_session := portal.fn_assert_session_or_setup(p_session_token, 'SUPERADMIN');

    IF p_mode = 'FULL_FACTORY_RESET' THEN
        TRUNCATE TABLE
            portal.security_tokens,
            portal.permissions,
            portal.users,
            portal.personnel,
            portal.webapps,
            portal.reference_data,
            portal.position_structure,
            portal.system_settings
        RESTART IDENTITY CASCADE;

        ALTER SEQUENCE portal.seq_personnel RESTART WITH 1;
        ALTER SEQUENCE portal.seq_tokens RESTART WITH 1;
        ALTER SEQUENCE portal.seq_webapps RESTART WITH 1;
        ALTER SEQUENCE portal.seq_reference RESTART WITH 1;
        ALTER SEQUENCE portal.seq_positions RESTART WITH 1;

        PERFORM portal.fn_seed_defaults();

        RETURN jsonb_build_object(
            'success', true,
            'message', 'ล้างข้อมูลทั้งหมดและรีเซ็ตค่าเริ่มต้นกลับเป็นค่าโรงงาน (Factory Reset) สำเร็จ ระบบพร้อมเข้าสู่โหมดตั้งค่าครั้งแรก (First-Time Setup)'
        );
    ELSE
        TRUNCATE TABLE
            portal.security_tokens,
            portal.permissions,
            portal.users,
            portal.personnel
        RESTART IDENTITY CASCADE;

        ALTER SEQUENCE portal.seq_personnel RESTART WITH 1;
        ALTER SEQUENCE portal.seq_tokens RESTART WITH 1;

        RETURN jsonb_build_object(
            'success', true,
            'message', 'ล้างข้อมูลผู้ใช้และบุคลากรทั้งหมดเรียบร้อยแล้ว ระบบกลับสู่โหมดตั้งค่าครั้งแรก (First-Time Setup Bypass)'
        );
    END IF;
END;
$$;

-- =============================================================================
-- 5. Seed ข้อมูลตั้งต้นระบบ (13 System Settings, โครงสร้างสังกัด กทม. 4 ระดับ, ตำแหน่ง 6 ประเภท)
--    *หมายเหตุ: ไม่ Seed ข้อมูลใน personnel และ users เพื่อให้เริ่มใน First-Time Setup Mode*
-- =============================================================================
CREATE OR REPLACE FUNCTION portal.fn_seed_defaults()
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = portal, public
AS $$
BEGIN
    -- 5.1 Seed System_Settings ครบทั้ง 13 Keys
    INSERT INTO portal.system_settings (key, value, description) VALUES
        ('App_Display_Name', 'ระบบ Central Portal & SSO (สตบ.สนท.)', 'ชื่อเว็บแอปที่แสดงในหน้า Login และ Navbar'),
        ('Verify_Email_Hours', '24', 'อายุของลิงก์ยืนยันอีเมลหลังสมัครสมาชิก (หน่วย: ชั่วโมง)'),
        ('Reset_Token_Minutes', '15', 'อายุของลิงก์ลืมรหัสผ่าน (หน่วย: นาที)'),
        ('Session_Hours', '12', 'อายุของ Session การเข้าสู่ระบบ (หน่วย: ชั่วโมง)'),
        ('Profile_Folder_ID', '', 'ลิงก์หรือ ID โฟลเดอร์ Google Drive เก็บรูปโปรไฟล์ User'),
        ('Signature_Folder_ID', '', 'ลิงก์หรือ ID โฟลเดอร์ Google Drive เก็บรูปลายเซ็น (Signature)'),
        ('Personnel_Photo_Folder_ID', '', 'ลิงก์หรือ ID โฟลเดอร์ Google Drive เก็บรูปถ่ายบุคลากรทางการ'),
        ('App_Icon_Folder_ID', '', 'ลิงก์หรือ ID โฟลเดอร์ Google Drive เก็บรูปไอคอนเว็บแอปย่อย'),
        ('Default_Profile_Picture_URL', '', 'URL รูปโปรไฟล์เริ่มต้นกรณีผู้ใช้ยังไม่ได้อัปโหลดรูป'),
        ('App_Base_Url', '', 'URL พื้นฐานของเว็บแอป สำหรับสร้างลิงก์ในอีเมล'),
        ('Login_Logo_URL', 'https://upload.wikimedia.org/wikipedia/commons/3/35/Patch_of_Bangkok_City_Law_Enforcement_Department.png', 'URL รูปภาพโลโก้หน่วยงานบนหน้า Login'),
        ('Dashboard_Logo_URL', 'https://pr-bangkok.com/wp-content/uploads/2025/06/231116_BMA-Emblem_Edited_Green-600x600.png', 'URL รูปภาพโลโก้บน Header Dashboard / Sidebar'),
        ('Default_Theme', 'light', 'ธีมเริ่มต้นของระบบ (light หรือ dark)')
    ON CONFLICT (key) DO NOTHING;

    -- 5.2 Seed Reference_Data (คำนำหน้าชื่อ + โครงสร้างสังกัด 4 ระดับ) หากตารางยังว่าง
    IF NOT EXISTS (SELECT 1 FROM portal.reference_data LIMIT 1) THEN
        INSERT INTO portal.reference_data (type, value, short_name, parent_type, parent_value, sort_order, is_active) VALUES
            -- คำนำหน้าชื่อ (Prefix)
            ('Prefix', 'นาย', '', '', '', 1, true),
            ('Prefix', 'นาง', '', '', '', 2, true),
            ('Prefix', 'นางสาว', '', '', '', 3, true),
            ('Prefix', 'ว่าที่ ร.ต.', '', '', '', 4, true),
            ('Prefix', 'ดร.', '', '', '', 5, true),
            ('Prefix', 'พ.ต.อ.', '', '', '', 6, true),
            -- ระดับที่ 1: สำนัก (Bureau_Name)
            ('Bureau_Name', 'สำนักเทศกิจ', 'สนท.', '', '', 1, true),
            -- ระดับที่ 2: สำนักงาน / กอง (Office)
            ('Office', 'สำนักงานเลขานุการสำนักเทศกิจ', 'สลก.', 'Bureau_Name', 'สำนักเทศกิจ', 1, true),
            ('Office', 'กองตรวจและบังคับการ', 'กตบ.', 'Bureau_Name', 'สำนักเทศกิจ', 2, true),
            ('Office', 'กองนโยบายและแผนงาน', 'กนผ.', 'Bureau_Name', 'สำนักเทศกิจ', 3, true),
            -- ระดับที่ 3: ฝ่าย / ส่วน (Department)
            ('Department', 'ฝ่ายบริหารงานทั่วไป', 'ฝบท.', 'Office', 'สำนักงานเลขานุการสำนักเทศกิจ', 1, true),
            ('Department', 'ฝ่ายการเงินและบัญชี', 'ฝกบ.', 'Office', 'สำนักงานเลขานุการสำนักเทศกิจ', 2, true),
            ('Department', 'ฝ่ายการเจ้าหน้าที่', 'ฝกจ.', 'Office', 'สำนักงานเลขานุการสำนักเทศกิจ', 3, true),
            ('Department', 'ส่วนตรวจและบังคับการ 1', 'สตบ.1', 'Office', 'กองตรวจและบังคับการ', 4, true),
            ('Department', 'ส่วนตรวจและบังคับการ 2', 'สตบ.2', 'Office', 'กองตรวจและบังคับการ', 5, true),
            ('Department', 'ส่วนตรวจและบังคับการ 3', 'สตบ.3', 'Office', 'กองตรวจและบังคับการ', 6, true),
            -- ระดับที่ 4: กลุ่มงาน (Division)
            ('Division', 'กลุ่มงานธุรการ', '', 'Department', 'ฝ่ายบริหารงานทั่วไป', 1, true),
            ('Division', 'กลุ่มงานสารบรรณ', '', 'Department', 'ฝ่ายบริหารงานทั่วไป', 2, true),
            ('Division', 'กลุ่มงานตรวจและบังคับการ 1', '', 'Department', 'ส่วนตรวจและบังคับการ 1', 3, true),
            ('Division', 'กลุ่มงานกิจการพิเศษ', '', 'Department', 'ส่วนตรวจและบังคับการ 1', 4, true);
    END IF;

    -- 5.3 Seed Position_Structure ครบทั้ง 6 ประเภทของ กทม. หากตารางยังว่าง
    IF NOT EXISTS (SELECT 1 FROM portal.position_structure LIMIT 1) THEN
        INSERT INTO portal.position_structure (position_type, position_name, position_level, sort_order, is_active) VALUES
            -- 1. ผู้บริหาร
            ('ผู้บริหาร', 'ผู้อำนวยการสำนัก', 'สูง', 1, true),
            ('ผู้บริหาร', 'รองผู้อำนวยการสำนัก', 'สูง', 2, true),
            ('ผู้บริหาร', 'เลขานุการสำนัก', 'ต้น', 3, true),
            ('ผู้บริหาร', 'ผู้อำนวยการกอง', 'ต้น', 4, true),
            ('ผู้บริหาร', 'ผู้อำนวยการส่วน', 'ต้น', 5, true),
            ('ผู้บริหาร', 'หัวหน้าฝ่าย', 'ไม่มีระดับ', 6, true),
            ('ผู้บริหาร', 'หัวหน้ากลุ่มงาน', 'ไม่มีระดับ', 7, true),
            -- 2. ประเภททั่วไป
            ('ประเภททั่วไป', 'เจ้าพนักงานเทศกิจ', 'ปฏิบัติงาน', 8, true),
            ('ประเภททั่วไป', 'เจ้าพนักงานเทศกิจ', 'ชำนาญงาน', 9, true),
            ('ประเภททั่วไป', 'เจ้าพนักงานเทศกิจ', 'อาวุโส', 10, true),
            ('ประเภททั่วไป', 'เจ้าพนักงานธุรการ', 'ปฏิบัติงาน', 11, true),
            ('ประเภททั่วไป', 'เจ้าพนักงานธุรการ', 'ชำนาญงาน', 12, true),
            ('ประเภททั่วไป', 'เจ้าพนักงานการเงินและบัญชี', 'ปฏิบัติงาน', 13, true),
            ('ประเภททั่วไป', 'เจ้าพนักงานการเงินและบัญชี', 'ชำนาญงาน', 14, true),
            ('ประเภททั่วไป', 'เจ้าพนักงานสื่อสาร', 'ปฏิบัติงาน', 15, true),
            ('ประเภททั่วไป', 'เจ้าพนักงานสื่อสาร', 'ชำนาญงาน', 16, true),
            -- 3. ประเภทวิชาการ
            ('ประเภทวิชาการ', 'นักจัดการงานทั่วไป', 'ปฏิบัติการ', 17, true),
            ('ประเภทวิชาการ', 'นักจัดการงานทั่วไป', 'ชำนาญการ', 18, true),
            ('ประเภทวิชาการ', 'นักจัดการงานทั่วไป', 'ชำนาญการพิเศษ', 19, true),
            ('ประเภทวิชาการ', 'นิติกร', 'ปฏิบัติการ', 20, true),
            ('ประเภทวิชาการ', 'นิติกร', 'ชำนาญการ', 21, true),
            ('ประเภทวิชาการ', 'นิติกร', 'ชำนาญการพิเศษ', 22, true),
            ('ประเภทวิชาการ', 'นักวิเคราะห์นโยบายและแผน', 'ปฏิบัติการ', 23, true),
            ('ประเภทวิชาการ', 'นักวิเคราะห์นโยบายและแผน', 'ชำนาญการ', 24, true),
            ('ประเภทวิชาการ', 'นักวิชาการเงินและบัญชี', 'ปฏิบัติการ', 25, true),
            ('ประเภทวิชาการ', 'นักวิชาการเงินและบัญชี', 'ชำนาญการ', 26, true),
            ('ประเภทวิชาการ', 'นักวิชาการพัสดุ', 'ปฏิบัติการ', 27, true),
            ('ประเภทวิชาการ', 'นักวิชาการพัสดุ', 'ชำนาญการ', 28, true),
            -- 4. ลูกจ้างประจำ
            ('ลูกจ้างประจำ', 'พนักงานเทศกิจ', 'ส1', 29, true),
            ('ลูกจ้างประจำ', 'พนักงานเทศกิจ', 'ส2', 30, true),
            ('ลูกจ้างประจำ', 'พนักงานเทศกิจ', 'ส3', 31, true),
            ('ลูกจ้างประจำ', 'พนักงานขับรถยนต์', 'ส1', 32, true),
            ('ลูกจ้างประจำ', 'พนักงานขับรถยนต์', 'ส2', 33, true),
            ('ลูกจ้างประจำ', 'พนักงานสถานที่', 'บ1', 34, true),
            -- 5. ลูกจ้างชั่วคราว
            ('ลูกจ้างชั่วคราว', 'พนักงานเทศกิจ (ลูกจ้างชั่วคราว)', 'ไม่มีระดับ', 35, true),
            ('ลูกจ้างชั่วคราว', 'ลูกจ้างชั่วคราว', 'ไม่มีระดับ', 36, true),
            -- 6. จ้างเหมาบริการฯ
            ('จ้างเหมาบริการฯ', 'จ้างเหมาบริการรายบุคคล', 'ไม่มีระดับ', 37, true);
    END IF;

    -- 5.4 Seed เว็บแอปย่อยตัวอย่าง 1 รายการสำหรับทดสอบ SSO Handshake
    IF NOT EXISTS (SELECT 1 FROM portal.webapps LIMIT 1) THEN
        INSERT INTO portal.webapps (webapp_id, name, url, icon_url, status, description, sort_order) VALUES
            ('APP0001', 'ระบบตัวอย่างทดสอบ SSO (Sample Sub-App)', '../sample-subapp/index.html', 'fa-solid fa-layer-group', 'เปิดใช้งาน', 'เว็บแอปพลิเคชันย่อยตัวอย่างสำหรับทดสอบการส่งต่อสิทธิ์ Single Sign-On (SSO), การดึงข้อมูลบุคลากร และการอัปโหลดไฟล์เข้า Google Drive', 1);
    END IF;
END;
$$;

-- เรียก Seed ข้อมูลเริ่มต้นทันที
SELECT portal.fn_seed_defaults();

-- ให้สิทธิ์การเรียกใช้ฟังก์ชันทั้งหมดแก่ anon, authenticated, service_role
GRANT ALL ON ALL TABLES IN SCHEMA portal TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA portal TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA portal TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload config';

