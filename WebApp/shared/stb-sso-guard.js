/**
 * =============================================================================
 * STB Shared Module: Single Sign-On Guard & Personnel Master Data SDK
 * File: shared/stb-sso-guard.js
 * =============================================================================
 * สำหรับให้ "เว็บแอปย่อย (/apps/<app_name>/)" ทุกตัวในอนาคตเรียกใช้เพียงไฟล์เดียว เพื่อ:
 * 1. บังคับว่าต้องเปิดเข้าเว็บแอปย่อยผ่าน Central Portal SSO (?sso_token=tk_...) เท่านั้น
 *    หากแอบพิมพ์ URL เข้าตรงๆ โดยไม่มี Session จะดีดกลับไปหน้า Portal SSO ทันที!
 * 2. ตรวจสอบโทเค็นผ่าน Supabase RPC `portal.fn_verify_sso_handshake` (Single-Use 5 นาที)
 *    และรับข้อมูลผู้ใช้ครบทั้ง 38 ฟิลด์ (ทั้ง PascalCase และ camelCase)
 * 3. มีฟังก์ชันดึงข้อมูลบุคลากรกลาง (`getPersonnelList`, `getReferenceData`, `getPositionStructure`)
 *    พร้อมระบบแคชความเร็วสูง
 * =============================================================================
 */
(function (global) {
  'use strict';

  var SUBAPP_SESSION_PREFIX = 'stb_subapp_session_';
  var MASTER_CACHE_KEY = 'stb_portal_master_cache_v1';
  var MASTER_CACHE_TTL_MS = 30 * 60 * 1000; // แคช 30 นาที

  var _currentUser = null;
  var _accessLevel = 'None';
  var _appId = '';
  var _supabaseConfig = {
    url: '',
    anonKey: '',
    portalUrl: '../Portal-SSO/index.html'
  };

  function getConfig_(opts) {
    opts = opts || {};
    var globalCfg = global.STB_CONFIG || {};
    return {
      supabaseUrl: opts.supabaseUrl || globalCfg.SUPABASE_URL || 'https://ycyefnsfamlhnwgizavs.supabase.co',
      supabaseAnonKey: opts.supabaseAnonKey || globalCfg.SUPABASE_ANON_KEY || '',
      portalUrl: opts.portalUrl || globalCfg.PORTAL_BASE_URL || '../Portal-SSO/index.html',
      appId: opts.appId || opts.webappId || ''
    };
  }

  /**
   * เรียกใช้งานฟังก์ชัน RPC ใน Schema `portal` บน Supabase โดยตรงผ่าน REST API
   * (ไม่ต้องพึ่งไลบรารีภายนอกขนาดใหญ่ โหลดเร็วระดับมิลลิวินาที)
   */
  async function callPortalRpc(rpcName, params, cfg) {
    cfg = getConfig_(cfg);
    if (!cfg.supabaseAnonKey) {
      throw new Error('ยังไม่ได้กำหนดค่า SUPABASE_ANON_KEY ใน portal-config.js');
    }

    var endpoint = cfg.supabaseUrl.replace(/\/$/, '') + '/rest/v1/rpc/' + rpcName;
    var response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': cfg.supabaseAnonKey,
        'Authorization': 'Bearer ' + cfg.supabaseAnonKey,
        'Accept-Profile': 'portal',
        'Content-Profile': 'portal'
      },
      body: JSON.stringify(params || {})
    });

    var data = null;
    try {
      data = await response.json();
    } catch (e) {}

    if (!response.ok) {
      var errMsg = (data && (data.message || data.error_description || data.details)) || ('Supabase RPC Error (' + response.status + ')');
      throw new Error(errMsg);
    }

    return data;
  }

  /**
   * ตรวจสอบสิทธิ์การเข้าเว็บแอปย่อย (SSO Guard)
   * @param {Object} options - { appId: 'APP0001', portalUrl: '../../index.html', autoRedirect: true }
   */
  async function requireSSO(options) {
    options = options || {};
    var cfg = getConfig_(options);
    _appId = cfg.appId || 'DEFAULT_SUBAPP';
    var storageKey = SUBAPP_SESSION_PREFIX + _appId;

    // 1. ตรวจสอบว่ามี ?sso_token=tk_... แนบมากับ URL หรือไม่
    var urlObj = new URL(global.location.href);
    var ssoToken = urlObj.searchParams.get('sso_token');

    if (ssoToken) {
      if (global.LOADER) global.LOADER.show('กำลังตรวจสอบสิทธิ์ Single Sign-On (SSO)...');
      try {
        var res = await callPortalRpc('fn_verify_sso_handshake', {
          p_sso_token: ssoToken,
          p_webapp_id: options.appId || options.webappId || null
        }, cfg);

        if (!res || !res.success || !res.user) {
          throw new Error('โทเค็น SSO ไม่ถูกต้องหรือหมดอายุ');
        }

        _currentUser = res.user;
        _accessLevel = res.access_level || 'USER';

        // บันทึก Session ของแอปย่อยลงใน sessionStorage
        sessionStorage.setItem(storageKey, JSON.stringify({
          user: _currentUser,
          accessLevel: _accessLevel,
          verifiedAt: Date.now()
        }));

        // ล้าง ?sso_token ออกจาก URL Bar เพื่อความสะอาดและปลอดภัย
        urlObj.searchParams.delete('sso_token');
        global.history.replaceState({}, document.title, urlObj.pathname + urlObj.search + urlObj.hash);

        if (global.LOADER) {
          global.LOADER.hide();
          global.LOADER.closeSplash();
        }
        return {
          authenticated: true,
          user: _currentUser,
          accessLevel: _accessLevel
        };
      } catch (err) {
        if (global.LOADER) global.LOADER.forceHide();
        sessionStorage.removeItem(storageKey);
        return handleUnauthorized_(cfg, err.message, options.autoRedirect !== false);
      }
    }

    // 2. หากไม่มี ?sso_token ใน URL ให้ตรวจ Session ที่เคยผ่าน SSO แล้วในแท็บนี้
    try {
      var saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
      if (saved && saved.user && (Date.now() - saved.verifiedAt) < 12 * 3600 * 1000) {
        _currentUser = saved.user;
        _accessLevel = saved.accessLevel || 'USER';
        if (global.LOADER) global.LOADER.closeSplash();
        return {
          authenticated: true,
          user: _currentUser,
          accessLevel: _accessLevel
        };
      }
    } catch (e) {}

    // 3. หากไม่มีทั้ง SSO Token และไม่มี Session -> บล็อกและส่งกลับหน้า Portal SSO ทันที!
    return handleUnauthorized_(
      cfg,
      'กรุณาเข้าใช้งานระบบผ่านหน้าหลัก Central Portal & SSO เท่านั้น',
      options.autoRedirect !== false
    );
  }

  function handleUnauthorized_(cfg, reason, autoRedirect) {
    if (autoRedirect) {
      if (global.Swal) {
        global.Swal.fire({
          icon: 'warning',
          title: 'ต้องเข้าผ่านระบบ Central Portal เท่านั้น',
          text: reason || 'ไม่พบสิทธิ์การเข้าถึง กรุณาคลิกเปิดแอปพลิเคชันจากหน้าหลัก Portal SSO',
          confirmButtonText: 'กลับสู่หน้าหลัก Portal SSO',
          confirmButtonColor: '#007B3E',
          allowOutsideClick: false
        }).then(function () {
          global.location.href = cfg.portalUrl;
        });
      } else {
        global.location.href = cfg.portalUrl;
      }
    }
    return {
      authenticated: false,
      reason: reason,
      user: null,
      accessLevel: 'None'
    };
  }

  /**
   * ดึงข้อมูล Master Data จาก Portal (ทำเนียบบุคลากร, โครงสร้างสังกัด 4 ระดับ, ตำแหน่ง 6 ประเภท)
   */
  async function fetchPortalMasterData_(forceRefresh, cfg) {
    if (!forceRefresh) {
      try {
        var cached = JSON.parse(sessionStorage.getItem(MASTER_CACHE_KEY) || 'null');
        if (cached && (Date.now() - cached.timestamp) < MASTER_CACHE_TTL_MS) {
          return cached.data;
        }
      } catch (e) {}
    }

    var res = await callPortalRpc('fn_get_portal_master_data', { p_type: 'ALL' }, cfg);
    try {
      sessionStorage.setItem(MASTER_CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data: res
      }));
    } catch (e) {}
    return res;
  }

  var STB_SSO = {
    requireSSO: requireSSO,
    callPortalRpc: callPortalRpc,

    get currentUser() {
      return _currentUser;
    },

    getUser: function () {
      return _currentUser;
    },

    get accessLevel() {
      return _accessLevel;
    },

    getAccessLevel: function () {
      return _accessLevel;
    },

    isAdmin: function () {
      return _accessLevel === 'ADMIN' || (_currentUser && _currentUser.Role === 'SUPERADMIN');
    },

    /**
     * ดึงรายชื่อบุคลากรทั้งหมดที่ปฏิบัติงานอยู่ (สำหรับใส่ Dropdown เลือกบุคลากรในแอปย่อย)
     */
    getPersonnelList: async function (forceRefresh) {
      var data = await fetchPortalMasterData_(forceRefresh);
      return (data && data.personnel) ? data.personnel : [];
    },

    /**
     * ดึงข้อมูลโครงสร้างสังกัด 4 ระดับและคำนำหน้าชื่อ
     */
    getReferenceData: async function (forceRefresh) {
      var data = await fetchPortalMasterData_(forceRefresh);
      return (data && data.reference_data) ? data.reference_data : [];
    },

    /**
     * ดึงโครงสร้างตำแหน่ง กทม. ทั้ง 6 ประเภท
     */
    getPositionStructure: async function (forceRefresh) {
      var data = await fetchPortalMasterData_(forceRefresh);
      return (data && data.position_structure) ? data.position_structure : [];
    },

    /**
     * ออกจากแอปย่อยและกลับสู่หน้าหลัก Portal SSO
     */
    returnToPortal: function (portalUrl) {
      var cfg = getConfig_({ portalUrl: portalUrl });
      global.location.href = cfg.portalUrl;
    },

    logoutSubApp: function (portalUrl) {
      if (_appId) sessionStorage.removeItem(SUBAPP_SESSION_PREFIX + _appId);
      var cfg = getConfig_({ portalUrl: portalUrl });
      global.location.href = cfg.portalUrl;
    },

    logout: function (portalUrl) {
      return STB_SSO.logoutSubApp(portalUrl);
    }
  };

  global.STB_SSO = STB_SSO;
  global.PortalAPI = STB_SSO;
})(window);

