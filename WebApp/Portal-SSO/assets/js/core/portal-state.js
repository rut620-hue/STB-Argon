/**
 * =============================================================================
 * STB APP n2 — Central Portal State & UI Atoms (assets/js/core/portal-state.js)
 * =============================================================================
 * Core State Management, Color Themes, UI Atoms & Text Formatters
 * 100% Faithful Reference Alignment with ref_122wc (JsCore.html)
 * =============================================================================
 */
(function (global) {
  'use strict';

  var STATE = {
    booted: false,
    hasSuperadmin: true,
    isSetupMode: false,
    settings: {},
    user: null,
    referenceData: [],
    positionStructure: [],
    dashboardApps: [],
    currentRoute: 'dashboard',
    theme: localStorage.getItem('stb_portal_theme_v1') || 'light',
    regWizard: {
      step: 1,
      idCard: '',
      isExistingPersonnel: false,
      existingPersonnel: null,
      formData: {}
    }
  };

  var ADMIN_ROUTES = {};
  var DASH_CHARTS = {};

  var THEME_L = ['#007B3E','#4EBA6F','#00838F','#8BC34A','#FFB300','#FF7043','#E53935','#4A148C','#C62828','#FB8C00','#FDD835','#0288D1'];
  var THEME_D = ['#2EA043','#56D364','#39C5CF','#7EE787','#E3B341','#FFA657','#FF7B72','#BC8CFF','#F85149','#F0883E','#F1E05A','#58A6FF'];
  var GRAD_L = [['#007B3E','#4EBA6F'],['#00838F','#4DD0E1'],['#8BC34A','#CDDC39'],['#FFB300','#FDD835'],['#FF7043','#FB8C00'],['#4A148C','#7B1FA2'],['#0288D1','#4FC3F7'],['#C62828','#E53935']];
  var GRAD_D = [['#2EA043','#56D364'],['#39C5CF','#7EE787'],['#7EE787','#56D364'],['#E3B341','#F1E05A'],['#FFA657','#F0883E'],['#BC8CFF','#8957E5'],['#58A6FF','#39C5CF'],['#F85149','#FF7B72']];

  function THEMEC() { return STATE.theme === 'dark' ? THEME_D : THEME_L; }
  function GRADC() { return STATE.theme === 'dark' ? GRAD_D : GRAD_L; }

  function icons() {
    try {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    } catch (e) {}
  }

  function esc(val) {
    if (val === null || val === undefined) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  var TW = {
    no: '54px', rank: '66px', name: '220px', position: '180px', posType: '140px',
    unit: '200px', sng: '180px', fai: '160px', klum: '150px', jobs: '106px',
    score: '96px', status: '110px', date: '116px', action: '116px', role: '110px',
    user: '140px', file: '58px'
  };

  function th(label, key) {
    return '<th' + (key && TW[key] ? ' style="width:' + TW[key] + '"' : '') + '>' + esc(label) + '</th>';
  }

  function statCard(t, v, ic, gi, sub) {
    var g = GRADC()[(gi || 0) % GRADC().length];
    return '<div class="stat-card" style="background:linear-gradient(135deg,' + g[0] + ',' + g[1] + ')">'
      + '<div class="deco d1"></div><div class="deco d2"></div><div class="deco d3"></div>'
      + '<div class="relative z-10"><div class="flex items-start justify-between gap-2">'
      + '<p class="text-[11px] font-medium text-white/85 break-words">' + esc(t) + '</p>'
      + '<div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0"><i data-lucide="' + (ic || 'bar-chart') + '" class="w-4 h-4 text-white"></i></div></div>'
      + '<p class="text-3xl font-extrabold mt-2 tracking-tight">' + esc(v) + '</p>'
      + '<p class="text-[10px] text-white/75 mt-0.5">' + esc(sub || 'รายการ') + '</p></div></div>';
  }

  function sectionBar(t, right, ic) {
    return '<div class="flex flex-wrap items-center gap-3 mb-4">'
      + '<div class="w-9 h-9 rounded-xl chip flex items-center justify-center shrink-0"><i data-lucide="' + (ic || 'list') + '" class="w-[18px] h-[18px]"></i></div>'
      + '<h2 class="font-bold text-base md:text-lg">' + esc(t) + '</h2>'
      + '<div class="ml-auto flex flex-wrap gap-2 items-center">' + (right || '') + '</div></div>';
  }

  function resolveDriveImg(url, fallback) {
    if (!url) return fallback || '';
    if (global.STB_DRIVE && typeof global.STB_DRIVE.resolveDriveImageUrl === 'function') {
      return global.STB_DRIVE.resolveDriveImageUrl(url) || fallback || '';
    }
    return url;
  }

  function resolveWebappTargetUrl(rawUrl, ssoToken) {
    if (!rawUrl) return '';
    var target = String(rawUrl).trim();
    try {
      target = new URL(target, window.location.href).href;
    } catch (e) {
      if (!/^https?:\/\//i.test(target)) {
        var baseDir = window.location.origin + window.location.pathname.replace(/\/index\.html$/i, '').replace(/\/$/, '');
        target = baseDir + '/' + target.replace(/^\//, '');
      }
    }
    var sep = target.indexOf('?') === -1 ? '?' : '&';
    return target + sep + 'sso_token=' + encodeURIComponent(ssoToken);
  }

  function getContentEl() {
    return document.getElementById('content') || document.getElementById('pageBody');
  }

  function destroyCharts() {
    Object.keys(DASH_CHARTS).forEach(function (k) {
      try { DASH_CHARTS[k].destroy(); } catch (e) {}
    });
    DASH_CHARTS = {};
  }

  var PortalState = {
    STATE: STATE,
    ADMIN_ROUTES: ADMIN_ROUTES,
    DASH_CHARTS: DASH_CHARTS,
    THEMEC: THEMEC,
    GRADC: GRADC,
    icons: icons,
    esc: esc,
    TW: TW,
    th: th,
    statCard: statCard,
    sectionBar: sectionBar,
    resolveDriveImg: resolveDriveImg,
    resolveWebappTargetUrl: resolveWebappTargetUrl,
    getContentEl: getContentEl,
    destroyCharts: destroyCharts
  };

  global.PortalState = PortalState;
})(window);

