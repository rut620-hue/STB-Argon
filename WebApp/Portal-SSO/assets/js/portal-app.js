/**
 * =============================================================================
 * STB APP n2 — Central Portal Core Application (assets/js/portal-app.js)
 * =============================================================================
 * 100% Faithful Reference Alignment with ref_122wc (JsCore.html & JsLayout.html)
 * - Bangkok Metropolitan Administration (BMA) Green Theme + Dark Mode
 * - UI Atoms: icons(), THEMEC(), GRADC(), statCard(), sectionBar(), th()
 * - Responsive Sidebar & Accordion Navigation (.sidebar, .menu-group, .menu-item)
 * - Dashboard with 4 BMA Stat Cards + SSO Launchpad + 2 Chart.js Analytics
 * - 3-Step Wizard Registration, Login, Profile & Canvas Signature Pad
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

  // Registry สำหรับให้ portal-admin.js ลงทะเบียน Route ผู้ดูแลระบบ
  var ADMIN_ROUTES = {};
  var DASH_CHARTS = {};

  // ===========================================================================
  // 1. UI Atoms & Helper Functions (Faithful to ref_122wc/JsCore.html)
  // ===========================================================================
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

  function togglePasswordVisibility(id) {
    var el = document.getElementById(id);
    if (el) el.type = el.type === 'password' ? 'text' : 'password';
  }

  function toggleSidebar() {
    var sb = document.getElementById('sidebar');
    var ov = document.getElementById('overlay');
    if (sb) sb.classList.toggle('-translate-x-full');
    if (ov) ov.classList.toggle('hidden');
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

  // ===========================================================================
  // 2. Theme & Branding System
  // ===========================================================================
  function applyTheme(mode, saveLocal) {
    var m = (String(mode || '').toLowerCase() === 'dark') ? 'dark' : 'light';
    STATE.theme = m;
    document.documentElement.classList.toggle('dark', m === 'dark');
    if (saveLocal !== false) {
      try { localStorage.setItem('stb_portal_theme_v1', m); } catch (e) {}
    }
    var ic = document.getElementById('themeIcon');
    if (ic) {
      ic.setAttribute('data-lucide', m === 'dark' ? 'sun' : 'moon');
      ic.innerHTML = '';
    }
    icons();
  }

  function toggleTheme() {
    applyTheme(STATE.theme === 'dark' ? 'light' : 'dark', true);
    if (STATE.currentRoute === 'dashboard') {
      renderDashboardCharts();
    }
  }

  function applyBranding() {
    var s = STATE.settings || {};
    var appName = s.App_Name || 'ระบบ Central Portal & SSO (สตบ.สนท.)';
    var orgName = s.Organization_Name || 'ส่วนตรวจและบังคับการ สำนักเทศกิจ';
    var subName = s.Organization_Sub || 'กรุงเทพมหานคร';
    var desc = s.App_Desc || 'ศูนย์กลางการยืนยันตัวตน (Single Sign-On) ทะเบียนประวัติบุคลากร และประตูเชื่อมต่อไปยังระบบงานย่อยของหน่วยงานอย่างปลอดภัย';
    var logoUrl = resolveDriveImg(
      s.Portal_Logo_URL || s.Custom_Logo_URL || s.Default_Logo_URL,
      'https://pr-bangkok.com/wp-content/uploads/2025/06/231116_BMA-Emblem_Edited_Green-600x600.png'
    );

    document.title = appName + ' · ' + orgName;
    if (global.LOADER && typeof global.LOADER.setLogo === 'function') {
      global.LOADER.setLogo(logoUrl);
    }

    [['loginSys', appName], ['sbTitle', appName], ['spSys', appName], ['ftSys', appName],
     ['loginOrg', orgName], ['sbOrg', orgName], ['spOrg', orgName], ['ftOrg', orgName],
     ['loginSub', subName], ['spSub', subName],
     ['loginDesc', desc]
    ].forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (el && pair[1]) el.textContent = pair[1];
    });

    var loginLogo = document.getElementById('loginLogo');
    if (loginLogo && logoUrl) loginLogo.src = logoUrl;
    var sbLogo = document.getElementById('sbLogo');
    if (sbLogo && logoUrl) sbLogo.src = logoUrl;
  }

  // ===========================================================================
  // 3. Universal Modal & Toast System
  // ===========================================================================
  function openModal(title, bodyHtml, footerHtml, maxWidth, iconName) {
    var modal = document.getElementById('appModal');
    var box = document.getElementById('appModalBox');
    var tEl = document.getElementById('appModalTitle');
    var bEl = document.getElementById('appModalBody');
    var fEl = document.getElementById('appModalFooter');
    var iEl = document.getElementById('appModalIcon');
    if (!modal || !bEl) return;

    if (box) box.style.maxWidth = maxWidth || '760px';
    if (tEl) tEl.innerHTML = title || 'หน้าต่างจัดการข้อมูล';
    if (iEl && iconName) {
      iEl.setAttribute('data-lucide', iconName);
      iEl.innerHTML = '';
    }
    bEl.innerHTML = bodyHtml || '';
    if (fEl) {
      fEl.innerHTML = footerHtml || '<button type="button" class="btn-ghost" onclick="PORTAL_APP.closeModal()">ปิด</button>';
    }
    modal.style.display = 'flex';
    modal.classList.add('show');
    icons();
  }

  function closeModal() {
    var modal = document.getElementById('appModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
    }
  }

  function toast(title, icon) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: icon || 'success',
        title: title,
        showConfirmButton: false,
        timer: 2400,
        timerProgressBar: true
      });
    }
  }

  function alertError(msg, title) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'error',
        title: title || 'เกิดข้อผิดพลาด',
        html: '<div style="font-size:14px;white-space:pre-line;text-align:left;line-height:1.7">' + esc(msg) + '</div>',
        confirmButtonColor: '#007B3E'
      });
    } else {
      alert(msg);
    }
  }

  function alertSuccess(msg, title) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'success',
        title: title || 'ดำเนินการสำเร็จ',
        html: '<div style="font-size:14px;text-align:left;line-height:1.7">' + esc(msg) + '</div>',
        confirmButtonColor: '#007B3E'
      });
    }
  }

  function confirmAction(options) {
    options = options || {};
    if (typeof Swal !== 'undefined') {
      return Swal.fire({
        icon: options.icon || 'warning',
        title: options.title || 'ยืนยันการทำรายการ',
        text: options.text || '',
        html: options.html || undefined,
        showCancelButton: true,
        confirmButtonText: options.confirmText || 'ยืนยัน',
        cancelButtonText: options.cancelText || 'ยกเลิก',
        confirmButtonColor: options.confirmColor || '#007B3E',
        cancelButtonColor: '#94a3b8'
      }).then(function (res) { return res.isConfirmed; });
    }
    return Promise.resolve(confirm(options.title || 'ยืนยันการทำรายการ?'));
  }

  // ===========================================================================
  // 4. Connection Config Modal (API Key Setup)
  // ===========================================================================
  function openConnectionConfigModal(autoRetryBoot) {
    var curKey = (global.STB_CONFIG && global.STB_CONFIG.SUPABASE_ANON_KEY) || '';
    var curGas = (global.STB_CONFIG && global.STB_CONFIG.GAS_BRIDGE_URL) || '';

    var body = ''
      + '<div class="space-y-4">'
      + '  <div class="p-3.5 rounded-xl soft text-xs text-muted leading-relaxed">'
      + '    ระบบนี้เชื่อมต่อตรงกับ Supabase PostgreSQL Cloud <code>ycyefnsfamlhnwgizavs</code>'
      + '    หากต้องการใช้งาน Google Drive Upload หรือ Mail Notification ให้ระบุ GAS Bridge URL ด้วย'
      + '  </div>'
      + '  <div>'
      + '    <label class="lbl">Supabase Anon Public Key <span style="color:var(--red);">*</span></label>'
      + '    <textarea id="cfgAnonKeyInput" class="inp" rows="3" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...">' + esc(curKey) + '</textarea>'
      + '  </div>'
      + '  <div>'
      + '    <label class="lbl">Google Apps Script Bridge URL (Drive Upload & Mail Service)</label>'
      + '    <input id="cfgGasUrlInput" type="text" class="inp" value="' + esc(curGas) + '" placeholder="https://script.google.com/macros/s/.../exec">'
      + '  </div>'
      + '</div>';

    var footer = ''
      + '<button type="button" class="btn-ghost" onclick="PORTAL_APP.closeModal()">ยกเลิก</button>'
      + '<button type="button" class="btn-primary" onclick="PORTAL_APP.saveConnectionConfig(' + (autoRetryBoot ? 'true' : 'false') + ')">'
      + '  <i data-lucide="save" class="w-4 h-4"></i> บันทึกและเชื่อมต่อ'
      + '</button>';

    openModal('ตั้งค่าการเชื่อมต่อระบบ (Supabase & GAS Bridge)', body, footer, '620px', 'plug');
  }

  async function saveConnectionConfig(retryBoot) {
    var keyEl = document.getElementById('cfgAnonKeyInput');
    var gasEl = document.getElementById('cfgGasUrlInput');
    var keyVal = keyEl ? keyEl.value.trim() : '';
    var gasVal = gasEl ? gasEl.value.trim() : '';

    if (!keyVal) {
      alertError('กรุณาวาง Supabase Anon Public Key ก่อนบันทึก');
      return;
    }

    if (global.STB_CONFIG) {
      global.STB_CONFIG.setSupabaseAnonKey(keyVal);
      if (gasVal) global.STB_CONFIG.setGasBridgeUrl(gasVal);
    }
    closeModal();
    toast('บันทึกการตั้งค่าการเชื่อมต่อเรียบร้อยแล้ว');
    if (retryBoot || !STATE.booted) {
      await bootSystem();
    }
  }

  // ===========================================================================
  // 5. Reference & Position Cascade Helpers
  // ===========================================================================
  function getReferenceItems(type, parentValue) {
    var targetType = String(type || '').toUpperCase();
    var hasParentConstraint = (parentValue !== undefined && parentValue !== null);

    if (hasParentConstraint && String(parentValue).trim() === '') {
      return [];
    }

    var list = (STATE.referenceData || []).filter(function (item) {
      if (item.is_active === false) return false;
      if (String(item.type || '').toUpperCase() !== targetType) return false;
      if (hasParentConstraint) {
        return String(item.parent_value || '').trim() === String(parentValue).trim();
      }
      return true;
    });

    list.sort(function (a, b) { return (a.sort_order || 999) - (b.sort_order || 999); });

    var seen = {};
    var uniqueList = [];
    list.forEach(function (it) {
      var k = String(it.value || '').trim();
      if (k && !seen[k]) {
        seen[k] = true;
        uniqueList.push(it);
      }
    });
    return uniqueList;
  }

  function getPositionTypes() {
    var seen = {};
    var result = [];
    (STATE.positionStructure || []).forEach(function (p) {
      var t = String(p.position_type || '').trim();
      if (t && !seen[t] && p.is_active !== false) {
        seen[t] = true;
        result.push(t);
      }
    });
    return result;
  }

  function getPositionsByType(posType) {
    var seen = {};
    var out = [];
    var rows = (STATE.positionStructure || []).filter(function (p) {
      return p.is_active !== false && (!posType || String(p.position_type || '').trim() === String(posType).trim());
    });
    rows.sort(function (a, b) { return (a.sort_order || 999) - (b.sort_order || 999); });
    rows.forEach(function (r) {
      var name = String(r.position_name || '').trim();
      if (name && !seen[name]) {
        seen[name] = true;
        out.push(name);
      }
    });
    return out;
  }

  function getLevelsByPosition(posType, posName) {
    if (posName === undefined && posType) {
      posName = posType;
      posType = null;
    }
    var seen = {};
    var out = [];
    var rows = (STATE.positionStructure || []).filter(function (p) {
      if (p.is_active === false) return false;
      if (posType && String(p.position_type || '').trim() !== String(posType).trim()) return false;
      if (posName && String(p.position_name || '').trim() !== String(posName).trim()) return false;
      return !!p.position_level;
    });
    rows.sort(function (a, b) { return (a.sort_order || 999) - (b.sort_order || 999); });
    rows.forEach(function (r) {
      var lvl = String(r.position_level || '').trim();
      if (lvl && !seen[lvl]) {
        seen[lvl] = true;
        out.push(lvl);
      }
    });
    return out;
  }

  function buildOptionsHtml(items, selectedVal, placeholder, valueProp, labelProp) {
    var html = '<option value="">' + esc(placeholder || '-- เลือก --') + '</option>';
    var seen = {};
    (items || []).forEach(function (it) {
      if (it === null || it === undefined) return;
      var val = typeof it === 'object' ? it[valueProp || 'value'] : it;
      var lbl = typeof it === 'object' ? it[labelProp || 'value'] : it;
      val = String(val !== undefined && val !== null ? val : '').trim();
      lbl = String(lbl !== undefined && lbl !== null ? lbl : '').trim();
      if (!val) return;
      if (seen[val]) return;
      seen[val] = true;
      var sel = String(val) === String(selectedVal || '').trim() ? ' selected' : '';
      html += '<option value="' + esc(val) + '"' + sel + '>' + esc(lbl || val) + '</option>';
    });
    return html;
  }

  function bindOrgAndPositionCascade(prefixId, initialValues) {
    initialValues = initialValues || {};
    var elPosType = document.getElementById(prefixId + '_position_type');
    var elPosName = document.getElementById(prefixId + '_position');
    var elPosLevel = document.getElementById(prefixId + '_position_level');

    var elBureau = document.getElementById(prefixId + '_bureau_name');
    var elOffice = document.getElementById(prefixId + '_office');
    var elDept = document.getElementById(prefixId + '_department');
    var elDiv = document.getElementById(prefixId + '_division');

    function refreshPosName(keepSelected) {
      if (!elPosName) return;
      var pType = elPosType ? elPosType.value : '';
      var curPos = keepSelected ? (elPosName.value || initialValues.position || '') : '';
      var names = getPositionsByType(pType);
      if (curPos && names.indexOf(curPos) === -1) names.unshift(curPos);
      elPosName.innerHTML = buildOptionsHtml(names, curPos, '-- เลือกสายงาน/ตำแหน่ง --');
      refreshPosLevel(keepSelected);
    }

    function refreshPosLevel(keepSelected) {
      if (!elPosLevel) return;
      var pType = elPosType ? elPosType.value : '';
      var pName = elPosName ? elPosName.value : '';
      var curLvl = keepSelected ? (elPosLevel.value || initialValues.position_level || '') : '';
      var levels = getLevelsByPosition(pType, pName);
      if (curLvl && levels.indexOf(curLvl) === -1) levels.unshift(curLvl);
      if (levels.length === 0) {
        elPosLevel.innerHTML = '<option value="">-- ไม่มีระดับตำแหน่ง --</option>';
      } else {
        elPosLevel.innerHTML = buildOptionsHtml(levels, curLvl, '-- เลือกระดับตำแหน่ง --');
      }
    }

    function refreshOffice(keepSelected) {
      if (!elOffice) return;
      var bVal = elBureau ? elBureau.value : '';
      var curOff = keepSelected ? (elOffice.value || initialValues.office || '') : '';
      var items = getReferenceItems('OFFICE', bVal).map(function (x) { return x.value; });
      if (curOff && items.indexOf(curOff) === -1) items.unshift(curOff);
      elOffice.innerHTML = buildOptionsHtml(items, curOff, bVal ? '-- เลือกสำนักงาน/กอง --' : '-- กรุณาเลือกสำนักก่อน --');
      refreshDept(keepSelected);
    }

    function refreshDept(keepSelected) {
      if (!elDept) return;
      var oVal = elOffice ? elOffice.value : '';
      var curDept = keepSelected ? (elDept.value || initialValues.department || '') : '';
      var items = getReferenceItems('DEPARTMENT', oVal).map(function (x) { return x.value; });
      if (curDept && items.indexOf(curDept) === -1) items.unshift(curDept);
      elDept.innerHTML = buildOptionsHtml(items, curDept, oVal ? '-- เลือกฝ่าย/ส่วน --' : '-- กรุณาเลือกสำนักงาน/กองก่อน --');
      refreshDiv(keepSelected);
    }

    function refreshDiv(keepSelected) {
      if (!elDiv) return;
      var dVal = elDept ? elDept.value : '';
      var curDiv = keepSelected ? (elDiv.value || initialValues.division || '') : '';
      var items = getReferenceItems('DIVISION', dVal).map(function (x) { return x.value; });
      if (curDiv && items.indexOf(curDiv) === -1) items.unshift(curDiv);
      elDiv.innerHTML = buildOptionsHtml(items, curDiv, dVal ? '-- เลือกกลุ่มงาน (ถ้ามี) --' : '-- กรุณาเลือกฝ่าย/ส่วนก่อน --');
    }

    if (elPosType) elPosType.addEventListener('change', function () { refreshPosName(false); });
    if (elPosName) elPosName.addEventListener('change', function () { refreshPosLevel(false); });
    if (elBureau) elBureau.addEventListener('change', function () { refreshOffice(false); });
    if (elOffice) elOffice.addEventListener('change', function () { refreshDept(false); });
    if (elDept) elDept.addEventListener('change', function () { refreshDiv(false); });

    refreshPosName(true);
    refreshOffice(true);
  }

  // ===========================================================================
  // 6. System Boot & Setup Bypass Logic
  // ===========================================================================
  async function bootSystem() {
    var spBar = document.getElementById('splashBar');
    var progress = 15;
    var timer = setInterval(function () {
      progress = Math.min(90, progress + Math.random() * 16);
      if (spBar) spBar.style.width = progress + '%';
    }, 150);

    applyTheme(STATE.theme, false);

    if (!global.STB_CONFIG || !global.STB_CONFIG.SUPABASE_ANON_KEY) {
      clearInterval(timer);
      hideSplash();
      showLoginShell();
      renderMissingKeyNotice();
      openConnectionConfigModal(true);
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

      if (!localStorage.getItem('stb_portal_theme_v1') && STATE.settings.Default_Theme) {
        applyTheme(STATE.settings.Default_Theme, false);
      }
      applyBranding();

      setTimeout(function () {
        hideSplash();

        var rawHash = String(window.location.hash || '').replace(/^#/, '');
        if (rawHash.indexOf('verify-email') === 0) {
          showLoginShell();
          handleVerifyEmailHash(rawHash);
          return;
        }
        if (rawHash.indexOf('reset-password') === 0) {
          showLoginShell();
          renderResetPasswordForm(rawHash);
          return;
        }

        // กรณีที่ 1: First-Time Setup Bypass
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
          showAppShell();
          var defaultSetupRoute = rawHash && rawHash !== 'login' ? rawHash.split('?')[0] : 'personnel';
          navigate(defaultSetupRoute);
          return;
        }

        // กรณีที่ 2: มี Session เดิม
        if (STATE.user && (STATE.user.Personnel_ID || STATE.user.personnelId)) {
          global.PORTAL_API.setCachedUser(STATE.user);
          showAppShell();
          var startRoute = rawHash && rawHash !== 'login' ? rawHash.split('?')[0] : 'dashboard';
          navigate(startRoute);
          return;
        }

        // กรณีที่ 3: แสดงหน้า Login
        global.PORTAL_API.setSessionToken('');
        global.PORTAL_API.setCachedUser(null);
        showLoginShell();
        renderLoginForm();
      }, 350);
    } catch (err) {
      clearInterval(timer);
      hideSplash();
      showLoginShell();
      renderBootErrorPanel(err);
    }
  }

  function hideSplash() {
    var sp = document.getElementById('splash');
    if (sp) {
      sp.style.transition = 'opacity 0.3s ease';
      sp.style.opacity = '0';
      setTimeout(function () { sp.style.display = 'none'; sp.classList.add('hidden'); }, 300);
    }
  }

  function showLoginShell() {
    var lv = document.getElementById('loginView');
    var av = document.getElementById('appView');
    if (lv) { lv.style.display = 'flex'; lv.classList.remove('hidden'); }
    if (av) { av.style.display = 'none'; av.classList.add('hidden'); }
    icons();
  }

  function showAppShell() {
    var lv = document.getElementById('loginView');
    var av = document.getElementById('appView');
    var sb = document.getElementById('setupBanner');
    if (lv) { lv.style.display = 'none'; lv.classList.add('hidden'); }
    if (av) { av.style.display = 'flex'; av.classList.remove('hidden'); }
    if (sb) sb.style.display = (STATE.isSetupMode || !STATE.hasSuperadmin) ? 'flex' : 'none';
    renderHeaderUser();
    renderSidebarNav();
    icons();
  }

  function renderHeaderUser() {
    var u = STATE.user || {};
    var name = u.FullName || u.fullName || u.Username || u.username || 'ผู้ใช้งาน';
    var role = u.Role || u.role || 'USER';
    var pos = u.Position || u.position || role || '';
    var ini = (name || 'A').replace(/^\s+/, '').charAt(0);

    var elHdName = document.getElementById('hdName') || document.getElementById('hdrUserName');
    if (elHdName) elHdName.textContent = name;
    var elHdRole = document.getElementById('hdRole') || document.getElementById('hdrUserPos');
    if (elHdRole) elHdRole.textContent = pos;
    var elHdAvatar = document.getElementById('hdAvatar');
    if (elHdAvatar) {
      var photo = resolveDriveImg(u.Photo_URL || u.photoUrl || u.photo_url, '');
      if (photo) {
        elHdAvatar.innerHTML = '<img src="' + esc(photo) + '" class="w-full h-full rounded-full object-cover" alt="Avatar">';
      } else {
        elHdAvatar.textContent = ini;
      }
    }

    var elRoleBadge = document.getElementById('roleBadgeTx') || document.getElementById('sbRoleBadge');
    if (elRoleBadge) {
      elRoleBadge.textContent = STATE.isSetupMode ? 'SETUP MODE' : role;
    }
    var elSetupBadge = document.getElementById('setupBadge');
    if (elSetupBadge) {
      if (STATE.isSetupMode || !STATE.hasSuperadmin) elSetupBadge.classList.remove('hidden');
      else elSetupBadge.classList.add('hidden');
    }
  }

  function renderSidebarNav() {
    var nav = document.getElementById('sbNav');
    if (!nav) return;

    var role = (STATE.user && (STATE.user.Role || STATE.user.role)) || 'USER';
    var isAdmin = STATE.isSetupMode || role === 'ADMIN' || role === 'SUPERADMIN';
    var isSuper = STATE.isSetupMode || role === 'SUPERADMIN';

    var html = '';
    html += '<div class="menu-group">ข้อมูลและบริการ</div>';
    html += '<div class="menu-item' + (STATE.currentRoute === 'dashboard' ? ' active' : '') + '" data-route="dashboard" onclick="PORTAL_APP.navigate(\'dashboard\')">'
      + '<i data-lucide="layout-dashboard" class="w-[18px] h-[18px] shrink-0"></i><span class="truncate">Dashboard</span></div>';

    if (!STATE.isSetupMode) {
      html += '<div class="menu-item' + (STATE.currentRoute === 'profile' ? ' active' : '') + '" data-route="profile" onclick="PORTAL_APP.navigate(\'profile\')">'
        + '<i data-lucide="id-card" class="w-[18px] h-[18px] shrink-0"></i><span class="truncate">โปรไฟล์และลายเซ็น</span></div>';
    }

    if (isAdmin) {
      html += '<div class="menu-group">จัดการระบบ (Admin)</div>';
      html += '<div class="menu-item' + (STATE.currentRoute === 'personnel' ? ' active' : '') + '" data-route="personnel" onclick="PORTAL_APP.navigate(\'personnel\')">'
        + '<i data-lucide="users" class="w-[18px] h-[18px] shrink-0"></i><span class="truncate">ทำเนียบบุคลากร</span></div>';
      html += '<div class="menu-item' + (STATE.currentRoute === 'users' ? ' active' : '') + '" data-route="users" onclick="PORTAL_APP.navigate(\'users\')">'
        + '<i data-lucide="shield-check" class="w-[18px] h-[18px] shrink-0"></i><span class="truncate">จัดการบัญชีและสิทธิ์</span></div>';
    }

    if (isSuper) {
      html += '<div class="menu-group">ตั้งค่าโครงสร้าง (Superadmin)</div>';
      html += '<div class="menu-item' + (STATE.currentRoute === 'webapps' ? ' active' : '') + '" data-route="webapps" onclick="PORTAL_APP.navigate(\'webapps\')">'
        + '<i data-lucide="grid" class="w-[18px] h-[18px] shrink-0"></i><span class="truncate">จัดการเว็บแอปย่อย (SSO)</span></div>';
      html += '<div class="menu-item' + (STATE.currentRoute === 'reference' ? ' active' : '') + '" data-route="reference" onclick="PORTAL_APP.navigate(\'reference\')">'
        + '<i data-lucide="network" class="w-[18px] h-[18px] shrink-0"></i><span class="truncate">โครงสร้างสังกัด & คำนำหน้า</span></div>';
      html += '<div class="menu-item' + (STATE.currentRoute === 'positions' ? ' active' : '') + '" data-route="positions" onclick="PORTAL_APP.navigate(\'positions\')">'
        + '<i data-lucide="layers" class="w-[18px] h-[18px] shrink-0"></i><span class="truncate">โครงสร้างตำแหน่ง/ระดับ</span></div>';
      html += '<div class="menu-item' + (STATE.currentRoute === 'settings' ? ' active' : '') + '" data-route="settings" onclick="PORTAL_APP.navigate(\'settings\')">'
        + '<i data-lucide="settings" class="w-[18px] h-[18px] shrink-0"></i><span class="truncate">ตั้งค่าระบบ (Settings)</span></div>';
    }

    nav.innerHTML = html;
    icons();
  }

  function highlightSidebar(route) {
    var links = document.querySelectorAll('#sbNav .menu-item');
    for (var i = 0; i < links.length; i++) {
      var r = links[i].getAttribute('data-route');
      if (r === route) links[i].classList.add('active');
      else links[i].classList.remove('active');
    }
  }

  function setPageHeader(title, subtitle, iconName) {
    var t = document.getElementById('pageTitle') || document.getElementById('hdrPageTitle');
    var s = document.getElementById('pageSub') || document.getElementById('hdrPageSub');
    var ic = document.getElementById('pageIcon');
    if (t) t.textContent = title || '';
    if (s) s.textContent = subtitle || '';
    if (ic && iconName) {
      ic.setAttribute('data-lucide', iconName);
      ic.innerHTML = '';
    }
    icons();
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
    highlightSidebar(cleanRoute);
    destroyCharts();

    if (cleanRoute === 'dashboard') {
      setPageHeader('Dashboard', 'ภาพรวมระบบและเว็บแอปพลิเคชัน Single Sign-On', 'layout-dashboard');
      await renderDashboardPage();
      return;
    }

    if (cleanRoute === 'profile') {
      if (STATE.isSetupMode) {
        toast('ในโหมดตั้งค่าครั้งแรก กรุณาเพิ่มข้อมูลบุคลากรและผูกบัญชี SUPERADMIN ก่อน', 'info');
        await navigate('personnel');
        return;
      }
      setPageHeader('โปรไฟล์และลายเซ็น', 'จัดการข้อมูลส่วนบุคคล รูปถ่าย และลายเซ็นอิเล็กทรอนิกส์', 'id-card');
      renderProfilePage();
      return;
    }

    if (ADMIN_ROUTES[cleanRoute]) {
      await ADMIN_ROUTES[cleanRoute]();
      return;
    }

    var content = getContentEl();
    if (content) {
      content.innerHTML = '<div class="card p-10 text-center muted">กำลังเตรียมโมดูล (' + esc(cleanRoute) + ')</div>';
    }
  }

  // ===========================================================================
  // 7. Auth Views (Login & Registration)
  // ===========================================================================
  function renderMissingKeyNotice() {
    var box = document.getElementById('authPanelBody');
    if (!box) return;
    box.innerHTML = ''
      + '<div class="text-center py-6">'
      + '  <div class="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-500 inline-flex items-center justify-center mb-4">'
      + '    <i data-lucide="key" class="w-8 h-8"></i>'
      + '  </div>'
      + '  <h2 class="text-xl font-bold mb-2">ตั้งค่าการเชื่อมต่อฐานข้อมูลครั้งแรก</h2>'
      + '  <p class="text-sm muted mb-6">กรุณาระบุ <b>Supabase Anon Public Key</b> เพื่อเริ่มใช้งานระบบ Central Portal & SSO</p>'
      + '  <button type="button" class="btn-primary" onclick="PORTAL_APP.openConnectionConfigModal(true)">'
      + '    <i data-lucide="plug" class="w-4 h-4"></i> ตั้งค่า Supabase Anon Key'
      + '  </button>'
      + '</div>';
    icons();
  }

  function renderBootErrorPanel(err) {
    var box = document.getElementById('authPanelBody');
    if (!box) return;
    box.innerHTML = ''
      + '<div class="text-center py-6">'
      + '  <div class="w-16 h-16 rounded-2xl bg-red-500/15 text-red-500 inline-flex items-center justify-center mb-4">'
      + '    <i data-lucide="alert-triangle" class="w-8 h-8"></i>'
      + '  </div>'
      + '  <h2 class="text-xl font-bold mb-2">ไม่สามารถเชื่อมต่อฐานข้อมูลได้</h2>'
      + '  <p class="text-sm text-red-500 mb-6">' + esc(err && err.message ? err.message : 'Unknown Error') + '</p>'
      + '  <div class="flex gap-2 justify-center">'
      + '    <button type="button" class="btn-ghost" onclick="PORTAL_APP.openConnectionConfigModal(true)"><i data-lucide="plug" class="w-4 h-4"></i> ตรวจสอบ API Key</button>'
      + '    <button type="button" class="btn-primary" onclick="PORTAL_APP.bootSystem()"><i data-lucide="refresh-cw" class="w-4 h-4"></i> ลองใหม่อีกครั้ง</button>'
      + '  </div>'
      + '</div>';
    icons();
  }

  function renderLoginForm() {
    var box = document.getElementById('authPanelBody');
    if (!box) return;
    var allowReg = String(STATE.settings.Allow_Registration || 'TRUE').toUpperCase() === 'TRUE';

    box.innerHTML = ''
      + '<div>'
      + '  <div class="mb-5">'
      + '    <span class="badge chip mb-2"><i data-lucide="lock" class="w-3.5 h-3.5"></i> Single Sign-On Portal</span>'
      + '    <h2 class="text-2xl font-bold">เข้าสู่ระบบ</h2>'
      + '    <p class="text-sm muted mt-1">กรุณากรอกบัญชีผู้ใช้งานของท่านเพื่อเข้าสู่ระบบส่วนกลาง</p>'
      + '  </div>'
      + '  <form id="loginForm" onsubmit="PORTAL_APP.submitLogin(event)" class="space-y-4">'
      + '    <div>'
      + '      <label class="lbl">ชื่อผู้ใช้งาน หรือ อีเมล</label>'
      + '      <div class="relative">'
      + '        <i data-lucide="user" class="w-4 h-4 absolute left-3 top-3.5 muted"></i>'
      + '        <input id="loginUsername" class="inp pl-9" placeholder="username หรือ email" required autocomplete="username">'
      + '      </div>'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">รหัสผ่าน</label>'
      + '      <div class="relative">'
      + '        <i data-lucide="lock" class="w-4 h-4 absolute left-3 top-3.5 muted"></i>'
      + '        <input id="loginPassword" type="password" class="inp pl-9 pr-10" placeholder="••••••••" required autocomplete="current-password">'
      + '        <button type="button" onclick="PORTAL_APP.togglePasswordVisibility(\'loginPassword\')" class="absolute right-3 top-3 muted hover:text-slate-700">'
      + '          <i data-lucide="eye" class="w-4 h-4"></i>'
      + '        </button>'
      + '      </div>'
      + '    </div>'
      + '    <div class="flex justify-end">'
      + '      <a href="javascript:void(0)" onclick="PORTAL_APP.renderForgotPasswordForm()" class="text-xs font-semibold accent hover:underline inline-flex items-center gap-1">'
      + '        <i data-lucide="key-round" class="w-3.5 h-3.5"></i> ลืมรหัสผ่าน?'
      + '      </a>'
      + '    </div>'
      + '    <button type="submit" class="btn-primary w-full !py-3 !text-base">'
      + '      <i data-lucide="log-in" class="w-4 h-4"></i> เข้าสู่ระบบ'
      + '    </button>'
      + '  </form>'
      + (allowReg
        ? '<div class="mt-5 pt-4 text-center text-xs muted" style="border-top:1px solid var(--border)">'
          + 'ยังไม่มีบัญชีผู้ใช้งานใช่หรือไม่? '
          + '<a href="javascript:void(0)" onclick="PORTAL_APP.startRegisterWizard()" class="font-bold accent hover:underline">ลงทะเบียนผู้ใช้งานใหม่</a>'
          + '</div>'
        : '')
      + '</div>';
    icons();
  }

  async function submitLogin(ev) {
    if (ev) ev.preventDefault();
    var uEl = document.getElementById('loginUsername');
    var pEl = document.getElementById('loginPassword');
    var username = uEl ? uEl.value.trim() : '';
    var password = pEl ? pEl.value : '';
    if (!username || !password) return;

    try {
      var res = await global.PORTAL_API.login(username, password);
      STATE.user = res.user;
      STATE.isSetupMode = false;
      STATE.hasSuperadmin = true;
      toast('ยินดีต้อนรับ ' + (STATE.user.FullName || STATE.user.Username));
      showAppShell();
      await navigate('dashboard');
    } catch (err) {
      alertError(err.message || 'ไม่สามารถเข้าสู่ระบบได้', 'เข้าสู่ระบบไม่สำเร็จ');
    }
  }

  async function handleLogout() {
    var u = STATE.user || {};
    var name = u.FullName || u.fullName || u.Username || 'ผู้ใช้งาน';
    var confirmed = await confirmAction({
      title: 'ต้องการออกจากระบบหรือไม่?',
      text: 'ระบบจะล้างข้อมูลการเข้าสู่ระบบของ ' + name + ' และกลับสู่หน้าเข้าสู่ระบบ',
      confirmText: 'ออกจากระบบ',
      cancelText: 'อยู่ต่อ',
      confirmColor: '#E53935'
    });
    if (!confirmed) return;

    await global.PORTAL_API.logout();
    STATE.user = null;
    await bootSystem();
  }

  // ---------------------------------------------------------------------------
  // 3-Step Registration Wizard
  // ---------------------------------------------------------------------------
  function startRegisterWizard() {
    STATE.regWizard = {
      step: 1,
      idCard: '',
      isExistingPersonnel: false,
      existingPersonnel: null,
      formData: {}
    };
    renderRegisterWizard();
  }

  function renderRegisterWizard() {
    var box = document.getElementById('authPanelBody');
    if (!box) return;
    var w = STATE.regWizard;

    var stepPills = ''
      + '<div class="flex gap-2 mb-4">'
      + '  <span class="badge ' + (w.step === 1 ? 'chip' : 'soft') + '">1. ตรวจบัตร 13 หลัก</span>'
      + '  <span class="badge ' + (w.step === 2 ? 'chip' : 'soft') + '">2. ข้อมูลบุคลากร</span>'
      + '  <span class="badge ' + (w.step === 3 ? 'chip' : 'soft') + '">3. ตั้งค่าบัญชี</span>'
      + '</div>';

    if (w.step === 1) {
      box.innerHTML = ''
        + '<div>'
        + stepPills
        + '<h2 class="text-xl font-bold mb-1">ขั้นตอนที่ 1: ตรวจสอบเลขบัตรประชาชน</h2>'
        + '<p class="text-xs muted mb-4">ระบบจะตรวจสอบสูตร Modulo-11 และค้นหาประวัติเดิมในทำเนียบบุคลากร</p>'
        + '<form onsubmit="PORTAL_APP.submitRegStep1(event)" class="space-y-4">'
        + '  <div>'
        + '    <label class="lbl">เลขประจำตัวประชาชน (13 หลัก) *</label>'
        + '    <input id="regIdCardInput" type="text" maxlength="13" class="inp" placeholder="ระบุตัวเลข 13 หลัก" value="' + esc(w.idCard) + '" required>'
        + '  </div>'
        + '  <div class="flex gap-2">'
        + '    <button type="button" class="btn-ghost" onclick="PORTAL_APP.renderLoginForm()"><i data-lucide="arrow-left" class="w-4 h-4"></i> กลับ</button>'
        + '    <button type="submit" class="btn-primary flex-1 justify-center">ตรวจสอบ <i data-lucide="arrow-right" class="w-4 h-4"></i></button>'
        + '  </div>'
        + '</form>'
        + '</div>';
      icons();
      return;
    }

    if (w.step === 2) {
      var prefixes = getReferenceItems('PREFIX').map(function (x) { return x.value; });
      var bureaus = getReferenceItems('BUREAU').map(function (x) { return x.value; });
      var posTypes = getPositionTypes();
      var fd = w.formData || {};
      var defBureau = fd.bureau_name || (bureaus.length > 0 ? bureaus[0] : '');
      var defPosType = fd.position_type || (posTypes.length > 0 ? posTypes[0] : '');

      box.innerHTML = ''
        + '<div>'
        + stepPills
        + '<h2 class="text-xl font-bold mb-1">ขั้นตอนที่ 2: ข้อมูลบุคลากร</h2>'
        + '<p class="text-xs muted mb-3">กรุณากรอกข้อมูลพื้นฐานเพื่อสร้างทะเบียนบุคลากร</p>'
        + '<form onsubmit="PORTAL_APP.submitRegStep2(event)" class="space-y-3">'
        + '  <div class="grid grid-cols-3 gap-2">'
        + '    <div><label class="lbl">คำนำหน้า *</label><select id="reg_prefix" class="inp" required>' + buildOptionsHtml(prefixes, fd.prefix, '-- เลือก --') + '</select></div>'
        + '    <div><label class="lbl">ชื่อ *</label><input id="reg_first_name" class="inp" value="' + esc(fd.first_name || '') + '" required></div>'
        + '    <div><label class="lbl">นามสกุล *</label><input id="reg_last_name" class="inp" value="' + esc(fd.last_name || '') + '" required></div>'
        + '  </div>'
        + '  <div class="grid grid-cols-2 gap-2">'
        + '    <div><label class="lbl">ประเภทตำแหน่ง *</label><select id="reg_position_type" class="inp" required>' + buildOptionsHtml(posTypes, defPosType, '-- เลือกประเภทตำแหน่ง --') + '</select></div>'
        + '    <div><label class="lbl">สายงาน/ตำแหน่ง *</label><select id="reg_position" class="inp" required></select></div>'
        + '  </div>'
        + '  <div class="grid grid-cols-2 gap-2">'
        + '    <div><label class="lbl">ระดับตำแหน่ง</label><select id="reg_position_level" class="inp"></select></div>'
        + '    <div><label class="lbl">สำนัก *</label><select id="reg_bureau_name" class="inp" required>' + buildOptionsHtml(bureaus, defBureau, '-- เลือกสำนัก --') + '</select></div>'
        + '  </div>'
        + '  <div class="grid grid-cols-2 gap-2">'
        + '    <div><label class="lbl">สำนักงาน/กอง *</label><select id="reg_office" class="inp" required></select></div>'
        + '    <div><label class="lbl">ส่วน/ฝ่าย *</label><select id="reg_department" class="inp" required></select></div>'
        + '  </div>'
        + '  <div>'
        + '    <label class="lbl">กลุ่มงาน (ถ้ามี)</label><select id="reg_division" class="inp"></select>'
        + '  </div>'
        + '  <div class="flex gap-2 pt-2">'
        + '    <button type="button" class="btn-ghost" onclick="PORTAL_APP.backRegStep(1)"><i data-lucide="arrow-left" class="w-4 h-4"></i> ย้อนกลับ</button>'
        + '    <button type="submit" class="btn-primary flex-1 justify-center">ถัดไป <i data-lucide="arrow-right" class="w-4 h-4"></i></button>'
        + '  </div>'
        + '</form>'
        + '</div>';

      bindOrgAndPositionCascade('reg', fd);
      icons();
      return;
    }

    if (w.step === 3) {
      box.innerHTML = ''
        + '<div>'
        + stepPills
        + '<h2 class="text-xl font-bold mb-1">ขั้นตอนที่ 3: ตั้งค่าบัญชีและรหัสผ่าน</h2>'
        + '<p class="text-xs muted mb-3">กำหนดชื่อผู้ใช้งาน อีเมล และรหัสผ่านเพื่อเข้าใช้งาน</p>'
        + '<form onsubmit="PORTAL_APP.submitRegStep3(event)" class="space-y-3">'
        + '  <div><label class="lbl">ชื่อผู้ใช้งาน (Username) *</label><input id="reg_username" class="inp" placeholder="ภาษาอังกฤษ ตัวเลข 4-20 ตัว" required autocomplete="username"></div>'
        + '  <div><label class="lbl">อีเมล (Email) *</label><input id="reg_email" type="email" class="inp" placeholder="user@bangkok.go.th" required autocomplete="email"></div>'
        + '  <div class="grid grid-cols-2 gap-2">'
        + '    <div><label class="lbl">รหัสผ่าน (Password) *</label><input id="reg_password" type="password" minlength="8" class="inp" placeholder="อย่างน้อย 8 ตัวอักษร" required autocomplete="new-password"></div>'
        + '    <div><label class="lbl">ยืนยันรหัสผ่าน *</label><input id="reg_password_confirm" type="password" minlength="8" class="inp" placeholder="ระบุซ้ำอีกครั้ง" required autocomplete="new-password"></div>'
        + '  </div>'
        + '  <div class="flex gap-2 pt-2">'
        + '    <button type="button" class="btn-ghost" onclick="PORTAL_APP.backRegStep(' + (w.isExistingPersonnel ? 1 : 2) + ')"><i data-lucide="arrow-left" class="w-4 h-4"></i> ย้อนกลับ</button>'
        + '    <button type="submit" class="btn-primary flex-1 justify-center"><i data-lucide="user-check" class="w-4 h-4"></i> ยืนยันการลงทะเบียน</button>'
        + '  </div>'
        + '</form>'
        + '</div>';
      icons();
    }
  }

  function backRegStep(targetStep) {
    STATE.regWizard.step = targetStep;
    renderRegisterWizard();
  }

  async function submitRegStep1(ev) {
    if (ev) ev.preventDefault();
    var idInput = document.getElementById('regIdCardInput');
    var idVal = idInput ? idInput.value.trim() : '';

    if (!/^\d{13}$/.test(idVal)) {
      alertError('เลขประจำตัวประชาชนต้องเป็นตัวเลข 13 หลัก');
      return;
    }

    try {
      var res = await global.PORTAL_API.checkIdCardPersonnel(idVal);
      STATE.regWizard.idCard = idVal;
      STATE.regWizard.isExistingPersonnel = !!res.found;
      STATE.regWizard.existingPersonnel = res.personnel || null;

      if (res.found && res.has_user_account) {
        alertError('เลขบัตรประชาชนนี้มีบัญชีผู้ใช้งานในระบบแล้ว กรุณาเข้าสู่ระบบ หรือใช้เมนูลืมรหัสผ่าน');
        return;
      }

      if (res.found) {
        var p = res.personnel || {};
        toast('พบข้อมูลบุคลากรเดิม: ' + (p.full_name || (p.first_name + ' ' + p.last_name)));
        STATE.regWizard.formData = {
          prefix: p.prefix,
          first_name: p.first_name,
          last_name: p.last_name,
          position_type: p.position_type,
          position: p.position,
          position_level: p.position_level,
          bureau_name: p.bureau_name,
          office: p.office,
          department: p.department,
          division: p.division
        };
        STATE.regWizard.step = 3;
      } else {
        STATE.regWizard.step = 2;
      }
      renderRegisterWizard();
    } catch (err) {
      alertError(err.message || 'ไม่สามารถตรวจสอบเลขบัตรประชาชนได้');
    }
  }

  function submitRegStep2(ev) {
    if (ev) ev.preventDefault();
    var fd = {
      prefix: document.getElementById('reg_prefix').value,
      first_name: document.getElementById('reg_first_name').value.trim(),
      last_name: document.getElementById('reg_last_name').value.trim(),
      position_type: document.getElementById('reg_position_type').value,
      position: document.getElementById('reg_position').value,
      position_level: document.getElementById('reg_position_level').value,
      bureau_name: document.getElementById('reg_bureau_name').value,
      office: document.getElementById('reg_office').value,
      department: document.getElementById('reg_department').value,
      division: (document.getElementById('reg_division') && document.getElementById('reg_division').value) || ''
    };

    if (!fd.first_name || !fd.last_name || !fd.position || !fd.office || !fd.department) {
      alertError('กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน');
      return;
    }

    STATE.regWizard.formData = fd;
    STATE.regWizard.step = 3;
    renderRegisterWizard();
  }

  async function submitRegStep3(ev) {
    if (ev) ev.preventDefault();
    var username = document.getElementById('reg_username').value.trim();
    var email = document.getElementById('reg_email').value.trim();
    var p1 = document.getElementById('reg_password').value;
    var p2 = document.getElementById('reg_password_confirm').value;

    if (p1 !== p2) {
      alertError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    var w = STATE.regWizard;
    var fd = w.formData || {};

    var payload = {
      id_card: w.idCard,
      username: username,
      email: email,
      password: p1,
      prefix: fd.prefix,
      first_name: fd.first_name,
      last_name: fd.last_name,
      position_type: fd.position_type,
      position: fd.position,
      position_level: fd.position_level,
      bureau_name: fd.bureau_name,
      office: fd.office,
      department: fd.department,
      division: fd.division
    };

    try {
      var res = await global.PORTAL_API.register(payload);
      alertSuccess(
        res.message || 'ลงทะเบียนสำเร็จ! หากระบบต้องการยืนยันอีเมล กรุณาตรวจสอบลิงก์ในกล่องข้อความของท่าน',
        'ลงทะเบียนสำเร็จ'
      );
      renderLoginForm();
    } catch (err) {
      alertError(err.message || 'ไม่สามารถลงทะเบียนได้');
    }
  }

  function renderForgotPasswordForm() {
    var box = document.getElementById('authPanelBody');
    if (!box) return;

    box.innerHTML = ''
      + '<div>'
      + '  <div class="mb-4">'
      + '    <h2 class="text-xl font-bold">ขอรีเซ็ตรหัสผ่าน</h2>'
      + '    <p class="text-xs muted mt-1">ระบุอีเมลที่ใช้ลงทะเบียน ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมลของท่าน</p>'
      + '  </div>'
      + '  <form onsubmit="PORTAL_APP.submitForgotPassword(event)" class="space-y-4">'
      + '    <div>'
      + '      <label class="lbl">อีเมล (Email) *</label>'
      + '      <div class="relative">'
      + '        <i data-lucide="mail" class="w-4 h-4 absolute left-3 top-3.5 muted"></i>'
      + '        <input id="forgotEmailInput" type="email" class="inp pl-9" placeholder="user@bangkok.go.th" required autocomplete="email">'
      + '      </div>'
      + '    </div>'
      + '    <div class="flex gap-2">'
      + '      <button type="button" class="btn-ghost" onclick="PORTAL_APP.renderLoginForm()"><i data-lucide="arrow-left" class="w-4 h-4"></i> กลับ</button>'
      + '      <button type="submit" class="btn-primary flex-1 justify-center"><i data-lucide="send" class="w-4 h-4"></i> ส่งลิงก์ตั้งรหัสผ่าน</button>'
      + '    </div>'
      + '  </form>'
      + '</div>';
    icons();
  }

  async function submitForgotPassword(ev) {
    if (ev) ev.preventDefault();
    var email = document.getElementById('forgotEmailInput').value.trim();
    if (!email) return;

    try {
      var res = await global.PORTAL_API.requestPasswordReset(email);
      alertSuccess(res.message || 'ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมลของท่านเรียบร้อยแล้ว');
      renderLoginForm();
    } catch (err) {
      alertError(err.message);
    }
  }

  async function handleVerifyEmailHash(rawHash) {
    var m = rawHash.match(/token=([^&]+)/);
    var token = m ? decodeURIComponent(m[1]) : '';
    if (!token) return;
    try {
      var res = await global.PORTAL_API.verifyEmail(token);
      alertSuccess(res.message || 'ยืนยันอีเมลสำเร็จ ตอนนี้ท่านสามารถเข้าสู่ระบบได้ทันที');
      history.replaceState(null, '', window.location.pathname);
      renderLoginForm();
    } catch (err) {
      alertError(err.message);
    }
  }

  function renderResetPasswordForm(rawHash) {
    var m = rawHash.match(/token=([^&]+)/);
    var token = m ? decodeURIComponent(m[1]) : '';
    var box = document.getElementById('authPanelBody');
    if (!box) return;

    box.innerHTML = ''
      + '<div>'
      + '  <h2 class="text-xl font-bold mb-1">กำหนดรหัสผ่านใหม่</h2>'
      + '  <p class="text-xs muted mb-4">กรุณากำหนดรหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร</p>'
      + '  <form onsubmit="PORTAL_APP.submitResetPassword(event, \'' + esc(token) + '\')" class="space-y-4">'
      + '    <div><label class="lbl">รหัสผ่านใหม่ *</label><input id="newResetPw1" type="password" minlength="8" class="inp" required></div>'
      + '    <div><label class="lbl">ยืนยันรหัสผ่านใหม่ *</label><input id="newResetPw2" type="password" minlength="8" class="inp" required></div>'
      + '    <button type="submit" class="btn-primary w-full !py-2.5 justify-center"><i data-lucide="check" class="w-4 h-4"></i> บันทึกรหัสผ่านใหม่</button>'
      + '  </form>'
      + '</div>';
    icons();
  }

  async function submitResetPassword(ev, token) {
    if (ev) ev.preventDefault();
    var p1 = document.getElementById('newResetPw1').value;
    var p2 = document.getElementById('newResetPw2').value;
    if (p1 !== p2) {
      alertError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return;
    }
    try {
      var res = await global.PORTAL_API.resetPassword(token, p1);
      toast(res.message || 'เปลี่ยนรหัสผ่านสำเร็จ');
      history.replaceState(null, '', window.location.pathname);
      renderLoginForm();
    } catch (err) {
      alertError(err.message);
    }
  }

  // ===========================================================================
  // 8. Dashboard View (#dashboard) & SSO Launch
  // ===========================================================================
  var DASH_PERSONNEL_CACHE = [];

  async function renderDashboardPage() {
    var content = getContentEl();
    if (!content) return;

    content.innerHTML = '<div class="card p-10 text-center muted"><div class="spinner mx-auto mb-3"></div>กำลังโหลดข้อมูล Dashboard...</div>';

    var appsPromise = global.PORTAL_API.getDashboardApps(true).catch(function () { return { apps: [] }; });
    var psnPromise = global.PORTAL_API.listPersonnel(true).catch(function () { return []; });

    var results = await Promise.all([appsPromise, psnPromise]);
    STATE.dashboardApps = (results[0] && results[0].apps) || [];
    DASH_PERSONNEL_CACHE = Array.isArray(results[1]) ? results[1] : ((results[1] && results[1].personnel) || []);

    var apps = STATE.dashboardApps;
    var activeCount = apps.filter(function (a) { return a.status === 'เปิดใช้งาน'; }).length;
    var u = STATE.user || {};
    var role = STATE.isSetupMode ? 'SUPERADMIN (Setup)' : (u.Role || u.role || 'USER');
    var totalPsn = DASH_PERSONNEL_CACHE.length || 0;

    // 4 Stat Cards matching ref_122wc
    var statsHtml = ''
      + '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">'
      + statCard('เว็บแอปพลิเคชันทั้งหมด', apps.length, 'grid', 0, 'ระบบงาน')
      + statCard('ระบบที่เปิดให้บริการ', activeCount, 'check-circle-2', 1, 'พร้อมใช้งาน')
      + statCard('บุคลากรทั้งหมดในทำเนียบ', totalPsn, 'users', 2, 'คน')
      + statCard('ระดับสิทธิ์ผู้ใช้งาน', role, 'shield-check', 3, 'สิทธิ์ในระบบ')
      + '</div>';

    // SSO Subapp Launchpad Cards
    var cardsHtml = '';
    if (apps.length === 0) {
      cardsHtml = ''
        + '<div class="card p-10 text-center muted col-span-full">'
        + '  <i data-lucide="layers" class="w-10 h-10 mx-auto mb-3 opacity-60"></i>'
        + '  <h3 class="font-bold text-base mb-1">ยังไม่มีเว็บแอปพลิเคชันที่เปิดสิทธิ์ให้เข้าใช้งาน</h3>'
        + '  <p class="text-xs">ผู้ดูแลระบบสามารถเพิ่มเว็บแอปย่อยและกำหนดสิทธิ์ได้ที่เมนูจัดการเว็บแอปย่อย</p>'
        + '</div>';
    } else {
      apps.forEach(function (app) {
        var isMaint = app.status === 'ปิดปรับปรุง' || app.status === 'MAINTENANCE';
        var iconImg = resolveDriveImg(app.icon_url, '');
        var iconBoxHtml = iconImg
          ? '<img src="' + esc(iconImg) + '" alt="Icon" class="w-full h-full object-cover">'
          : '<i data-lucide="layers" class="w-6 h-6"></i>';

        cardsHtml += ''
          + '<div class="app-card' + (isMaint ? ' opacity-90' : '') + '" onclick="PORTAL_APP.launchSubApp(\'' + esc(app.webapp_id) + '\')">'
          + '  <div class="flex items-start justify-between gap-3">'
          + '    <div class="app-icon-box">' + iconBoxHtml + '</div>'
          + '    <div class="flex gap-1.5 flex-wrap justify-end">'
          + (isMaint
            ? '<span class="chip" style="background:rgba(255,179,0,0.15);color:var(--amber);"><i data-lucide="wrench" class="w-3 h-3"></i> ปิดปรับปรุง</span>'
            : '<span class="chip"><i data-lucide="zap" class="w-3 h-3"></i> พร้อมใช้งาน</span>')
          + '      <span class="badge soft">' + esc(app.access_level || 'USER') + '</span>'
          + '    </div>'
          + '  </div>'
          + '  <div class="mt-2">'
          + '    <h3 class="font-bold text-base text-slate-800 dark:text-slate-100">' + esc(app.name) + '</h3>'
          + '    <p class="text-xs muted mt-1 leading-relaxed">' + esc(app.description || 'คลิกเพื่อเข้าสู่ระบบอัตโนมัติผ่าน Single Sign-On (SSO)') + '</p>'
          + '  </div>'
          + '  <div class="mt-auto pt-3 border-t border-dashed border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs font-semibold accent">'
          + '    <span>รหัสระบบ: ' + esc(app.webapp_id) + '</span>'
          + '    <span class="inline-flex items-center gap-1">' + (isMaint ? 'ทดสอบระบบ' : 'เข้าใช้งาน') + ' <i data-lucide="external-link" class="w-3.5 h-3.5"></i></span>'
          + '  </div>'
          + '</div>';
      });
    }

    var adminPillsHtml = '';
    if (STATE.isSetupMode || role === 'SUPERADMIN' || role === 'ADMIN') {
      adminPillsHtml = ''
        + '<button type="button" class="btn-ghost !py-1 !text-xs" onclick="PORTAL_APP.navigate(\'webapps\')"><i data-lucide="grid" class="w-3.5 h-3.5"></i> จัดการเว็บแอป</button>'
        + '<button type="button" class="btn-ghost !py-1 !text-xs" onclick="PORTAL_APP.navigate(\'users\')"><i data-lucide="shield-check" class="w-3.5 h-3.5"></i> กำหนดสิทธิ์</button>';
    }

    var appSectionHtml = ''
      + '<div class="card p-5 mb-6">'
      + '  <div class="flex flex-wrap items-center justify-between gap-3 mb-4">'
      + '    <div class="flex items-center gap-2">'
      + '      <div class="w-9 h-9 rounded-xl chip flex items-center justify-center shrink-0"><i data-lucide="rocket" class="w-4 h-4"></i></div>'
      + '      <div><h2 class="font-bold text-base">ระบบงานย่อยที่เชื่อมต่อ Single Sign-On (SSO)</h2>'
      + '      <p class="text-[11px] muted">คลิกเพื่อเข้าสู่ระบบย่อยโดยไม่ต้องล็อกอินซ้ำ</p></div>'
      + '    </div>'
      + '    <div class="flex items-center gap-2 flex-wrap">'
      + adminPillsHtml
      + '      <button type="button" class="btn-ghost !py-1 !text-xs" onclick="PORTAL_APP.renderDashboardPage()"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> รีเฟรช</button>'
      + '    </div>'
      + '  </div>'
      + '  <div class="app-grid">' + cardsHtml + '</div>'
      + '</div>';

    // Chart.js Visualizations (Personnel by Position Type & Personnel by Department)
    var chartsHtml = ''
      + '<div class="grid md:grid-cols-2 gap-4">'
      + '  <div class="card p-5">'
      + '    <div class="flex items-center gap-2 mb-1"><i data-lucide="pie-chart" class="w-4 h-4 accent"></i><h3 class="font-bold text-sm">สัดส่วนบุคลากรแยกตามประเภทตำแหน่ง</h3></div>'
      + '    <p class="text-[11px] muted mb-3">จำแนกตามประเภทบุคลากรในทำเนียบ</p>'
      + '    <div class="relative h-64"><canvas id="chPosType"></canvas></div>'
      + '  </div>'
      + '  <div class="card p-5">'
      + '    <div class="flex items-center gap-2 mb-1"><i data-lucide="bar-chart-2" class="w-4 h-4 accent"></i><h3 class="font-bold text-sm">จำนวนบุคลากรแยกตามส่วน/ฝ่าย</h3></div>'
      + '    <p class="text-[11px] muted mb-3">จำแนกตามโครงสร้างส่วนราชการ</p>'
      + '    <div class="relative h-64"><canvas id="chDept"></canvas></div>'
      + '  </div>'
      + '</div>';

    content.innerHTML = statsHtml + appSectionHtml + chartsHtml;
    icons();
    renderDashboardCharts();
  }

  function renderDashboardCharts() {
    destroyCharts();
    if (typeof Chart === 'undefined') return;

    var psn = DASH_PERSONNEL_CACHE || [];
    var posTypeCounts = {};
    var deptCounts = {};

    psn.forEach(function (p) {
      var pt = p.position_type || 'ไม่ระบุ';
      posTypeCounts[pt] = (posTypeCounts[pt] || 0) + 1;
      var dp = p.department || p.office || 'สำนักเทศกิจ';
      deptCounts[dp] = (deptCounts[dp] || 0) + 1;
    });

    var ptLabels = Object.keys(posTypeCounts);
    var ptData = ptLabels.map(function (k) { return posTypeCounts[k]; });

    var dpLabels = Object.keys(deptCounts);
    var dpData = dpLabels.map(function (k) { return deptCounts[k]; });

    var grid = STATE.theme === 'dark' ? '#30363D' : '#eef4f0';
    var tick = STATE.theme === 'dark' ? '#8B949E' : '#64748b';

    var c1 = document.getElementById('chPosType');
    if (c1 && ptLabels.length > 0) {
      DASH_CHARTS.chPosType = new Chart(c1, {
        type: 'bar',
        data: {
          labels: ptLabels,
          datasets: [{
            label: 'จำนวนบุคลากร (คน)',
            data: ptData,
            backgroundColor: ptLabels.map(function (_, i) { return THEMEC()[i % THEMEC().length]; }),
            borderRadius: 8,
            maxBarThickness: 44
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0, color: tick }, grid: { color: grid } },
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: tick, autoSkip: false } }
          }
        }
      });
    }

    var c2 = document.getElementById('chDept');
    if (c2 && dpLabels.length > 0) {
      DASH_CHARTS.chDept = new Chart(c2, {
        type: 'bar',
        data: {
          labels: dpLabels,
          datasets: [{
            label: 'จำนวนบุคลากร (คน)',
            data: dpData,
            backgroundColor: dpLabels.map(function (_, i) { return THEMEC()[(i + 3) % THEMEC().length]; }),
            borderRadius: 8,
            maxBarThickness: 28
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { precision: 0, color: tick }, grid: { color: grid } },
            y: { grid: { display: false }, ticks: { font: { size: 11 }, color: tick } }
          }
        }
      });
    }
  }

  async function launchSubApp(webappId) {
    if (STATE.isSetupMode) {
      alertError('กรุณาเพิ่มข้อมูลบุคลากรและสร้างบัญชี SUPERADMIN คนแรกให้เสร็จสิ้นก่อนทดสอบเปิดเว็บแอปย่อยผ่าน SSO');
      return;
    }

    var appObj = (STATE.dashboardApps || []).find(function (a) { return a.webapp_id === webappId; });
    var u = STATE.user || {};
    var role = u.Role || u.role || 'USER';
    var isSuper = STATE.isSetupMode || role === 'SUPERADMIN';
    var isAppAdmin = appObj && appObj.access_level === 'ADMIN';

    if (appObj && (appObj.status === 'ปิดปรับปรุง' || appObj.status === 'MAINTENANCE')) {
      if (!isSuper && !isAppAdmin) {
        alertError('แอปพลิเคชัน "' + (appObj.name || webappId) + '" อยู่ระหว่างปิดปรับปรุงชั่วคราว\n(อนุญาตเฉพาะผู้ดูแลระบบของแอปเข้าทดสอบ)', 'ระบบปิดปรับปรุง');
        return;
      }
    }

    var popup = window.open('about:blank', '_blank');
    if (popup && popup.document) {
      popup.document.write('<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>กำลังเชื่อมต่อ SSO...</title></head><body style="font-family:sans-serif;background:#00351B;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;"><h2>กำลังออกบัตรผ่าน Single Sign-On (SSO)...</h2><p>โปรดรอสักครู่ ระบบกำลังส่งข้อมูลยืนยันตัวตนไปยังระบบงานย่อย</p></div></body></html>');
    }

    try {
      var res = await global.PORTAL_API.generateSsoToken(webappId);
      var targetUrl = resolveWebappTargetUrl(res.webapp && res.webapp.url ? res.webapp.url : '', res.sso_token);
      if (popup) {
        popup.location.href = targetUrl;
      } else {
        window.location.href = targetUrl;
      }
    } catch (err) {
      if (popup) popup.close();
      alertError(err.message || 'ไม่สามารถเปิดเว็บแอปพลิเคชันได้');
    }
  }

  // ===========================================================================
  // 9. Self-Service Profile (#profile) & HTML5 Canvas Signature Pad
  // ===========================================================================
  var sigPadCtx = null;
  var sigPadDrawing = false;
  var sigPadDirty = false;

  function formatMaskedIdCard(id) {
    var digits = String(id || '').replace(/\D/g, '');
    if (digits.length !== 13) return id || '-';
    return digits[0] + '-' + digits.slice(1, 5) + '-' + digits.slice(5, 10) + '-' + digits.slice(10, 12) + '-' + digits[12];
  }

  function renderProfilePage() {
    var content = getContentEl();
    if (!content) return;
    var u = STATE.user || {};

    var prefixes = getReferenceItems('PREFIX').map(function (x) { return x.value; });
    var bureaus = getReferenceItems('BUREAU').map(function (x) { return x.value; });
    if (bureaus.length === 0) bureaus = ['สำนักเทศกิจ'];
    var posTypes = getPositionTypes();

    var photoUrl = resolveDriveImg(
      u.Photo_URL || u.photoUrl,
      'https://pr-bangkok.com/wp-content/uploads/2025/06/231116_BMA-Emblem_Edited_Green-600x600.png'
    );
    var sigUrl = resolveDriveImg(u.Signature_URL || u.signatureUrl, '');
    var canChangeUsername = !u.username_changed && !u.Username_Changed;
    var usernameFieldHtml = canChangeUsername
      ? '<div><label class="lbl">ชื่อผู้ใช้งาน (Username) <span class="text-xs accent font-normal">(แก้ไขได้ครั้งเดียว)</span></label><input id="pf_username" class="inp" value="' + esc(u.Username || u.username || '') + '"></div>'
      : '<div><label class="lbl">ชื่อผู้ใช้งาน (Username) <span class="text-xs muted font-normal">(แก้ไขไปแล้ว)</span></label><input id="pf_username" class="inp" value="' + esc(u.Username || u.username || '') + '" disabled style="background:var(--surface2);"></div>';

    content.innerHTML = ''
      + sectionBar('ข้อมูลโปรไฟล์และลายเซ็นอิเล็กทรอนิกส์', '', 'id-card')
      + '<div class="grid lg:grid-cols-3 gap-6 items-start">'
      // ซ้าย: รูปโปรไฟล์ + ลายเซ็น
      + '  <div class="space-y-6">'
      + '    <div class="card p-6 text-center">'
      + '      <img id="pfAvatarPreview" src="' + esc(photoUrl) + '" alt="Profile" class="w-28 h-28 rounded-full object-cover mx-auto mb-3 border-4 border-[#007B3E] bg-white shadow-md">'
      + '      <h3 class="font-bold text-lg">' + esc(u.FullName || u.fullName) + '</h3>'
      + '      <p class="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 mt-1"><i data-lucide="credit-card" class="w-3.5 h-3.5 inline mr-1 opacity-70"></i>' + esc(formatMaskedIdCard(u.Id_Card || u.id_card_number || u.idCardNumber)) + '</p>'
      + '      <p class="text-xs muted mt-0.5">' + esc(u.Position || u.position) + ' ' + esc(u.Position_Level || u.positionLevel || '') + '</p>'
      + '      <span class="badge chip mt-2">' + esc(u.Role || u.role || 'USER') + '</span>'
      + '      <input type="file" id="pfPhotoFileInput" accept="image/*" class="hidden" onchange="PORTAL_APP.handleUploadProfilePhoto(event)">'
      + '      <div class="mt-4">'
      + '        <button type="button" class="btn-ghost !py-1.5 !text-xs w-full justify-center" onclick="document.getElementById(\'pfPhotoFileInput\').click()">'
      + '          <i data-lucide="camera" class="w-3.5 h-3.5"></i> เปลี่ยนรูปโปรไฟล์'
      + '        </button>'
      + '      </div>'
      + '    </div>'
      + '    <div class="card p-6">'
      + '      <h4 class="font-bold text-sm mb-2 flex items-center gap-2"><i data-lucide="feather" class="w-4 h-4 accent"></i> ลายเซ็นอิเล็กทรอนิกส์</h4>'
      + '      <div class="mb-3 p-3 rounded-xl soft text-center min-h-[85px] flex items-center justify-center">'
      + (sigUrl
        ? '<img id="pfCurrentSigImg" src="' + esc(sigUrl) + '" alt="Signature" class="max-h-16 max-w-full object-contain">'
        : '<span class="text-xs muted">ยังไม่มีลายเซ็นในระบบ</span>')
      + '      </div>'
      + '      <canvas id="pfSigCanvas" class="sig-pad-canvas" width="460" height="150"></canvas>'
      + '      <div class="flex gap-2 mt-3">'
      + '        <button type="button" class="btn-ghost !py-1 !text-xs" onclick="PORTAL_APP.clearSignaturePad()"><i data-lucide="eraser" class="w-3 h-3"></i> ล้าง</button>'
      + '        <button type="button" class="btn-primary !py-1 !text-xs flex-1 justify-center" onclick="PORTAL_APP.saveCanvasSignature()"><i data-lucide="save" class="w-3 h-3"></i> บันทึกลายเซ็น</button>'
      + '        <input type="file" id="pfSigFileInput" accept="image/*" class="hidden" onchange="PORTAL_APP.handleUploadSignatureFile(event)">'
      + '        <button type="button" class="btn-ghost !py-1 !text-xs" onclick="document.getElementById(\'pfSigFileInput\').click()"><i data-lucide="upload" class="w-3 h-3"></i> ไฟล์</button>'
      + '      </div>'
      + '    </div>'
      + '  </div>'
      // ขวา: ฟอร์มแก้ไขข้อมูล
      + '  <div class="lg:col-span-2">'
      + '    <div class="card p-6">'
      + '      <h4 class="font-bold text-base mb-4 flex items-center gap-2"><i data-lucide="user-pen" class="w-4 h-4 accent"></i> แก้ไขข้อมูลส่วนบุคคล</h4>'
      + '      <form onsubmit="PORTAL_APP.submitProfileUpdate(event)" class="space-y-4">'
      + '        <div class="grid grid-cols-2 gap-4">'
      + usernameFieldHtml
      + '          <div><label class="lbl">อีเมล (Email) *</label><input id="pf_email" type="email" class="inp" value="' + esc(u.Email || u.email) + '" required></div>'
      + '        </div>'
      + '        <div class="grid grid-cols-3 gap-3">'
      + '          <div><label class="lbl">คำนำหน้า *</label><select id="pf_prefix" class="inp" required>' + buildOptionsHtml(prefixes, u.Prefix || u.prefix) + '</select></div>'
      + '          <div><label class="lbl">ชื่อจริง *</label><input id="pf_first_name" class="inp" value="' + esc(u.FirstName || u.firstName) + '" required></div>'
      + '          <div><label class="lbl">นามสกุล *</label><input id="pf_last_name" class="inp" value="' + esc(u.LastName || u.lastName) + '" required></div>'
      + '        </div>'
      + '        <div class="grid grid-cols-3 gap-3">'
      + '          <div><label class="lbl">ประเภทตำแหน่ง</label><select id="pf_position_type" class="inp">' + buildOptionsHtml(posTypes, u.Position_Type || u.positionType) + '</select></div>'
      + '          <div><label class="lbl">สายงาน/ตำแหน่ง</label><select id="pf_position" class="inp"></select></div>'
      + '          <div><label class="lbl">ระดับตำแหน่ง</label><select id="pf_position_level" class="inp"></select></div>'
      + '        </div>'
      + '        <div class="grid grid-cols-3 gap-3">'
      + '          <div><label class="lbl">สำนัก</label><select id="pf_bureau_name" class="inp">' + buildOptionsHtml(bureaus, u.Bureau_Name || u.bureauName || 'สำนักเทศกิจ') + '</select></div>'
      + '          <div><label class="lbl">สำนักงาน/กอง</label><select id="pf_office" class="inp"></select></div>'
      + '          <div><label class="lbl">ฝ่าย/ส่วน</label><select id="pf_department" class="inp"></select></div>'
      + '        </div>'
      + '        <div class="grid grid-cols-2 gap-3">'
      + '          <div><label class="lbl">กลุ่มงาน</label><select id="pf_division" class="inp"></select></div>'
      + '          <div><label class="lbl">ตำแหน่งอื่น/รักษาการ (ถ้ามี)</label><input id="pf_position_2" class="inp" value="' + esc(u.Position_2 || u.position2 || '') + '"></div>'
      + '        </div>'
      + '        <div class="p-4 rounded-xl soft space-y-3">'
      + '          <h5 class="font-bold text-xs muted uppercase tracking-wider">เปลี่ยนรหัสผ่าน (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)</h5>'
      + '          <div class="grid grid-cols-2 gap-3">'
      + '            <div><label class="lbl">รหัสผ่านปัจจุบัน</label><input id="pf_current_pw" type="password" class="inp" placeholder="กรอกรหัสผ่านปัจจุบัน"></div>'
      + '            <div><label class="lbl">รหัสผ่านใหม่ (8 ตัวขึ้นไป)</label><input id="pf_new_pw" type="password" minlength="8" class="inp" placeholder="กรอกรหัสผ่านใหม่"></div>'
      + '          </div>'
      + '        </div>'
      + '        <div class="flex justify-end pt-2">'
      + '          <button type="submit" class="btn-primary !px-6"><i data-lucide="save" class="w-4 h-4"></i> บันทึกข้อมูลโปรไฟล์</button>'
      + '        </div>'
      + '      </form>'
      + '    </div>'
      + '  </div>'
      + '</div>';

    bindOrgAndPositionCascade('pf', {
      position: u.Position || u.position,
      position_level: u.Position_Level || u.positionLevel,
      office: u.Office || u.office,
      department: u.Department || u.department,
      division: u.Division || u.division
    });

    initSignaturePad();
    icons();
  }

  function initSignaturePad() {
    var canvas = document.getElementById('pfSigCanvas');
    if (!canvas) return;
    sigPadCtx = canvas.getContext('2d');
    sigPadCtx.strokeStyle = '#000000';
    sigPadCtx.lineWidth = 2.5;
    sigPadCtx.lineCap = 'round';
    sigPadCtx.lineJoin = 'round';
    sigPadDirty = false;

    function getCoords(ev) {
      var rect = canvas.getBoundingClientRect();
      var clientX = ev.clientX !== undefined ? ev.clientX : (ev.touches && ev.touches[0].clientX);
      var clientY = ev.clientY !== undefined ? ev.clientY : (ev.touches && ev.touches[0].clientY);
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
      };
    }

    function start(ev) {
      ev.preventDefault();
      sigPadDrawing = true;
      sigPadDirty = true;
      var pos = getCoords(ev);
      sigPadCtx.beginPath();
      sigPadCtx.moveTo(pos.x, pos.y);
    }

    function move(ev) {
      if (!sigPadDrawing) return;
      ev.preventDefault();
      var pos = getCoords(ev);
      sigPadCtx.lineTo(pos.x, pos.y);
      sigPadCtx.stroke();
    }

    function end() {
      sigPadDrawing = false;
    }

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);
  }

  function clearSignaturePad() {
    var canvas = document.getElementById('pfSigCanvas');
    if (!canvas || !sigPadCtx) return;
    sigPadCtx.clearRect(0, 0, canvas.width, canvas.height);
    sigPadDirty = false;
  }

  async function saveCanvasSignature() {
    var canvas = document.getElementById('pfSigCanvas');
    if (!canvas || !sigPadDirty) {
      alertError('กรุณาเซ็นชื่อลงในช่องก่อนบันทึก');
      return;
    }
    try {
      var dataUrl = canvas.toDataURL('image/png');
      var folderId = STATE.settings.Signature_Folder_ID || '';
      var pid = (STATE.user && (STATE.user.Personnel_ID || STATE.user.personnelId)) || 'USER';

      var upRes = await global.LOADER.busy(
        global.STB_DRIVE.uploadToDrive(dataUrl, {
          folderId: folderId,
          fileName: 'SIG_' + pid + '_' + Date.now() + '.png',
          mimeType: 'image/png',
          compressImage: false
        }),
        'กำลังอัปโหลดลายเซ็นไปยัง Google Drive...'
      );

      var sigUrl = upRes.lh3Url || upRes.fileUrl;
      var saveRes = await global.PORTAL_API.updateMyProfile({ signature_url: sigUrl });
      STATE.user = saveRes.user;
      toast('บันทึกลายเซ็นอิเล็กทรอนิกส์เรียบร้อยแล้ว');
      renderProfilePage();
    } catch (err) {
      alertError(err.message);
    }
  }

  async function handleUploadProfilePhoto(ev) {
    var file = ev.target && ev.target.files && ev.target.files[0];
    if (!file) return;
    try {
      var folderId = STATE.settings.Profile_Folder_ID || '';
      var pid = (STATE.user && (STATE.user.Personnel_ID || STATE.user.personnelId)) || 'USER';
      var upRes = await global.LOADER.busy(
        global.STB_DRIVE.uploadToDrive(file, {
          folderId: folderId,
          fileName: 'PROFILE_' + pid + '_' + Date.now() + '.jpg',
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.85
        }),
        'กำลังบีบอัดและอัปโหลดรูปโปรไฟล์ลง Google Drive...'
      );
      var photoUrl = upRes.lh3Url || upRes.fileUrl;
      var saveRes = await global.PORTAL_API.updateMyProfile({ photo_url: photoUrl });
      STATE.user = saveRes.user;
      renderHeaderUser();
      renderProfilePage();
      toast('อัปเดตรูปโปรไฟล์สำเร็จ');
    } catch (err) {
      alertError(err.message);
    }
  }

  async function handleUploadSignatureFile(ev) {
    var file = ev.target && ev.target.files && ev.target.files[0];
    if (!file) return;
    try {
      var folderId = STATE.settings.Signature_Folder_ID || '';
      var pid = (STATE.user && (STATE.user.Personnel_ID || STATE.user.personnelId)) || 'USER';
      var upRes = await global.LOADER.busy(
        global.STB_DRIVE.uploadToDrive(file, {
          folderId: folderId,
          fileName: 'SIG_' + pid + '_' + Date.now() + '.png',
          maxWidth: 900,
          maxHeight: 450,
          outputType: 'image/png'
        }),
        'กำลังอัปโหลดไฟล์ลายเซ็นลง Google Drive...'
      );
      var sigUrl = upRes.lh3Url || upRes.fileUrl;
      var saveRes = await global.PORTAL_API.updateMyProfile({ signature_url: sigUrl });
      STATE.user = saveRes.user;
      renderProfilePage();
      toast('อัปเดตไฟล์ลายเซ็นสำเร็จ');
    } catch (err) {
      alertError(err.message);
    }
  }

  async function submitProfileUpdate(ev) {
    if (ev) ev.preventDefault();
    var payload = {
      email: document.getElementById('pf_email').value.trim(),
      prefix: document.getElementById('pf_prefix').value,
      first_name: document.getElementById('pf_first_name').value.trim(),
      last_name: document.getElementById('pf_last_name').value.trim(),
      position_type: document.getElementById('pf_position_type').value,
      position: document.getElementById('pf_position').value,
      position_level: document.getElementById('pf_position_level').value,
      position_2: (document.getElementById('pf_position_2') && document.getElementById('pf_position_2').value.trim()) || '',
      bureau_name: document.getElementById('pf_bureau_name').value,
      office: document.getElementById('pf_office').value,
      department: document.getElementById('pf_department').value,
      division: (document.getElementById('pf_division') && document.getElementById('pf_division').value) || '',
      current_password: (document.getElementById('pf_current_pw') && document.getElementById('pf_current_pw').value) || '',
      new_password: (document.getElementById('pf_new_pw') && document.getElementById('pf_new_pw').value) || ''
    };

    var uEl = document.getElementById('pf_username');
    if (uEl && !uEl.disabled) {
      var newUname = uEl.value.trim().toLowerCase();
      var oldUname = String((STATE.user && (STATE.user.Username || STATE.user.username)) || '').trim().toLowerCase();
      if (newUname && newUname !== oldUname) {
        payload.username = newUname;
      }
    }

    try {
      var res = await global.PORTAL_API.updateMyProfile(payload);
      STATE.user = res.user;
      renderHeaderUser();
      renderProfilePage();
      toast(res.message || 'บันทึกข้อมูลส่วนตัวสำเร็จ');
    } catch (err) {
      alertError(err.message);
    }
  }

  // ===========================================================================
  // 10. Public Interface & Module Registry
  // ===========================================================================
  function registerAdminRoute(routeName, handlerFn) {
    ADMIN_ROUTES[routeName] = handlerFn;
  }

  var PORTAL_APP = {
    STATE: STATE,
    esc: esc,
    icons: icons,
    THEMEC: THEMEC,
    GRADC: GRADC,
    statCard: statCard,
    sectionBar: sectionBar,
    th: th,
    TW: TW,
    resolveDriveImg: resolveDriveImg,
    bootSystem: bootSystem,
    navigate: navigate,
    getContentEl: getContentEl,
    setPageHeader: setPageHeader,
    toggleTheme: toggleTheme,
    applyTheme: applyTheme,
    toggleSidebar: toggleSidebar,
    togglePasswordVisibility: togglePasswordVisibility,
    applyBranding: applyBranding,
    renderHeaderUser: renderHeaderUser,
    renderSidebarNav: renderSidebarNav,
    openModal: openModal,
    closeModal: closeModal,
    toast: toast,
    alertError: alertError,
    alertSuccess: alertSuccess,
    confirmAction: confirmAction,
    openConnectionConfigModal: openConnectionConfigModal,
    saveConnectionConfig: saveConnectionConfig,
    getReferenceItems: getReferenceItems,
    getPositionTypes: getPositionTypes,
    getPositionsByType: getPositionsByType,
    getLevelsByPosition: getLevelsByPosition,
    buildOptionsHtml: buildOptionsHtml,
    bindOrgAndPositionCascade: bindOrgAndPositionCascade,
    renderLoginForm: renderLoginForm,
    submitLogin: submitLogin,
    handleLogout: handleLogout,
    startRegisterWizard: startRegisterWizard,
    backRegStep: backRegStep,
    submitRegStep1: submitRegStep1,
    submitRegStep2: submitRegStep2,
    submitRegStep3: submitRegStep3,
    renderForgotPasswordForm: renderForgotPasswordForm,
    submitForgotPassword: submitForgotPassword,
    submitResetPassword: submitResetPassword,
    renderDashboardPage: renderDashboardPage,
    launchSubApp: launchSubApp,
    renderProfilePage: renderProfilePage,
    clearSignaturePad: clearSignaturePad,
    saveCanvasSignature: saveCanvasSignature,
    handleUploadProfilePhoto: handleUploadProfilePhoto,
    handleUploadSignatureFile: handleUploadSignatureFile,
    submitProfileUpdate: submitProfileUpdate,
    registerAdminRoute: registerAdminRoute
  };

  global.PORTAL_APP = PORTAL_APP;

  document.addEventListener('DOMContentLoaded', function () {
    bootSystem();
  });
})(window);
