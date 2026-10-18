/**
 * =============================================================================
 * STB APP n2 — Central Portal API Client (assets/js/portal-api.js)
 * =============================================================================
 * เชื่อมต่อตรงกับ Supabase PostgreSQL 17 Schema `portal` (26 RPC Functions)
 * และเชื่อมต่อกับ Google Apps Script Microservice สำหรับอัปโหลดไฟล์ลง Google Drive & ส่งอีเมล
 * =============================================================================
 */
(function (global) {
  'use strict';

  var SESSION_STORAGE_KEY = 'stb_portal_session_token_v1';
  var USER_CACHE_KEY = 'stb_portal_user_cache_v1';

  function getSessionToken() {
    try {
      return localStorage.getItem(SESSION_STORAGE_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function setSessionToken(token) {
    try {
      if (token) {
        localStorage.setItem(SESSION_STORAGE_KEY, String(token).trim());
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (e) {}
  }

  function getCachedUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_CACHE_KEY) || 'null');
    } catch (e) {
      return null;
    }
  }

  function setCachedUser(user) {
    try {
      if (user) {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_CACHE_KEY);
      }
    } catch (e) {}
  }

  /**
   * เรียกใช้ฟังก์ชัน PostgreSQL RPC ใน Schema `portal` บน Supabase
   */
  async function rpc(fnName, params, options) {
    options = options || {};
    var cfg = global.STB_CONFIG || {};
    var anonKey = cfg.SUPABASE_ANON_KEY || '';
    if (!anonKey) {
      var err = new Error('MISSING_ANON_KEY: กรุณาระบุ Supabase Anon Key เพื่อเชื่อมต่อฐานข้อมูล');
      err.code = 'MISSING_ANON_KEY';
      throw err;
    }

    var url = cfg.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/rpc/' + fnName;
    var execPromise = (async function () {
      var response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': 'Bearer ' + anonKey,
          'Accept-Profile': cfg.SUPABASE_SCHEMA || 'portal',
          'Content-Profile': cfg.SUPABASE_SCHEMA || 'portal'
        },
        body: JSON.stringify(params || {})
      });

      var body = null;
      try {
        body = await response.json();
      } catch (e) {}

      if (!response.ok) {
        var rawMsg = (body && (body.message || body.error_description || body.details || body.hint)) || ('HTTP Error ' + response.status);
        // ตัด prefix P0001 หรือ SESSION_EXPIRED ออกให้อ่านง่ายสำหรับผู้ใช้
        var cleanMsg = String(rawMsg).replace(/^(SESSION_EXPIRED|FORBIDDEN|ACCOUNT_SUSPENDED|USER_NOT_FOUND|SSO_TOKEN_INVALID|SSO_TARGET_MISMATCH):\s*/i, '');
        var rpcErr = new Error(cleanMsg);
        rpcErr.rawMessage = rawMsg;
        rpcErr.status = response.status;
        if (String(rawMsg).indexOf('SESSION_EXPIRED') !== -1) {
          rpcErr.isSessionExpired = true;
        }
        throw rpcErr;
      }

      return body;
    })();

    if (options.silent || !global.LOADER) {
      return await execPromise;
    }
    return await global.LOADER.busy(execPromise, options.loadingText || 'กำลังประมวลผล...', options.loadingSub);
  }

  var PORTAL_API = {
    rpc: rpc,
    getSessionToken: getSessionToken,
    setSessionToken: setSessionToken,
    getCachedUser: getCachedUser,
    setCachedUser: setCachedUser,

    // 1. System Boot & Auth
    checkSystemInit: function (silent) {
      return rpc('fn_check_system_init', { p_session_token: getSessionToken() || null }, {
        silent: silent !== false,
        loadingText: 'กำลังตรวจสอบสถานะระบบ...'
      });
    },

    login: async function (username, password) {
      var res = await rpc('fn_login', {
        p_username: username,
        p_password: password
      }, { loadingText: 'กำลังตรวจสอบข้อมูลเข้าสู่ระบบ...' });
      if (res && res.token) {
        setSessionToken(res.token);
        setCachedUser(res.user);
      }
      return res;
    },

    logout: async function () {
      var tk = getSessionToken();
      try {
        if (tk) await rpc('fn_logout', { p_session_token: tk }, { loadingText: 'กำลังออกจากระบบ...' });
      } catch (e) {}
      setSessionToken('');
      setCachedUser(null);
    },

    checkIdCardForRegister: function (idCard) {
      return rpc('fn_check_id_card_for_register', { p_id_card: idCard }, {
        loadingText: 'กำลังตรวจสอบเลขประจำตัวประชาชน 13 หลัก...'
      });
    },

    registerUser: function (payload) {
      return rpc('fn_register_user', { p_payload: payload }, {
        loadingText: 'กำลังบันทึกข้อมูลลงทะเบียน...'
      });
    },

    verifyEmail: function (token) {
      return rpc('fn_verify_email', { p_token: token }, {
        loadingText: 'กำลังยืนยันที่อยู่อีเมล...'
      });
    },

    requestPasswordReset: function (email) {
      return rpc('fn_request_password_reset', { p_email: email }, {
        loadingText: 'กำลังสร้างลิงก์ตั้งรหัสผ่านใหม่...'
      });
    },

    resetPassword: function (token, newPassword) {
      return rpc('fn_reset_password', {
        p_token: token,
        p_new_password: newPassword
      }, { loadingText: 'กำลังบันทึกรหัสผ่านใหม่...' });
    },

    // 2. Dashboard & SSO
    getDashboardApps: function (silent) {
      return rpc('fn_get_dashboard_apps', { p_session_token: getSessionToken() }, {
        silent: !!silent,
        loadingText: 'กำลังโหลดรายการเว็บแอปพลิเคชัน...'
      });
    },

    generateSsoToken: function (webappId) {
      return rpc('fn_generate_sso_token', {
        p_session_token: getSessionToken(),
        p_webapp_id: webappId
      }, { loadingText: 'กำลังออกบัตรผ่าน Single Sign-On (SSO)...' });
    },

    // 3. Self-Service Profile
    updateMyProfile: async function (payload) {
      var res = await rpc('fn_update_my_profile', {
        p_session_token: getSessionToken(),
        p_payload: payload
      }, { loadingText: 'กำลังบันทึกข้อมูลส่วนตัว...' });
      if (res && res.user) setCachedUser(res.user);
      return res;
    },

    // 4. Admin & Superadmin CRUDs (พร้อมรองรับ First-Time Setup Bypass!)
    listPersonnel: function (silent) {
      return rpc('fn_list_personnel', { p_session_token: getSessionToken() }, {
        silent: !!silent,
        loadingText: 'กำลังโหลดทำเนียบบุคลากร...'
      });
    },

    savePersonnel: function (payload) {
      return rpc('fn_save_personnel', {
        p_session_token: getSessionToken(),
        p_payload: payload
      }, { loadingText: 'กำลังบันทึกข้อมูลบุคลากร...' });
    },

    deletePersonnel: function (personnelId) {
      return rpc('fn_delete_personnel', {
        p_session_token: getSessionToken(),
        p_personnel_id: personnelId
      }, { loadingText: 'กำลังลบข้อมูลบุคลากร...' });
    },

    listUsers: function (silent) {
      return rpc('fn_list_users', { p_session_token: getSessionToken() }, {
        silent: !!silent,
        loadingText: 'กำลังโหลดรายการบัญชีผู้ใช้งาน...'
      });
    },

    saveUser: async function (payload) {
      var res = await rpc('fn_save_user', {
        p_session_token: getSessionToken(),
        p_payload: payload
      }, { loadingText: 'กำลังบันทึกบัญชีผู้ใช้งานและสิทธิ์...' });

      // กรณีสร้าง SUPERADMIN คนแรกในโหมด Setup สำเร็จ ระบบจะคืน auto_session_token มาให้ล็อกอินต่อเนื่องทันที!
      if (res && res.auto_session_token) {
        setSessionToken(res.auto_session_token);
        if (res.user) setCachedUser(res.user);
      }
      return res;
    },

    deleteUser: function (personnelRefId) {
      return rpc('fn_delete_user', {
        p_session_token: getSessionToken(),
        p_personnel_ref_id: personnelRefId
      }, { loadingText: 'กำลังลบบัญชีผู้ใช้งาน...' });
    },

    listWebapps: function (silent) {
      return rpc('fn_list_webapps', { p_session_token: getSessionToken() }, {
        silent: !!silent,
        loadingText: 'กำลังโหลดทะเบียนเว็บแอปพลิเคชัน...'
      });
    },

    saveWebapp: function (payload) {
      return rpc('fn_save_webapp', {
        p_session_token: getSessionToken(),
        p_payload: payload
      }, { loadingText: 'กำลังบันทึกข้อมูลเว็บแอปพลิเคชัน...' });
    },

    deleteWebapp: function (webappId) {
      return rpc('fn_delete_webapp', {
        p_session_token: getSessionToken(),
        p_webapp_id: webappId
      }, { loadingText: 'กำลังลบเว็บแอปพลิเคชัน...' });
    },

    saveReferenceData: function (payload) {
      return rpc('fn_save_reference_data', {
        p_session_token: getSessionToken(),
        p_payload: payload
      }, { loadingText: 'กำลังบันทึกข้อมูลโครงสร้างสังกัด/ตัวเลือก...' });
    },

    deleteReferenceData: function (referenceId) {
      return rpc('fn_delete_reference_data', {
        p_session_token: getSessionToken(),
        p_reference_id: referenceId
      }, { loadingText: 'กำลังลบรายการ...' });
    },

    batchAddReference: function (payload) {
      return this.saveReferenceData(Object.assign({ mode: 'BATCH', action: 'BATCH' }, payload));
    },

    savePositionStructure: function (payload) {
      return rpc('fn_save_position_structure', {
        p_session_token: getSessionToken(),
        p_payload: payload
      }, { loadingText: 'กำลังบันทึกโครงสร้างตำแหน่ง...' });
    },

    batchAddPosition: function (payload) {
      return this.savePositionStructure(Object.assign({ mode: 'BATCH', action: 'BATCH' }, payload));
    },

    deletePositionStructure: function (posId) {
      return rpc('fn_delete_position_structure', {
        p_session_token: getSessionToken(),
        p_pos_id: posId
      }, { loadingText: 'กำลังลบโครงสร้างตำแหน่ง...' });
    },

    saveSystemSettings: function (settingsObj) {
      return rpc('fn_save_system_settings', {
        p_session_token: getSessionToken(),
        p_settings: settingsObj
      }, { loadingText: 'กำลังบันทึกการตั้งค่าระบบ...' });
    },

    saveSetting: function (key, value) {
      var obj = {};
      obj[key] = value;
      return this.saveSystemSettings(obj);
    },

    resetTestData: async function (mode) {
      var res = await rpc('fn_reset_test_data', {
        p_session_token: getSessionToken(),
        p_mode: mode || 'USERS_AND_PERSONNEL'
      }, { loadingText: 'กำลังล้างข้อมูลทดสอบและรีเซ็ตระบบ...' });
      setSessionToken('');
      setCachedUser(null);
      return res;
    }
  };

  global.PORTAL_API = PORTAL_API;
})(window);
