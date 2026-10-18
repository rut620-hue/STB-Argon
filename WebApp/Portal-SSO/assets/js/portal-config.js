/**
 * =============================================================================
 * STB APP n2 — Central Portal & SSO Configuration (assets/js/portal-config.js)
 * =============================================================================
 * รองรับการตั้งค่า Supabase URL, Supabase Publishable/Anon Key, และ GAS Web App URL
 * หากเปิดใช้งานครั้งแรกและยังไม่ได้ใส่ SUPABASE_ANON_KEY ระบบจะมีหน้าต่าง Setup Box
 * ให้วาง Anon Key จากหน้า Supabase Dashboard ได้ทันทีโดยไม่ต้องแก้โค้ดซ้ำ
 * =============================================================================
 */
(function (global) {
  'use strict';

  var LOCAL_KEY_STORAGE = 'stb_supabase_anon_key_v1';
  var LOCAL_GAS_STORAGE = 'stb_gas_webapp_url_v1';

  var DEFAULT_SUPABASE_URL = 'https://ycyefnsfamlhnwgizavs.supabase.co';
  var DEFAULT_GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbzDR2f1LIawaz6fh4gfEJ6yeIpD7yHG2oWDT07qOpbCpmTpYAExF_O2-KoFeeVnAJsyeA/exec';

  // สามารถนำค่า anon public key จาก https://supabase.com/dashboard/project/ycyefnsfamlhnwgizavs/settings/api มาวางในตัวแปรด้านล่างนี้ได้โดยตรง
  var HARDCODED_ANON_KEY = '';

  function getSavedAnonKey() {
    if (HARDCODED_ANON_KEY && HARDCODED_ANON_KEY.length > 20) return HARDCODED_ANON_KEY;
    try {
      return localStorage.getItem(LOCAL_KEY_STORAGE) || '';
    } catch (e) {
      return '';
    }
  }

  function setSavedAnonKey(key) {
    try {
      if (key) {
        localStorage.setItem(LOCAL_KEY_STORAGE, String(key).trim());
      } else {
        localStorage.removeItem(LOCAL_KEY_STORAGE);
      }
    } catch (e) {}
  }

  function getSavedGasUrl() {
    try {
      return localStorage.getItem(LOCAL_GAS_STORAGE) || DEFAULT_GAS_WEBAPP_URL;
    } catch (e) {
      return DEFAULT_GAS_WEBAPP_URL;
    }
  }

  function setSavedGasUrl(url) {
    try {
      if (url) {
        localStorage.setItem(LOCAL_GAS_STORAGE, String(url).trim());
      }
    } catch (e) {}
  }

  global.STB_CONFIG = {
    SUPABASE_PROJECT_REF: 'ycyefnsfamlhnwgizavs',
    SUPABASE_URL: DEFAULT_SUPABASE_URL,
    SUPABASE_SCHEMA: 'portal',
    get SUPABASE_ANON_KEY() {
      return getSavedAnonKey();
    },
    set SUPABASE_ANON_KEY(val) {
      setSavedAnonKey(val);
    },
    setSupabaseAnonKey: function (val) {
      setSavedAnonKey(val);
    },
    get GAS_WEBAPP_URL() {
      return getSavedGasUrl();
    },
    set GAS_WEBAPP_URL(val) {
      setSavedGasUrl(val);
    },
    get GAS_BRIDGE_URL() {
      return getSavedGasUrl();
    },
    set GAS_BRIDGE_URL(val) {
      setSavedGasUrl(val);
    },
    setGasBridgeUrl: function (val) {
      setSavedGasUrl(val);
    },
    get PORTAL_BASE_URL() {
      var loc = global.location;
      var path = loc.pathname;
      if (path.indexOf('/WebApp/Portal-SSO/') !== -1) {
        return loc.origin + path.replace(/\/WebApp\/Portal-SSO\/.*$/, '/WebApp/Portal-SSO/index.html');
      }
      if (path.indexOf('/WebApp/') !== -1) {
        return loc.origin + path.replace(/\/WebApp\/[^/]+\/.*$/, '/WebApp/Portal-SSO/index.html');
      }
      return loc.origin + path.replace(/\/[^/]*$/, '/WebApp/Portal-SSO/index.html');
    },
    DEFAULT_LOGO_BMA: 'https://pr-bangkok.com/wp-content/uploads/2025/06/231116_BMA-Emblem_Edited_Green-600x600.png',
    DEFAULT_LOGO_DEPT: 'https://upload.wikimedia.org/wikipedia/commons/3/35/Patch_of_Bangkok_City_Law_Enforcement_Department.png'
  };
})(window);
