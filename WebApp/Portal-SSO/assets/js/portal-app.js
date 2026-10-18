/**
 * =============================================================================
 * STB APP n2 — Central Portal Core Orchestrator & Public Facade (assets/js/portal-app.js)
 * =============================================================================
 * OOP Modular Architecture Orchestrator: Coordinates State, UI, Cascade,
 * Auth, Dashboard and Profile modules while preserving 100% API compatibility.
 * =============================================================================
 */
(function (global) {
  'use strict';

  var S = global.PortalState || {};
  var STATE = S.STATE || {};
  var ADMIN_ROUTES = S.ADMIN_ROUTES || {};

  function registerAdminRoute(routeName, handlerFn) {
    ADMIN_ROUTES[routeName] = handlerFn;
    if (S.ADMIN_ROUTES) S.ADMIN_ROUTES[routeName] = handlerFn;
  }

  async function bootSystem() {
    // 1. Instant BMA Loader Brand Boot from Cache
    if (global.LOADER && typeof global.LOADER.brandBoot === 'function') {
      global.LOADER.brandBoot({
        sys: 'Central Portal & Single Sign-On',
        org: 'ส่วนตรวจและบังคับการ สำนักเทศกิจ',
        sub: 'กรุงเทพมหานคร'
      });
    }

    var spBar = document.getElementById('splashBar');
    var progress = 15;
    var timer = setInterval(function () {
      progress = Math.min(90, progress + Math.random() * 16);
      if (spBar) spBar.style.width = progress + '%';
    }, 150);

    if (global.PortalUI) {
      global.PortalUI.applyTheme(STATE.theme, false);
    }

    if (!global.STB_CONFIG || !global.STB_CONFIG.SUPABASE_ANON_KEY) {
      clearInterval(timer);
      if (global.PortalUI) {
        global.PortalUI.hideSplash();
        global.PortalUI.showLoginShell();
      }
      if (global.PortalAuth) {
        global.PortalAuth.renderMissingKeyNotice();
      }
      if (global.PortalUI) {
        global.PortalUI.openConnectionConfigModal(true);
      }
      return;
    }

    try {
      var initRes = await global.PORTAL_API.checkSystemInit(true);
      clearInterval(timer);
      if (spBar) spBar.style.width = '100%';

      STATE.booted = true;
      STATE.hasSuperadmin = !!initRes.has_superadmin;
      STATE.isSetupMode = !!initRes.is_setup_mode;
      STATE.settings = initRes.settings || {};
      STATE.user = initRes.user || null;
      STATE.referenceData = initRes.reference_data || [];
      STATE.positionStructure = initRes.position_structure || [];

      // Preload HTML views in parallel
      if (global.PortalViewLoader && typeof global.PortalViewLoader.preloadAll === 'function') {
        global.PortalViewLoader.preloadAll();
      }

      if (!localStorage.getItem('stb_portal_theme_v1') && STATE.settings.Default_Theme) {
        if (global.PortalUI) global.PortalUI.applyTheme(STATE.settings.Default_Theme, false);
      }
      if (global.PortalUI) global.PortalUI.applyBranding();

      setTimeout(function () {
        if (global.PortalUI) global.PortalUI.hideSplash();

        var rawHash = String(window.location.hash || '').replace(/^#/, '');
        if (rawHash.indexOf('verify-email') === 0) {
          if (global.PortalUI) global.PortalUI.showLoginShell();
          if (global.PortalAuth) global.PortalAuth.handleVerifyEmailHash(rawHash);
          return;
        }
        if (rawHash.indexOf('reset-password') === 0) {
          if (global.PortalUI) global.PortalUI.showLoginShell();
          if (global.PortalAuth) global.PortalAuth.renderResetPasswordForm(rawHash);
          return;
        }

        // Case 1: First-Time Setup Bypass
        if (STATE.isSetupMode || !STATE.hasSuperadmin) {
          STATE.user = {
            Personnel_ID: 'SETUP_MODE',
            personnelId: 'SETUP_MODE',
            Username: 'setup_bypass',
            username: 'setup_bypass',
            FullName: 'โหมดตั้งค่าระบบครั้งแรก (Setup Bypass)',
            fullName: 'โหมดตั้งค่าระบบครั้งแรก (Setup Bypass)',
            Position: 'กรุณาเพิ่มข้อมูลบุคลากรและสร้างบัญชี SUPERADMIN',
            position: 'กรุณาเพิ่มข้อมูลบุคลากรและสร้างบัญชี SUPERADMIN',
            Role: 'SUPERADMIN',
            role: 'SUPERADMIN'
          };
          if (global.PortalUI) global.PortalUI.showAppShell();
          var defaultSetupRoute = rawHash && rawHash !== 'login' ? rawHash.split('?')[0] : 'personnel';
          navigate(defaultSetupRoute);
          return;
        }

        // Case 2: Existing Session
        if (STATE.user && (STATE.user.Personnel_ID || STATE.user.personnelId)) {
          global.PORTAL_API.setCachedUser(STATE.user);
          if (global.PortalUI) global.PortalUI.showAppShell();
          var startRoute = rawHash && rawHash !== 'login' ? rawHash.split('?')[0] : 'dashboard';
          navigate(startRoute);
          return;
        }

        // Case 3: Show Login Screen
        global.PORTAL_API.setSessionToken('');
        global.PORTAL_API.setCachedUser(null);
        if (global.PortalUI) global.PortalUI.showLoginShell();
        if (global.PortalAuth) global.PortalAuth.renderLoginForm();
      }, 350);
    } catch (err) {
      clearInterval(timer);
      if (global.PortalUI) {
        global.PortalUI.hideSplash();
        global.PortalUI.showLoginShell();
      }
      if (global.PortalAuth) {
        global.PortalAuth.renderBootErrorPanel(err);
      }
    }
  }

  async function navigate(route) {
    var cleanRoute = String(route || 'dashboard').replace(/^#/, '').split('?')[0];
    STATE.currentRoute = cleanRoute;
    try {
      if (window.location.hash !== '#' + cleanRoute) {
        history.replaceState(null, '', '#' + cleanRoute);
      }
    } catch (e) {}

    var sb = document.getElementById('sidebar');
    var ov = document.getElementById('overlay');
    if (sb) sb.classList.add('-translate-x-full');
    if (ov) ov.classList.add('hidden');

    if (global.PortalUI) global.PortalUI.highlightSidebar(cleanRoute);
    if (global.PortalState) global.PortalState.destroyCharts();

    if (cleanRoute === 'dashboard') {
      if (global.PortalUI) global.PortalUI.setPageHeader('Dashboard', 'ภาพรวมระบบและเว็บแอปพลิเคชัน Single Sign-On', 'layout-dashboard');
      if (global.PortalDashboard) await global.PortalDashboard.renderDashboardPage();
      return;
    }

    if (cleanRoute === 'profile') {
      if (STATE.isSetupMode) {
        if (global.PortalUI) global.PortalUI.toast('ในโหมดตั้งค่าครั้งแรก กรุณาเพิ่มข้อมูลบุคลากรและผูกบัญชี SUPERADMIN ก่อน', 'info');
        await navigate('personnel');
        return;
      }
      if (global.PortalUI) global.PortalUI.setPageHeader('โปรไฟล์และลายเซ็น', 'จัดการข้อมูลส่วนบุคคล รูปถ่าย และลายเซ็นอิเล็กทรอนิกส์', 'id-card');
      if (global.PortalProfile) global.PortalProfile.renderProfilePage();
      return;
    }

    if (ADMIN_ROUTES[cleanRoute]) {
      await ADMIN_ROUTES[cleanRoute]();
      return;
    }

    var content = (global.PortalState && global.PortalState.getContentEl)
      ? global.PortalState.getContentEl()
      : document.getElementById('content');
    if (content) {
      content.innerHTML = '<div class="card p-10 text-center muted">กำลังเตรียมโมดูล (' + (global.PortalState ? global.PortalState.esc(cleanRoute) : cleanRoute) + ')</div>';
    }
  }

  // ---------------------------------------------------------------------------
  // Public Facade Delegator (100% Lossless Compatibility with existing code)
  // ---------------------------------------------------------------------------
  var PORTAL_APP = {
    // State & Atoms
    get STATE() { return (global.PortalState && global.PortalState.STATE) || STATE; },
    set STATE(v) { if (global.PortalState) global.PortalState.STATE = v; else STATE = v; },
    esc: function (val) { return global.PortalState ? global.PortalState.esc(val) : String(val == null ? '' : val); },
    icons: function () { if (global.PortalState) global.PortalState.icons(); },
    THEMEC: function () { return global.PortalState ? global.PortalState.THEMEC() : []; },
    GRADC: function () { return global.PortalState ? global.PortalState.GRADC() : []; },
    statCard: function (t, v, ic, gi, sub) { return global.PortalState ? global.PortalState.statCard(t, v, ic, gi, sub) : ''; },
    sectionBar: function (t, right, ic) { return global.PortalState ? global.PortalState.sectionBar(t, right, ic) : ''; },
    th: function (label, key) { return global.PortalState ? global.PortalState.th(label, key) : ''; },
    TW: (global.PortalState && global.PortalState.TW) || {},
    resolveDriveImg: function (url, fallback) { return global.PortalState ? global.PortalState.resolveDriveImg(url, fallback) : url; },

    // Core Lifecycle & Navigation
    bootSystem: bootSystem,
    navigate: navigate,
    getContentEl: function () { return global.PortalState ? global.PortalState.getContentEl() : document.getElementById('content'); },
    setPageHeader: function (title, subtitle, iconName) { if (global.PortalUI) global.PortalUI.setPageHeader(title, subtitle, iconName); },

    // Theme & Branding
    toggleTheme: function () { if (global.PortalUI) global.PortalUI.toggleTheme(); },
    applyTheme: function (mode, saveLocal) { if (global.PortalUI) global.PortalUI.applyTheme(mode, saveLocal); },
    toggleSidebar: function () { if (global.PortalUI) global.PortalUI.toggleSidebar(); },
    togglePasswordVisibility: function (id) { if (global.PortalUI) global.PortalUI.togglePasswordVisibility(id); },
    applyBranding: function () { if (global.PortalUI) global.PortalUI.applyBranding(); },
    renderHeaderUser: function () { if (global.PortalUI) global.PortalUI.renderHeaderUser(); },
    renderSidebarNav: function () { if (global.PortalUI) global.PortalUI.renderSidebarNav(); },

    // Modals & Alerts
    openModal: function (t, b, f, w, i) { if (global.PortalUI) global.PortalUI.openModal(t, b, f, w, i); },
    closeModal: function () { if (global.PortalUI) global.PortalUI.closeModal(); },
    toast: function (t, i) { if (global.PortalUI) global.PortalUI.toast(t, i); },
    alertError: function (m, t) { if (global.PortalUI) global.PortalUI.alertError(m, t); },
    alertSuccess: function (m, t) { if (global.PortalUI) global.PortalUI.alertSuccess(m, t); },
    confirmAction: function (opts) { return global.PortalUI ? global.PortalUI.confirmAction(opts) : Promise.resolve(true); },
    openConnectionConfigModal: function (r) { if (global.PortalUI) global.PortalUI.openConnectionConfigModal(r); },
    saveConnectionConfig: function (r) { return global.PortalUI ? global.PortalUI.saveConnectionConfig(r) : Promise.resolve(); },

    // Cascade Engine
    getReferenceItems: function (t, p) { return global.PortalCascade ? global.PortalCascade.getReferenceItems(t, p) : []; },
    getPositionTypes: function () { return global.PortalCascade ? global.PortalCascade.getPositionTypes() : []; },
    getPositionsByType: function (t) { return global.PortalCascade ? global.PortalCascade.getPositionsByType(t) : []; },
    getLevelsByPosition: function (t, n) { return global.PortalCascade ? global.PortalCascade.getLevelsByPosition(t, n) : []; },
    buildOptionsHtml: function (it, s, p, v, l) { return global.PortalCascade ? global.PortalCascade.buildOptionsHtml(it, s, p, v, l) : ''; },
    bindOrgAndPositionCascade: function (p, i) { if (global.PortalCascade) global.PortalCascade.bindOrgAndPositionCascade(p, i); },

    // Auth Module
    renderLoginForm: function () { if (global.PortalAuth) global.PortalAuth.renderLoginForm(); },
    submitLogin: function (ev) { return global.PortalAuth ? global.PortalAuth.submitLogin(ev) : Promise.resolve(); },
    handleLogout: function () { return global.PortalAuth ? global.PortalAuth.handleLogout() : Promise.resolve(); },
    startRegisterWizard: function () { if (global.PortalAuth) global.PortalAuth.startRegisterWizard(); },
    backRegStep: function (s) { if (global.PortalAuth) global.PortalAuth.backRegStep(s); },
    submitRegStep1: function (ev) { return global.PortalAuth ? global.PortalAuth.submitRegStep1(ev) : Promise.resolve(); },
    submitRegStep2: function (ev) { return global.PortalAuth ? global.PortalAuth.submitRegStep2(ev) : Promise.resolve(); },
    submitRegStep3: function (ev) { return global.PortalAuth ? global.PortalAuth.submitRegStep3(ev) : Promise.resolve(); },
    renderForgotPasswordForm: function () { if (global.PortalAuth) global.PortalAuth.renderForgotPasswordForm(); },
    submitForgotPassword: function (ev) { return global.PortalAuth ? global.PortalAuth.submitForgotPassword(ev) : Promise.resolve(); },
    submitResetPassword: function (ev, tk) { return global.PortalAuth ? global.PortalAuth.submitResetPassword(ev, tk) : Promise.resolve(); },

    // Dashboard Module
    renderDashboardPage: function () { return global.PortalDashboard ? global.PortalDashboard.renderDashboardPage() : Promise.resolve(); },
    launchSubApp: function (id) { return global.PortalDashboard ? global.PortalDashboard.launchSubApp(id) : Promise.resolve(); },

    // Profile Module
    renderProfilePage: function () { if (global.PortalProfile) global.PortalProfile.renderProfilePage(); },
    clearSignaturePad: function () { if (global.PortalProfile) global.PortalProfile.clearSignaturePad(); },
    saveCanvasSignature: function () { return global.PortalProfile ? global.PortalProfile.saveCanvasSignature() : Promise.resolve(); },
    handleUploadProfilePhoto: function (ev) { return global.PortalProfile ? global.PortalProfile.handleUploadProfilePhoto(ev) : Promise.resolve(); },
    handleUploadSignatureFile: function (ev) { return global.PortalProfile ? global.PortalProfile.handleUploadSignatureFile(ev) : Promise.resolve(); },
    submitProfileUpdate: function (ev) { return global.PortalProfile ? global.PortalProfile.submitProfileUpdate(ev) : Promise.resolve(); },

    // Registry
    registerAdminRoute: registerAdminRoute
  };

  global.PORTAL_APP = PORTAL_APP;

  document.addEventListener('DOMContentLoaded', function () {
    bootSystem();
  });
})(window);
