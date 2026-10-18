/**
 * =============================================================================
 * STB APP n2 — Admin Shared State & Helpers (assets/js/admin/admin-shared.js)
 * =============================================================================
 * Shared State, API accessors, DOM selectors and formatters across all 6
 * Admin & Superadmin modules.
 * =============================================================================
 */
(function (global) {
  'use strict';

  var ADMIN_STATE = {
    personnel: [],
    users: [],
    webapps: [],
    referenceData: [],
    positionStructure: [],
    settings: {},

    personnelSearch: '',
    personnelStatusFilter: '',
    usersSearch: '',
    usersRoleFilter: '',
    currentRefTab: 'BUREAU',
    currentRefParentFilter: '',
    currentPosTab: 'ผู้บริหาร'
  };

  function getApp() {
    return global.PORTAL_APP;
  }

  function getApi() {
    return global.PORTAL_API;
  }

  function getPageBody() {
    var app = getApp();
    return (app && app.getContentEl && app.getContentEl()) || document.getElementById('content') || document.getElementById('pageBody');
  }

  function esc(val) {
    var app = getApp();
    return app ? app.esc(val) : String(val == null ? '' : val);
  }

  function resolveDriveImg(url, fallback) {
    var app = getApp();
    return app ? app.resolveDriveImg(url, fallback) : (url || fallback || '');
  }

  function toast(title, icon) {
    var app = getApp();
    if (app && typeof app.toast === 'function') {
      app.toast(title, icon);
    } else if (global.Swal) {
      global.Swal.fire({
        toast: true,
        position: 'top-end',
        icon: icon || 'success',
        title: title,
        showConfirmButton: false,
        timer: 2400
      });
    }
  }

  function alertError(msg) {
    var app = getApp();
    if (app && typeof app.alertError === 'function') {
      app.alertError(msg);
    } else if (global.Swal) {
      global.Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: msg, confirmButtonColor: '#007B3E' });
    } else {
      alert(msg);
    }
  }

  function triggerIcons() {
    var app = getApp();
    if (app && typeof app.icons === 'function') {
      app.icons();
    } else if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  var AdminShared = {
    ADMIN_STATE: ADMIN_STATE,
    getApp: getApp,
    getApi: getApi,
    getPageBody: getPageBody,
    esc: esc,
    resolveDriveImg: resolveDriveImg,
    toast: toast,
    alertError: alertError,
    triggerIcons: triggerIcons
  };

  global.AdminShared = AdminShared;
})(window);

