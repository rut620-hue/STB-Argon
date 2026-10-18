/**
 * =============================================================================
 * STB APP n2 — Central Portal Core Application (assets/js/portal-app.js)
 * =============================================================================
 * ควบคุมระบบหลักของ Central Portal & SSO (Phase 1C):
 * - Boot & First-Time Setup Bypass Mode (เข้าใช้งานได้ทันทีเมื่อยังไม่มี SUPERADMIN)
 * - ระบบสลับธีม Light/Dark Mode และแสดงโลโก้ตาม System_Settings
 * - หน้าเข้าสู่ระบบ (Login), สมัครสมาชิก 3 ขั้นตอน (3-Step Wizard), ยืนยันอีเมล, ลืมรหัสผ่าน
 * - หน้า Dashboard (#dashboard) พร้อมปุ่มเข้าเว็บแอปย่อยผ่าน SSO Handshake Token
 * - หน้าแก้ไขข้อมูลส่วนตัว (#profile) พร้อมอัปโหลดรูปโปรไฟล์ และกระดานวาดลายเซ็น HTML5 Canvas
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

  // Registry สำหรับให้ portal-admin.js (Phase 1D) ลงทะเบียน Route ผู้ดูแลระบบ
  var ADMIN_ROUTES = {};

  function esc(val) {
    if (val === null || val === undefined) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function resolveDriveImg(url, fallback) {
    if (!url) return fallback || '';
    if (global.STB_DRIVE && typeof global.STB_DRIVE.resolveDriveImageUrl === 'function') {
      return global.STB_DRIVE.resolveDriveImageUrl(url) || fallback || '';
    }
    return url;
  }

  function getPortalBaseUrl() {
    var loc = window.location;
    return loc.origin + loc.pathname.replace(/\/index\.html$/i, '').replace(/\/$/, '') + '/index.html';
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

  // ===========================================================================
  // 1. Theme & Branding Helpers
  // ===========================================================================
  function applyTheme(mode, saveLocal) {
    var m = (String(mode || '').toLowerCase() === 'dark') ? 'dark' : 'light';
    STATE.theme = m;
    if (m === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    if (saveLocal !== false) {
      try { localStorage.setItem('stb_portal_theme_v1', m); } catch (e) {}
    }
    var btn = document.getElementById('themeBtn');
    if (btn) {
      btn.innerHTML = m === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    }
  }

  function toggleTheme() {
    applyTheme(STATE.theme === 'dark' ? 'light' : 'dark', true);
  }

  function applyBranding() {
    var s = STATE.settings || {};
    var appName = s.App_Name || 'ระบบ Central Portal & SSO (สตบ.สนท.)';
    var orgName = s.Organization_Name || 'ส่วนตรวจและบังคับการ สำนักเทศกิจ';
    var logoUrl = resolveDriveImg(
      s.Portal_Logo_URL || s.Custom_Logo_URL || s.Default_Logo_URL,
      'https://pr-bangkok.com/wp-content/uploads/2025/06/231116_BMA-Emblem_Edited_Green-600x600.png'
    );

    document.title = appName;
    if (global.LOADER && typeof global.LOADER.setLogo === 'function') {
      global.LOADER.setLogo(logoUrl);
    }

    var elLoginLogo = document.getElementById('loginLogoImg');
    if (elLoginLogo) elLoginLogo.src = logoUrl;
    var elLoginOrg = document.getElementById('loginBrandOrg');
    if (elLoginOrg) elLoginOrg.textContent = orgName;
    var elLoginTitle = document.getElementById('loginBrandTitle');
    if (elLoginTitle) elLoginTitle.textContent = appName;

    var elSbLogo = document.getElementById('sbLogoImg');
    if (elSbLogo) elSbLogo.src = logoUrl;
    var elSbName = document.getElementById('sbAppName');
    if (elSbName) elSbName.textContent = appName;
  }

  // ===========================================================================
  // 2. Universal Modal & Toast Helpers
  // ===========================================================================
  function openModal(title, bodyHtml, footerHtml, maxWidth) {
    var modal = document.getElementById('appModal');
    var box = document.getElementById('appModalBox');
    var tEl = document.getElementById('appModalTitle');
    var bEl = document.getElementById('appModalBody');
    var fEl = document.getElementById('appModalFooter');
    if (!modal || !bEl) return;

    if (box) box.style.maxWidth = maxWidth || '760px';
    if (tEl) tEl.innerHTML = title || 'หน้าต่างจัดการข้อมูล';
    bEl.innerHTML = bodyHtml || '';
    if (fEl) {
      fEl.innerHTML = footerHtml || '';
      fEl.style.display = footerHtml ? 'flex' : 'none';
    }
    modal.classList.add('show');
  }

  function closeModal() {
    var modal = document.getElementById('appModal');
    if (modal) modal.classList.remove('show');
  }

  function toast(title, icon) {
    if (global.Swal) {
      global.Swal.fire({
        toast: true,
        position: 'top-end',
        icon: icon || 'success',
        title: title,
        showConfirmButton: false,
        timer: 2600,
        timerProgressBar: true
      });
    } else {
      alert(title);
    }
  }

  function alertError(message, title) {
    if (global.Swal) {
      return global.Swal.fire({
        icon: 'error',
        title: title || 'เกิดข้อผิดพลาด',
        text: message || 'ไม่สามารถดำเนินการได้',
        confirmButtonColor: '#007B3E'
      });
    }
    alert((title ? title + ': ' : '') + message);
  }

  // ===========================================================================
  // 3. Connection Config Modal (ตั้งค่า Supabase Anon Key & GAS URL)
  // ===========================================================================
  function openConnectionConfigModal(autoRetryBoot) {
    var cfg = global.STB_CONFIG || {};
    var curKey = cfg.SUPABASE_ANON_KEY || '';
    var curGas = cfg.GAS_BRIDGE_URL || '';

    var body = ''
      + '<div style="margin-bottom:1rem;padding:0.85rem 1rem;background:var(--primary-50);border-radius:12px;border:1px solid var(--border-color);font-size:0.9rem;">'
      + '  <div style="font-weight:700;color:var(--brand-700);margin-bottom:0.25rem;"><i class="fa-solid fa-database"></i> ตั้งค่าการเชื่อมต่อฐานข้อมูล Supabase (Schema: <code>portal</code>)</div>'
      + '  <div style="color:var(--text-muted);font-size:0.84rem;">คัดลอกค่า <b>anon public key</b> จากหน้า Supabase Dashboard ➜ <b>Project Settings ➜ API</b> มาวางด้านล่าง (บันทึกไว้ในเบราว์เซอร์อัตโนมัติ)</div>'
      + '</div>'
      + '<div class="form-group" style="margin-bottom:0.9rem;">'
      + '  <label class="form-label">Supabase Project URL</label>'
      + '  <input type="text" class="form-control" value="' + esc(cfg.SUPABASE_URL || '') + '" readonly>'
      + '</div>'
      + '<div class="form-group" style="margin-bottom:0.9rem;">'
      + '  <label class="form-label">Supabase Anon Public Key <span style="color:var(--danger);">*</span></label>'
      + '  <textarea id="cfgAnonKeyInput" class="form-control" rows="3" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...">' + esc(curKey) + '</textarea>'
      + '</div>'
      + '<div class="form-group">'
      + '  <label class="form-label">Google Apps Script Bridge URL (อัปโหลดไฟล์ Google Drive & ส่งอีเมล)</label>'
      + '  <input id="cfgGasUrlInput" type="text" class="form-control" value="' + esc(curGas) + '">'
      + '</div>';

    var footer = ''
      + '<button type="button" class="btn btn-outline" onclick="PORTAL_APP.closeModal()">ยกเลิก</button>'
      + '<button type="button" class="btn btn-primary" onclick="PORTAL_APP.saveConnectionConfig(' + (autoRetryBoot ? 'true' : 'false') + ')">'
      + '  <i class="fa-solid fa-floppy-disk"></i> บันทึกและเชื่อมต่อ'
      + '</button>';

    openModal('<i class="fa-solid fa-plug"></i> ตั้งค่าการเชื่อมต่อระบบ (Supabase & GAS Bridge)', body, footer, '620px');
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
  // 4. Dropdown Reference & Position Cascade Helpers (ใช้ร่วมกันทั้ง Auth, Profile, Admin)
  // ===========================================================================
  function getReferenceItems(type, parentValue) {
    var list = (STATE.referenceData || []).filter(function (item) {
      if (item.is_active === false) return false;
      if (item.type !== type) return false;
      if (parentValue !== undefined && parentValue !== null && parentValue !== '') {
        return !item.parent_value || item.parent_value === parentValue;
      }
      return true;
    });
    list.sort(function (a, b) { return (a.sort_order || 999) - (b.sort_order || 999); });
    return list;
  }

  function getPositionTypes() {
    var seen = {};
    var result = [];
    var order = ['ผู้บริหาร', 'ประเภททั่วไป', 'ประเภทวิชาการ', 'ลูกจ้างประจำ', 'ลูกจ้างชั่วคราว', 'จ้างเหมาบริการฯ'];
    order.forEach(function (t) {
      seen[t] = true;
      result.push(t);
    });
    (STATE.positionStructure || []).forEach(function (p) {
      if (p.is_active !== false && p.position_type && !seen[p.position_type]) {
        seen[p.position_type] = true;
        result.push(p.position_type);
      }
    });
    return result;
  }

  function getPositionsByType(posType) {
    var seen = {};
    var out = [];
    var rows = (STATE.positionStructure || []).filter(function (p) {
      return p.is_active !== false && (!posType || p.position_type === posType);
    });
    rows.sort(function (a, b) { return (a.sort_order || 999) - (b.sort_order || 999); });
    rows.forEach(function (r) {
      if (r.position_name && !seen[r.position_name]) {
        seen[r.position_name] = true;
        out.push(r.position_name);
      }
    });
    return out;
  }

  function getLevelsByPosition(posType, posName) {
    var seen = {};
    var out = [];
    var rows = (STATE.positionStructure || []).filter(function (p) {
      if (p.is_active === false) return false;
      if (posType && p.position_type !== posType) return false;
      if (posName && p.position_name !== posName) return false;
      return !!p.position_level;
    });
    rows.sort(function (a, b) { return (a.sort_order || 999) - (b.sort_order || 999); });
    rows.forEach(function (r) {
      if (r.position_level && !seen[r.position_level]) {
        seen[r.position_level] = true;
        out.push(r.position_level);
      }
    });
    return out;
  }

  function buildOptionsHtml(items, selectedVal, placeholder, valueProp, labelProp) {
    var html = '<option value="">' + esc(placeholder || '-- เลือก --') + '</option>';
    (items || []).forEach(function (it) {
      var val = typeof it === 'object' ? it[valueProp || 'value'] : it;
      var lbl = typeof it === 'object' ? it[labelProp || 'value'] : it;
      var sel = String(val || '') === String(selectedVal || '') ? ' selected' : '';
      html += '<option value="' + esc(val) + '"' + sel + '>' + esc(lbl) + '</option>';
    });
    return html;
  }

  /**
   * ผูก Event Cascading สำหรับฟอร์มข้อมูลบุคลากร (ทั้งในหน้า Register, Profile และ Admin Modal)
   */
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
      var bVal = elBureau ? elBureau.value : 'สำนักเทศกิจ';
      var curOff = keepSelected ? (elOffice.value || initialValues.office || '') : '';
      var items = getReferenceItems('OFFICE', bVal).map(function (x) { return x.value; });
      if (curOff && items.indexOf(curOff) === -1) items.unshift(curOff);
      elOffice.innerHTML = buildOptionsHtml(items, curOff, '-- เลือกสำนักงาน/กอง --');
      refreshDept(keepSelected);
    }

    function refreshDept(keepSelected) {
      if (!elDept) return;
      var oVal = elOffice ? elOffice.value : '';
      var curDept = keepSelected ? (elDept.value || initialValues.department || '') : '';
      var items = getReferenceItems('DEPARTMENT', oVal).map(function (x) { return x.value; });
      if (curDept && items.indexOf(curDept) === -1) items.unshift(curDept);
      elDept.innerHTML = buildOptionsHtml(items, curDept, '-- เลือกฝ่าย/ส่วน --');
      refreshDiv(keepSelected);
    }

    function refreshDiv(keepSelected) {
      if (!elDiv) return;
      var dVal = elDept ? elDept.value : '';
      var curDiv = keepSelected ? (elDiv.value || initialValues.division || '') : '';
      var items = getReferenceItems('DIVISION', dVal).map(function (x) { return x.value; });
      if (curDiv && items.indexOf(curDiv) === -1) items.unshift(curDiv);
      elDiv.innerHTML = buildOptionsHtml(items, curDiv, '-- เลือกกลุ่มงาน (ถ้ามี) --');
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
  // 5. System Boot & First-Time Setup Bypass Logic
  // ===========================================================================
  async function bootSystem() {
    if (global.LOADER) {
      global.LOADER.brandBoot({
        title: 'ระบบ Central Portal & SSO (สตบ.สนท.)',
        sub: 'ส่วนตรวจและบังคับการ สำนักเทศกิจ กรุงเทพมหานคร',
        msg: 'กำลังเชื่อมต่อฐานข้อมูลและตรวจสอบสถานะระบบ...'
      });
    }

    applyTheme(STATE.theme, false);

    // ตรวจสอบว่าตั้งค่า Supabase Anon Key แล้วหรือยัง
    if (!global.STB_CONFIG || !global.STB_CONFIG.SUPABASE_ANON_KEY) {
      if (global.LOADER) global.LOADER.hideBoot();
      showLoginShell();
      renderMissingKeyNotice();
      openConnectionConfigModal(true);
      return;
    }

    try {
      var initRes = await global.PORTAL_API.checkSystemInit(true);
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

      if (global.LOADER) global.LOADER.hideBoot();

      // ตรวจสอบ Hash พิเศษสำหรับยืนยันอีเมล (#verify-email?token=...) หรือตั้งรหัสผ่านใหม่ (#reset-password?token=...)
      var rawHash = String(window.location.hash || '').replace(/^#/, '');
      if (rawHash.indexOf('verify-email') === 0) {
        showLoginShell();
        await handleVerifyEmailHash(rawHash);
        return;
      }
      if (rawHash.indexOf('reset-password') === 0) {
        showLoginShell();
        renderResetPasswordForm(rawHash);
        return;
      }

      // กรณีที่ 1: โหมดตั้งค่าครั้งแรก (First-Time Setup Bypass Mode — ยังไม่มี SUPERADMIN ในฐานข้อมูล)
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
        await navigate(defaultSetupRoute);
        return;
      }

      // กรณีที่ 2: มี Session ผู้ใช้งานที่ยังไม่หมดอายุ
      if (STATE.user && (STATE.user.Personnel_ID || STATE.user.personnelId)) {
        global.PORTAL_API.setCachedUser(STATE.user);
        showAppShell();
        var startRoute = rawHash && rawHash !== 'login' ? rawHash.split('?')[0] : 'dashboard';
        await navigate(startRoute);
        return;
      }

      // กรณีที่ 3: มี SUPERADMIN ในระบบแล้ว แต่ยังไม่ได้เข้าสู่ระบบ -> แสดงหน้า Login
      global.PORTAL_API.setSessionToken('');
      global.PORTAL_API.setCachedUser(null);
      showLoginShell();
      renderLoginForm();
    } catch (err) {
      if (global.LOADER) global.LOADER.hideBoot();
      showLoginShell();
      renderBootErrorPanel(err);
    }
  }

  function showLoginShell() {
    var lv = document.getElementById('loginView');
    var av = document.getElementById('appView');
    if (lv) lv.style.display = 'flex';
    if (av) av.style.display = 'none';
  }

  function showAppShell() {
    var lv = document.getElementById('loginView');
    var av = document.getElementById('appView');
    var sb = document.getElementById('setupBanner');
    if (lv) lv.style.display = 'none';
    if (av) av.style.display = 'flex';
    if (sb) sb.style.display = (STATE.isSetupMode || !STATE.hasSuperadmin) ? 'flex' : 'none';
    renderHeaderUser();
    renderSidebarNav();
  }

  function renderHeaderUser() {
    var u = STATE.user || {};
    var logoFallback = resolveDriveImg(
      STATE.settings.Portal_Logo_URL || STATE.settings.Default_Logo_URL,
      'https://pr-bangkok.com/wp-content/uploads/2025/06/231116_BMA-Emblem_Edited_Green-600x600.png'
    );
    var avatarUrl = resolveDriveImg(u.Photo_URL || u.photoUrl, logoFallback);

    var elAvatar = document.getElementById('hdrUserAvatar');
    if (elAvatar) elAvatar.src = avatarUrl;
    var elName = document.getElementById('hdrUserName');
    if (elName) elName.textContent = u.FullName || u.fullName || u.Username || 'ผู้ใช้งาน';
    var elPos = document.getElementById('hdrUserPos');
    if (elPos) elPos.textContent = u.Position || u.position || u.Role || '';

    var elRole = document.getElementById('sbRoleBadge');
    if (elRole) {
      var r = u.Role || u.role || 'USER';
      elRole.textContent = STATE.isSetupMode ? 'SETUP MODE (SUPERADMIN)' : r;
    }
  }

  function renderSidebarNav() {
    var nav = document.getElementById('sbNav');
    if (!nav) return;

    var role = (STATE.user && (STATE.user.Role || STATE.user.role)) || 'USER';
    var isAdmin = STATE.isSetupMode || role === 'ADMIN' || role === 'SUPERADMIN';
    var isSuper = STATE.isSetupMode || role === 'SUPERADMIN';

    var html = ''
      + '<div class="sb-section">เมนูผู้ใช้งานทั่วไป</div>'
      + '<button type="button" class="sb-link" data-route="dashboard" onclick="PORTAL_APP.navigate(\'dashboard\')">'
      + '  <i class="fa-solid fa-table-cells-large"></i> <span>หน้าหลัก (Dashboard)</span>'
      + '</button>';

    if (!STATE.isSetupMode) {
      html += ''
        + '<button type="button" class="sb-link" data-route="profile" onclick="PORTAL_APP.navigate(\'profile\')">'
        + '  <i class="fa-solid fa-id-card-clip"></i> <span>ข้อมูลส่วนตัว & ลายเซ็น</span>'
        + '</button>';
    }

    if (isAdmin) {
      html += ''
        + '<div class="sb-section">เมนูผู้ดูแลระบบ (Admin)</div>'
        + '<button type="button" class="sb-link" data-route="personnel" onclick="PORTAL_APP.navigate(\'personnel\')">'
        + '  <i class="fa-solid fa-users-rectangle"></i> <span>ทำเนียบบุคลากร</span>'
        + '</button>'
        + '<button type="button" class="sb-link" data-route="users" onclick="PORTAL_APP.navigate(\'users\')">'
        + '  <i class="fa-solid fa-user-shield"></i> <span>จัดการบัญชีและสิทธิ์</span>'
        + '</button>';
    }

    if (isSuper) {
      html += ''
        + '<div class="sb-section">ตั้งค่าโครงสร้าง (Superadmin)</div>'
        + '<button type="button" class="sb-link" data-route="webapps" onclick="PORTAL_APP.navigate(\'webapps\')">'
        + '  <i class="fa-solid fa-cubes"></i> <span>จัดการเว็บแอปย่อย (SSO)</span>'
        + '</button>'
        + '<button type="button" class="sb-link" data-route="reference" onclick="PORTAL_APP.navigate(\'reference\')">'
        + '  <i class="fa-solid fa-sitemap"></i> <span>โครงสร้างสังกัด & คำนำหน้า</span>'
        + '</button>'
        + '<button type="button" class="sb-link" data-route="positions" onclick="PORTAL_APP.navigate(\'positions\')">'
        + '  <i class="fa-solid fa-layer-group"></i> <span>โครงสร้างสายงาน/ตำแหน่ง</span>'
        + '</button>'
        + '<button type="button" class="sb-link" data-route="settings" onclick="PORTAL_APP.navigate(\'settings\')">'
        + '  <i class="fa-solid fa-sliders"></i> <span>ตั้งค่าระบบ (System Settings)</span>'
        + '</button>';
    }

    nav.innerHTML = html;
    highlightSidebar(STATE.currentRoute);
  }

  function highlightSidebar(route) {
    var links = document.querySelectorAll('#sbNav .sb-link');
    for (var i = 0; i < links.length; i++) {
      var r = links[i].getAttribute('data-route');
      if (r === route) {
        links[i].classList.add('active');
      } else {
        links[i].classList.remove('active');
      }
    }
  }

  function setPageHeader(title, subtitle) {
    var t = document.getElementById('hdrPageTitle');
    var s = document.getElementById('hdrPageSub');
    if (t) t.textContent = title || '';
    if (s) s.textContent = subtitle || '';
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
    if (sb) sb.classList.remove('open');
    highlightSidebar(cleanRoute);

    if (cleanRoute === 'dashboard') {
      setPageHeader('หน้าหลัก (Dashboard)', 'ศูนย์รวมเว็บแอปพลิเคชันและบริการออนไลน์ผ่านระบบ Single Sign-On');
      await renderDashboardPage();
      return;
    }

    if (cleanRoute === 'profile') {
      if (STATE.isSetupMode) {
        toast('ในโหมดตั้งค่าครั้งแรก กรุณาเพิ่มข้อมูลบุคลากรและผูกบัญชี SUPERADMIN ก่อน', 'info');
        await navigate('personnel');
        return;
      }
      setPageHeader('ข้อมูลส่วนตัว & ลายเซ็นอิเล็กทรอนิกส์', 'จัดการข้อมูลบุคลากร รูปโปรไฟล์ ลายเซ็น และรหัสผ่านของคุณ');
      renderProfilePage();
      return;
    }

    // ตรวจสอบว่าเป็น Route ของ Admin/Superadmin ที่ลงทะเบียนไว้ใน ADMIN_ROUTES หรือไม่
    if (ADMIN_ROUTES[cleanRoute]) {
      await ADMIN_ROUTES[cleanRoute]();
      return;
    }

    var pageBody = document.getElementById('pageBody');
    if (pageBody) {
      pageBody.innerHTML = ''
        + '<div class="card">'
        + '  <div class="card-header"><div class="card-title"><i class="fa-solid fa-screwdriver-wrench"></i> กำลังเตรียมโมดูล (' + esc(cleanRoute) + ')</div></div>'
        + '  <p style="color:var(--text-muted);margin:0;">โมดูลนี้กำลังโหลดจาก <code>portal-admin.js</code></p>'
        + '</div>';
    }
  }

  // ===========================================================================
  // 6. Auth Views (Login, 3-Step Registration, Verify Email, Forgot Password)
  // ===========================================================================
  function renderMissingKeyNotice() {
    var box = document.getElementById('authPanelBody');
    if (!box) return;
    box.innerHTML = ''
      + '<div style="text-align:center;padding:1.5rem 0.5rem;">'
      + '  <div style="width:68px;height:68px;border-radius:18px;background:var(--primary-50);color:var(--primary);display:inline-flex;align-items:center;justify-content:center;font-size:2rem;margin-bottom:1rem;">'
      + '    <i class="fa-solid fa-key"></i>'
      + '  </div>'
      + '  <h2 style="margin:0 0 0.5rem;font-weight:800;">ตั้งค่าการเชื่อมต่อฐานข้อมูลครั้งแรก</h2>'
      + '  <p style="color:var(--text-muted);font-size:0.92rem;margin-bottom:1.5rem;">กรุณาระบุ <b>Supabase Anon Public Key</b> ของโปรเจกต์ <code>ycyefnsfamlhnwgizavs</code> เพื่อเริ่มใช้งานระบบ Central Portal & SSO</p>'
      + '  <button type="button" class="btn btn-primary btn-lg" onclick="PORTAL_APP.openConnectionConfigModal(true)">'
      + '    <i class="fa-solid fa-plug"></i> ตั้งค่า Supabase Anon Key'
      + '  </button>'
      + '</div>';
  }

  function renderBootErrorPanel(err) {
    var box = document.getElementById('authPanelBody');
    if (!box) return;
    box.innerHTML = ''
      + '<div style="text-align:center;padding:1.5rem 0.5rem;">'
      + '  <div style="width:68px;height:68px;border-radius:18px;background:var(--danger-bg);color:var(--danger);display:inline-flex;align-items:center;justify-content:center;font-size:2rem;margin-bottom:1rem;">'
      + '    <i class="fa-solid fa-triangle-exclamation"></i>'
      + '  </div>'
      + '  <h2 style="margin:0 0 0.5rem;font-weight:800;">ไม่สามารถเชื่อมต่อฐานข้อมูลได้</h2>'
      + '  <p style="color:var(--danger);font-size:0.9rem;margin-bottom:1.5rem;">' + esc(err && err.message ? err.message : 'Unknown Error') + '</p>'
      + '  <div style="display:flex;gap:0.65rem;justify-content:center;">'
      + '    <button type="button" class="btn btn-outline" onclick="PORTAL_APP.openConnectionConfigModal(true)"><i class="fa-solid fa-plug"></i> ตรวจสอบ API Key</button>'
      + '    <button type="button" class="btn btn-primary" onclick="PORTAL_APP.bootSystem()"><i class="fa-solid fa-rotate"></i> ลองใหม่อีกครั้ง</button>'
      + '  </div>'
      + '</div>';
  }

  function renderLoginForm() {
    var box = document.getElementById('authPanelBody');
    if (!box) return;
    var allowReg = String(STATE.settings.Allow_Registration || 'TRUE').toUpperCase() === 'TRUE';

    box.innerHTML = ''
      + '<div>'
      + '  <div style="margin-bottom:1.5rem;">'
      + '    <span class="chip chip-green" style="margin-bottom:0.5rem;"><i class="fa-solid fa-lock"></i> Single Sign-On Portal</span>'
      + '    <h2 style="margin:0;font-size:1.55rem;font-weight:800;color:var(--text-main);">เข้าสู่ระบบผู้ใช้งาน</h2>'
      + '    <p style="margin:0.25rem 0 0;color:var(--text-muted);font-size:0.9rem;">เข้าสู่ระบบด้วยชื่อผู้ใช้งาน (Username) หรืออีเมลของคุณ</p>'
      + '  </div>'
      + '  <form id="loginForm" onsubmit="PORTAL_APP.submitLogin(event)">'
      + '    <div class="form-group" style="margin-bottom:1rem;">'
      + '      <label class="form-label">ชื่อผู้ใช้งาน (Username) หรือ อีเมล</label>'
      + '      <input id="loginUsername" type="text" class="form-control" placeholder="ระบุ Username หรือ Email" required autocomplete="username">'
      + '    </div>'
      + '    <div class="form-group" style="margin-bottom:0.75rem;">'
      + '      <label class="form-label">รหัสผ่าน (Password)</label>'
      + '      <input id="loginPassword" type="password" class="form-control" placeholder="ระบุรหัสผ่าน" required autocomplete="current-password">'
      + '    </div>'
      + '    <div style="display:flex;justify-content:flex-end;margin-bottom:1.25rem;">'
      + '      <a href="javascript:void(0)" onclick="PORTAL_APP.renderForgotPasswordForm()" style="font-size:0.86rem;color:var(--primary);font-weight:600;text-decoration:none;">'
      + '        <i class="fa-solid fa-key"></i> ลืมรหัสผ่าน?'
      + '      </a>'
      + '    </div>'
      + '    <button type="submit" class="btn btn-primary btn-lg" style="width:100%;justify-content:center;">'
      + '      <i class="fa-solid fa-right-to-bracket"></i> เข้าสู่ระบบ'
      + '    </button>'
      + '  </form>'
      + (allowReg
        ? '<div style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border-color);text-align:center;font-size:0.9rem;color:var(--text-muted);">'
          + 'ยังไม่มีบัญชีผู้ใช้งานใช่หรือไม่? '
          + '<a href="javascript:void(0)" onclick="PORTAL_APP.startRegisterWizard()" style="color:var(--primary);font-weight:700;text-decoration:none;">ลงทะเบียนผู้ใช้งานใหม่</a>'
          + '</div>'
        : '')
      + '</div>';
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
    await global.PORTAL_API.logout();
    STATE.user = null;
    await bootSystem();
  }

  // ---------------------------------------------------------------------------
  // 3-Step Registration Wizard (ตามพิมพ์เขียว 04_Frontend_Behavior.md)
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
      + '<div style="display:flex;gap:0.5rem;margin-bottom:1.35rem;">'
      + '  <span class="chip ' + (w.step === 1 ? 'chip-green' : 'chip-slate') + '">1. ตรวจเลขบัตร 13 หลัก</span>'
      + '  <span class="chip ' + (w.step === 2 ? 'chip-green' : 'chip-slate') + '">2. ข้อมูลบุคลากร</span>'
      + '  <span class="chip ' + (w.step === 3 ? 'chip-green' : 'chip-slate') + '">3. ตั้งค่าบัญชี</span>'
      + '</div>';

    if (w.step === 1) {
      box.innerHTML = ''
        + '<div>'
        + stepPills
        + '<h2 style="margin:0 0 0.35rem;font-size:1.4rem;font-weight:800;">ขั้นตอนที่ 1: ตรวจสอบเลขบัตรประชาชน</h2>'
        + '<p style="margin:0 0 1.25rem;color:var(--text-muted);font-size:0.88rem;">ระบบจะตรวจสอบความถูกต้องตามสูตร Modulo-11 และค้นหาข้อมูลของท่านในทำเนียบบุคลากร</p>'
        + '<form onsubmit="PORTAL_APP.submitRegStep1(event)">'
        + '  <div class="form-group" style="margin-bottom:1.25rem;">'
        + '    <label class="form-label">เลขประจำตัวประชาชน (13 หลัก) <span style="color:var(--danger);">*</span></label>'
        + '    <input id="regIdCardInput" type="text" maxlength="13" class="form-control" placeholder="ระบุตัวเลข 13 หลักไม่ต้องเว้นวรรค" value="' + esc(w.idCard) + '" required>'
        + '  </div>'
        + '  <div style="display:flex;gap:0.65rem;">'
        + '    <button type="button" class="btn btn-outline" onclick="PORTAL_APP.renderLoginForm()"><i class="fa-solid fa-arrow-left"></i> กลับหน้าล็อกอิน</button>'
        + '    <button type="submit" class="btn btn-primary" style="flex:1;justify-content:center;">ตรวจสอบข้อมูล <i class="fa-solid fa-arrow-right"></i></button>'
        + '  </div>'
        + '</form>'
        + '</div>';
      return;
    }

    if (w.step === 2) {
      var prefixes = getReferenceItems('PREFIX').map(function (x) { return x.value; });
      var bureaus = getReferenceItems('BUREAU').map(function (x) { return x.value; });
      if (bureaus.length === 0) bureaus = ['สำนักเทศกิจ'];
      var posTypes = getPositionTypes();
      var fd = w.formData || {};

      box.innerHTML = ''
        + '<div>'
        + stepPills
        + '<h2 style="margin:0 0 0.35rem;font-size:1.35rem;font-weight:800;">ขั้นตอนที่ 2: ข้อมูลบุคลากร</h2>'
        + '<p style="margin:0 0 1rem;color:var(--text-muted);font-size:0.86rem;">ไม่พบข้อมูลเดิมในทำเนียบ กรุณากรอกข้อมูลพื้นฐานเพื่อสร้างทะเบียนประวัติบุคลากร</p>'
        + '<form onsubmit="PORTAL_APP.submitRegStep2(event)">'
        + '  <div class="form-grid" style="margin-bottom:0.85rem;">'
        + '    <div class="form-group">'
        + '      <label class="form-label">คำนำหน้าชื่อ *</label>'
        + '      <select id="reg_prefix" class="form-select" required>' + buildOptionsHtml(prefixes, fd.prefix, '-- เลือกคำนำหน้า --') + '</select>'
        + '    </div>'
        + '    <div class="form-group">'
        + '      <label class="form-label">ชื่อจริง *</label>'
        + '      <input id="reg_first_name" type="text" class="form-control" value="' + esc(fd.first_name || '') + '" required>'
        + '    </div>'
        + '    <div class="form-group">'
        + '      <label class="form-label">นามสกุล *</label>'
        + '      <input id="reg_last_name" type="text" class="form-control" value="' + esc(fd.last_name || '') + '" required>'
        + '    </div>'
        + '    <div class="form-group">'
        + '      <label class="form-label">ประเภทตำแหน่ง *</label>'
        + '      <select id="reg_position_type" class="form-select" required>' + buildOptionsHtml(posTypes, fd.position_type || 'ประเภททั่วไป', '-- เลือกประเภทตำแหน่ง --') + '</select>'
        + '    </div>'
        + '    <div class="form-group">'
        + '      <label class="form-label">ตำแหน่งสายงาน *</label>'
        + '      <select id="reg_position" class="form-select" required></select>'
        + '    </div>'
        + '    <div class="form-group">'
        + '      <label class="form-label">ระดับตำแหน่ง</label>'
        + '      <select id="reg_position_level" class="form-select"></select>'
        + '    </div>'
        + '    <div class="form-group">'
        + '      <label class="form-label">สำนัก/หน่วยงานหลัก *</label>'
        + '      <select id="reg_bureau_name" class="form-select" required>' + buildOptionsHtml(bureaus, fd.bureau_name || 'สำนักเทศกิจ', '-- เลือกสำนัก --') + '</select>'
        + '    </div>'
        + '    <div class="form-group">'
        + '      <label class="form-label">สำนักงาน/กอง *</label>'
        + '      <select id="reg_office" class="form-select" required></select>'
        + '    </div>'
        + '    <div class="form-group">'
        + '      <label class="form-label">ฝ่าย/ส่วน *</label>'
        + '      <select id="reg_department" class="form-select" required></select>'
        + '    </div>'
        + '    <div class="form-group">'
        + '      <label class="form-label">กลุ่มงาน</label>'
        + '      <select id="reg_division" class="form-select"></select>'
        + '    </div>'
        + '  </div>'
        + '  <div style="display:flex;gap:0.65rem;margin-top:1rem;">'
        + '    <button type="button" class="btn btn-outline" onclick="PORTAL_APP.backRegStep(1)"><i class="fa-solid fa-arrow-left"></i> ย้อนกลับ</button>'
        + '    <button type="submit" class="btn btn-primary" style="flex:1;justify-content:center;">ถัดไป: ตั้งค่าบัญชี <i class="fa-solid fa-arrow-right"></i></button>'
        + '  </div>'
        + '</form>'
        + '</div>';

      bindOrgAndPositionCascade('reg', {
        position_type: fd.position_type || 'ประเภททั่วไป',
        position: fd.position || '',
        position_level: fd.position_level || '',
        bureau_name: fd.bureau_name || 'สำนักเทศกิจ',
        office: fd.office || '',
        department: fd.department || '',
        division: fd.division || ''
      });
      return;
    }

    if (w.step === 3) {
      var infoBanner = '';
      if (w.isExistingPersonnel && w.existingPersonnel) {
        var ep = w.existingPersonnel;
        infoBanner = ''
          + '<div style="padding:0.85rem 1rem;background:var(--primary-50);border:1px solid var(--border-color);border-radius:12px;margin-bottom:1rem;font-size:0.88rem;">'
          + '  <div style="font-weight:700;color:var(--brand-700);"><i class="fa-solid fa-circle-check"></i> พบข้อมูลในทำเนียบบุคลากรแล้ว (' + esc(ep.personnel_id) + ')</div>'
          + '  <div>ชื่อ-สกุล: <b>' + esc(ep.full_name) + '</b> | ตำแหน่ง: ' + esc(ep.position || '-') + '</div>'
          + '</div>';
      }

      box.innerHTML = ''
        + '<div>'
        + stepPills
        + '<h2 style="margin:0 0 0.35rem;font-size:1.35rem;font-weight:800;">ขั้นตอนที่ 3: กำหนดชื่อผู้ใช้งานและรหัสผ่าน</h2>'
        + infoBanner
        + '<form onsubmit="PORTAL_APP.submitRegStep3(event)">'
        + '  <div class="form-group" style="margin-bottom:0.85rem;">'
        + '    <label class="form-label">ชื่อผู้ใช้งาน (Username) *</label>'
        + '    <input id="reg_username" type="text" class="form-control" placeholder="ภาษาอังกฤษหรือตัวเลข อย่างน้อย 4 ตัวอักษร" required>'
        + '  </div>'
        + '  <div class="form-group" style="margin-bottom:0.85rem;">'
        + '    <label class="form-label">อีเมลสำหรับยืนยันตัวตน (Email) *</label>'
        + '    <input id="reg_email" type="email" class="form-control" placeholder="name@bangkok.go.th หรืออีเมลที่ใช้งานจริง" required>'
        + '  </div>'
        + '  <div class="form-grid" style="margin-bottom:1.15rem;">'
        + '    <div class="form-group">'
        + '      <label class="form-label">รหัสผ่าน (อย่างน้อย 8 ตัวอักษร) *</label>'
        + '      <input id="reg_password" type="password" minlength="8" class="form-control" required>'
        + '    </div>'
        + '    <div class="form-group">'
        + '      <label class="form-label">ยืนยันรหัสผ่านอีกครั้ง *</label>'
        + '      <input id="reg_password_confirm" type="password" minlength="8" class="form-control" required>'
        + '    </div>'
        + '  </div>'
        + '  <div style="display:flex;gap:0.65rem;">'
        + '    <button type="button" class="btn btn-outline" onclick="PORTAL_APP.backRegStep(' + (w.isExistingPersonnel ? 1 : 2) + ')"><i class="fa-solid fa-arrow-left"></i> ย้อนกลับ</button>'
        + '    <button type="submit" class="btn btn-primary" style="flex:1;justify-content:center;"><i class="fa-solid fa-user-check"></i> ยืนยันการลงทะเบียน</button>'
        + '  </div>'
        + '</form>'
        + '</div>';
    }
  }

  function backRegStep(targetStep) {
    STATE.regWizard.step = targetStep;
    renderRegisterWizard();
  }

  async function submitRegStep1(ev) {
    if (ev) ev.preventDefault();
    var el = document.getElementById('regIdCardInput');
    var idCard = el ? el.value.replace(/\D/g, '') : '';
    if (idCard.length !== 13) {
      alertError('กรุณากรอกเลขประจำตัวประชาชนให้ครบ 13 หลัก');
      return;
    }

    try {
      var res = await global.PORTAL_API.checkIdCardForRegister(idCard);
      STATE.regWizard.idCard = idCard;
      if (res.mode === 'EXISTING_PERSONNEL') {
        STATE.regWizard.isExistingPersonnel = true;
        STATE.regWizard.existingPersonnel = res.personnel;
        STATE.regWizard.step = 3; // ข้ามไปตั้งค่าบัญชีทันทีตามพิมพ์เขียว!
      } else {
        STATE.regWizard.isExistingPersonnel = false;
        STATE.regWizard.existingPersonnel = null;
        STATE.regWizard.step = 2;
      }
      renderRegisterWizard();
    } catch (err) {
      alertError(err.message);
    }
  }

  function submitRegStep2(ev) {
    if (ev) ev.preventDefault();
    STATE.regWizard.formData = {
      prefix: document.getElementById('reg_prefix').value,
      first_name: document.getElementById('reg_first_name').value.trim(),
      last_name: document.getElementById('reg_last_name').value.trim(),
      position_type: document.getElementById('reg_position_type').value,
      position: document.getElementById('reg_position').value,
      position_level: document.getElementById('reg_position_level').value,
      bureau_name: document.getElementById('reg_bureau_name').value,
      office: document.getElementById('reg_office').value,
      department: document.getElementById('reg_department').value,
      division: document.getElementById('reg_division').value
    };
    STATE.regWizard.step = 3;
    renderRegisterWizard();
  }

  async function submitRegStep3(ev) {
    if (ev) ev.preventDefault();
    var username = document.getElementById('reg_username').value.trim();
    var email = document.getElementById('reg_email').value.trim();
    var pw1 = document.getElementById('reg_password').value;
    var pw2 = document.getElementById('reg_password_confirm').value;

    if (pw1 !== pw2) {
      alertError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    var w = STATE.regWizard;
    var payload = Object.assign({}, w.formData || {}, {
      id_card_number: w.idCard,
      username: username,
      email: email,
      password: pw1
    });

    try {
      var res = await global.PORTAL_API.registerUser(payload);
      var verifyUrl = getPortalBaseUrl() + '#verify-email?token=' + encodeURIComponent(res.verify_token);

      // ส่งอีเมลยืนยันตัวตนผ่าน GAS Bridge
      try {
        if (global.STB_DRIVE && typeof global.STB_DRIVE.sendPortalEmail === 'function') {
          await global.STB_DRIVE.sendPortalEmail({
            to: res.email,
            subject: 'ยืนยันการลงทะเบียนเข้าใช้งาน ' + (STATE.settings.App_Name || 'Central Portal & SSO'),
            recipientName: res.full_name,
            title: 'ยืนยันที่อยู่อีเมลของคุณ',
            bodyHtml: 'ขอบคุณที่ได้ลงทะเบียนเข้าใช้งานระบบ กรุณาคลิกปุ่มด้านล่างเพื่อยืนยันอีเมลและเปิดใช้งานบัญชีของคุณ (ลิงก์มีอายุ 24 ชั่วโมง)',
            ctaText: 'ยืนยันที่อยู่อีเมล',
            ctaUrl: verifyUrl
          });
        }
      } catch (mailErr) {}

      if (global.Swal) {
        await global.Swal.fire({
          icon: 'success',
          title: 'ลงทะเบียนสำเร็จ!',
          html: 'ระบบได้ส่งลิงก์ยืนยันตัวตนไปยังอีเมล <b>' + esc(res.email) + '</b> แล้ว<br><br>'
            + '<div style="font-size:0.82rem;background:var(--primary-50);padding:0.65rem;border-radius:8px;">'
            + 'กรณีทดสอบระบบ สามารถคลิกยืนยันได้ทันทีที่นี่:<br>'
            + '<a href="' + esc(verifyUrl) + '" style="color:var(--primary);font-weight:700;">คลิกเพื่อยืนยันอีเมลทันที</a>'
            + '</div>',
          confirmButtonColor: '#007B3E'
        });
      }
      renderLoginForm();
    } catch (err) {
      alertError(err.message);
    }
  }

  async function handleVerifyEmailHash(rawHash) {
    var m = rawHash.match(/token=([^&]+)/);
    var token = m ? decodeURIComponent(m[1]) : '';
    if (!token) {
      renderLoginForm();
      return;
    }
    try {
      var res = await global.PORTAL_API.verifyEmail(token);
      if (global.Swal) {
        await global.Swal.fire({
          icon: 'success',
          title: 'ยืนยันอีเมลสำเร็จ',
          text: res.message || 'บัญชีของคุณพร้อมใช้งานแล้ว กรุณาเข้าสู่ระบบ',
          confirmButtonColor: '#007B3E'
        });
      }
    } catch (err) {
      alertError(err.message);
    }
    history.replaceState(null, '', window.location.pathname);
    renderLoginForm();
  }

  function renderForgotPasswordForm() {
    var box = document.getElementById('authPanelBody');
    if (!box) return;
    box.innerHTML = ''
      + '<div>'
      + '  <h2 style="margin:0 0 0.35rem;font-size:1.45rem;font-weight:800;">ลืมรหัสผ่าน (Forgot Password)</h2>'
      + '  <p style="margin:0 0 1.25rem;color:var(--text-muted);font-size:0.9rem;">ระบุอีเมลที่ผูกกับบัญชีผู้ใช้งาน ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ (อายุ 1 ชั่วโมง) ไปให้ท่าน</p>'
      + '  <form onsubmit="PORTAL_APP.submitForgotPassword(event)">'
      + '    <div class="form-group" style="margin-bottom:1.25rem;">'
      + '      <label class="form-label">อีเมลที่ลงทะเบียนไว้ *</label>'
      + '      <input id="forgotEmailInput" type="email" class="form-control" placeholder="name@bangkok.go.th" required>'
      + '    </div>'
      + '    <div style="display:flex;gap:0.65rem;">'
      + '      <button type="button" class="btn btn-outline" onclick="PORTAL_APP.renderLoginForm()"><i class="fa-solid fa-arrow-left"></i> กลับหน้าล็อกอิน</button>'
      + '      <button type="submit" class="btn btn-primary" style="flex:1;justify-content:center;"><i class="fa-solid fa-paper-plane"></i> ส่งลิงก์ตั้งรหัสผ่านใหม่</button>'
      + '    </div>'
      + '  </form>'
      + '</div>';
  }

  async function submitForgotPassword(ev) {
    if (ev) ev.preventDefault();
    var email = document.getElementById('forgotEmailInput').value.trim();
    if (!email) return;

    try {
      var res = await global.PORTAL_API.requestPasswordReset(email);
      var resetUrl = getPortalBaseUrl() + '#reset-password?token=' + encodeURIComponent(res.reset_token);

      try {
        if (global.STB_DRIVE && typeof global.STB_DRIVE.sendPortalEmail === 'function') {
          await global.STB_DRIVE.sendPortalEmail({
            to: res.email,
            subject: 'ลิงก์ตั้งรหัสผ่านใหม่ — ' + (STATE.settings.App_Name || 'Central Portal & SSO'),
            recipientName: res.full_name,
            title: 'คำขอตั้งรหัสผ่านใหม่',
            bodyHtml: 'ระบบได้รับคำขอตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ กรุณาคลิกปุ่มด้านล่างเพื่อกำหนดรหัสผ่านใหม่ (ลิงก์มีอายุ 1 ชั่วโมง)',
            ctaText: 'ตั้งรหัสผ่านใหม่',
            ctaUrl: resetUrl
          });
        }
      } catch (mailErr) {}

      if (global.Swal) {
        await global.Swal.fire({
          icon: 'success',
          title: 'สร้างลิงก์ตั้งรหัสผ่านใหม่สำเร็จ',
          html: 'ส่งลิงก์ไปยังอีเมล <b>' + esc(res.email) + '</b> เรียบร้อยแล้ว<br><br>'
            + '<div style="font-size:0.82rem;background:var(--primary-50);padding:0.65rem;border-radius:8px;">'
            + 'กรณีทดสอบระบบ คลิกตั้งรหัสผ่านใหม่ได้ทันที:<br>'
            + '<a href="' + esc(resetUrl) + '" onclick="Swal.close()" style="color:var(--primary);font-weight:700;">เปิดหน้าตั้งรหัสผ่านใหม่</a>'
            + '</div>',
          confirmButtonColor: '#007B3E'
        });
      }
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
      + '  <h2 style="margin:0 0 0.35rem;font-size:1.45rem;font-weight:800;">กำหนดรหัสผ่านใหม่</h2>'
      + '  <p style="margin:0 0 1.25rem;color:var(--text-muted);font-size:0.9rem;">กรุณากำหนดรหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร</p>'
      + '  <form onsubmit="PORTAL_APP.submitResetPassword(event, \'' + esc(token) + '\')">'
      + '    <div class="form-group" style="margin-bottom:0.9rem;">'
      + '      <label class="form-label">รหัสผ่านใหม่ *</label>'
      + '      <input id="newResetPw1" type="password" minlength="8" class="form-control" required>'
      + '    </div>'
      + '    <div class="form-group" style="margin-bottom:1.25rem;">'
      + '      <label class="form-label">ยืนยันรหัสผ่านใหม่ *</label>'
      + '      <input id="newResetPw2" type="password" minlength="8" class="form-control" required>'
      + '    </div>'
      + '    <button type="submit" class="btn btn-primary btn-lg" style="width:100%;justify-content:center;">'
      + '      <i class="fa-solid fa-check"></i> บันทึกรหัสผ่านใหม่'
      + '    </button>'
      + '  </form>'
      + '</div>';
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
  // 7. Dashboard View (#dashboard) & SSO Launch
  // ===========================================================================
  async function renderDashboardPage() {
    var pageBody = document.getElementById('pageBody');
    if (!pageBody) return;

    if (global.LOADER) global.LOADER.showPage(pageBody, 'กำลังโหลดรายการเว็บแอปพลิเคชัน...');
    try {
      var res = await global.PORTAL_API.getDashboardApps(true);
      STATE.dashboardApps = (res && res.apps) || [];
    } catch (err) {
      if (err.isSessionExpired) {
        await handleLogout();
        return;
      }
      STATE.dashboardApps = [];
    }

    var u = STATE.user || {};
    var apps = STATE.dashboardApps;
    var activeCount = apps.filter(function (a) { return a.status === 'เปิดใช้งาน'; }).length;

    var cardsHtml = '';
    if (apps.length === 0) {
      cardsHtml = ''
        + '<div class="card" style="grid-column:1/-1;text-align:center;padding:2.5rem 1rem;">'
        + '  <i class="fa-solid fa-cubes" style="font-size:2.6rem;color:var(--primary);opacity:0.6;margin-bottom:0.75rem;"></i>'
        + '  <h3 style="margin:0 0 0.35rem;">ยังไม่มีเว็บแอปพลิเคชันที่เปิดสิทธิ์ให้เข้าใช้งาน</h3>'
        + '  <p style="margin:0;color:var(--text-muted);font-size:0.9rem;">ผู้ดูแลระบบสามารถเพิ่มเว็บแอปย่อยและกำหนดสิทธิ์ได้ที่เมนูจัดการเว็บแอปย่อย</p>'
        + '</div>';
    } else {
      apps.forEach(function (app) {
        var isMaint = app.status !== 'เปิดใช้งาน';
        var iconImg = resolveDriveImg(app.icon_url, '');
        var iconBoxHtml = iconImg
          ? '<img src="' + esc(iconImg) + '" alt="Icon">'
          : '<i class="fa-solid fa-layer-group"></i>';

        cardsHtml += ''
          + '<div class="app-card" onclick="PORTAL_APP.launchSubApp(\'' + esc(app.webapp_id) + '\')">'
          + '  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.75rem;">'
          + '    <div class="app-icon-box">' + iconBoxHtml + '</div>'
          + '    <div style="display:flex;gap:0.35rem;flex-wrap:wrap;justify-content:flex-end;">'
          + (isMaint
            ? '<span class="chip chip-amber"><i class="fa-solid fa-screwdriver-wrench"></i> ปิดปรับปรุง</span>'
            : '<span class="chip chip-green"><i class="fa-solid fa-bolt"></i> พร้อมใช้งาน</span>')
          + '      <span class="chip chip-slate">' + esc(app.access_level || 'USER') + '</span>'
          + '    </div>'
          + '  </div>'
          + '  <div>'
          + '    <h3 style="margin:0 0 0.35rem;font-size:1.08rem;font-weight:800;color:var(--text-main);">' + esc(app.name) + '</h3>'
          + '    <p style="margin:0;font-size:0.86rem;color:var(--text-muted);line-height:1.5;">' + esc(app.description || 'คลิกเพื่อเข้าสู่ระบบอัตโนมัติผ่าน Single Sign-On (SSO)') + '</p>'
          + '  </div>'
          + '  <div style="margin-top:auto;padding-top:0.75rem;border-top:1px dashed var(--border-color);display:flex;justify-content:space-between;align-items:center;font-size:0.82rem;color:var(--primary);font-weight:700;">'
          + '    <span>รหัสระบบ: ' + esc(app.webapp_id) + '</span>'
          + '    <span>เข้าสู่ระบบย่อย <i class="fa-solid fa-arrow-up-right-from-square"></i></span>'
          + '  </div>'
          + '</div>';
      });
    }

    pageBody.innerHTML = ''
      + '<div class="stats-grid">'
      + '  <div class="stat-card">'
      + '    <div class="stat-icon"><i class="fa-solid fa-cubes"></i></div>'
      + '    <div><div class="stat-val">' + apps.length + '</div><div class="stat-lbl">ระบบงานที่ได้รับสิทธิ์</div></div>'
      + '  </div>'
      + '  <div class="stat-card">'
      + '    <div class="stat-icon"><i class="fa-solid fa-circle-check"></i></div>'
      + '    <div><div class="stat-val">' + activeCount + '</div><div class="stat-lbl">ระบบที่เปิดให้บริการ</div></div>'
      + '  </div>'
      + '  <div class="stat-card">'
      + '    <div class="stat-icon"><i class="fa-solid fa-user-shield"></i></div>'
      + '    <div><div class="stat-val" style="font-size:1.15rem;">' + esc(u.Role || u.role || 'USER') + '</div><div class="stat-lbl">ระดับสิทธิ์ส่วนกลาง</div></div>'
      + '  </div>'
      + '  <div class="stat-card">'
      + '    <div class="stat-icon"><i class="fa-solid fa-building-shield"></i></div>'
      + '    <div><div class="stat-val" style="font-size:1rem;">' + esc(u.Department || u.department || u.Office || 'สำนักเทศกิจ') + '</div><div class="stat-lbl">สังกัดปัจจุบัน</div></div>'
      + '  </div>'
      + '</div>'
      + '<div class="card">'
      + '  <div class="card-header">'
      + '    <div class="card-title"><i class="fa-solid fa-rocket" style="color:var(--primary);"></i> ระบบงานย่อยที่เชื่อมต่อ Single Sign-On (SSO)</div>'
      + '    <button type="button" class="btn btn-sm btn-outline" onclick="PORTAL_APP.renderDashboardPage()"><i class="fa-solid fa-rotate"></i> รีเฟรช</button>'
      + '  </div>'
      + '  <div class="app-grid">' + cardsHtml + '</div>'
      + '</div>';
  }

  /**
   * เปิดเว็บแอปย่อยพร้อมส่งบัตรผ่าน SSO_HANDSHAKE (เปิดหน้าต่างรอทันทีเพื่อกัน Popup Blocker ตามพิมพ์เขียว)
   */
  async function launchSubApp(webappId) {
    if (STATE.isSetupMode) {
      alertError('กรุณาเพิ่มข้อมูลบุคลากรและสร้างบัญชี SUPERADMIN คนแรกให้เสร็จสิ้นก่อนทดสอบเปิดเว็บแอปย่อยผ่าน SSO');
      return;
    }

    var popup = window.open('about:blank', '_blank');
    if (popup && popup.document) {
      popup.document.write('<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>กำลังเชื่อมต่อ SSO...</title></head><body style="font-family:sans-serif;background:#002612;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;"><h2>กำลังออกบัตรผ่าน Single Sign-On (SSO)...</h2><p>โปรดรอสักครู่ ระบบกำลังส่งข้อมูลยืนยันตัวตนไปยังระบบงานย่อย</p></div></body></html>');
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
  // 8. Self-Service Profile (#profile) + HTML5 Canvas Signature Pad
  // ===========================================================================
  var sigPadCtx = null;
  var sigPadDrawing = false;
  var sigPadDirty = false;

  function renderProfilePage() {
    var pageBody = document.getElementById('pageBody');
    if (!pageBody) return;
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
    var usernameChanged = !!(u.Username_Changed || u.usernameChanged);

    pageBody.innerHTML = ''
      + '<div class="form-grid" style="grid-template-columns:repeat(auto-fit, minmax(360px, 1fr));align-items:start;">'
      // คอลัมน์ซ้าย: รูปโปรไฟล์ + ลายเซ็นอิเล็กทรอนิกส์ + บัญชี
      + '  <div style="display:flex;flex-direction:column;gap:1.25rem;">'
      + '    <div class="card" style="text-align:center;">'
      + '      <img id="pfAvatarPreview" src="' + esc(photoUrl) + '" alt="Profile" style="width:116px;height:116px;border-radius:50%;object-fit:cover;border:4px solid var(--primary);margin-bottom:0.75rem;background:#fff;">'
      + '      <h3 style="margin:0;font-size:1.2rem;font-weight:800;">' + esc(u.FullName || u.fullName) + '</h3>'
      + '      <p style="margin:0.2rem 0 0.85rem;color:var(--text-muted);font-size:0.88rem;">' + esc(u.Position || u.position) + ' ' + esc(u.Position_Level || u.positionLevel || '') + '</p>'
      + '      <input type="file" id="pfPhotoFileInput" accept="image/*" style="display:none;" onchange="PORTAL_APP.handleUploadProfilePhoto(event)">'
      + '      <button type="button" class="btn btn-sm btn-outline" onclick="document.getElementById(\'pfPhotoFileInput\').click()">'
      + '        <i class="fa-solid fa-camera"></i> อัปโหลดรูปโปรไฟล์ใหม่ (Google Drive)'
      + '      </button>'
      + '    </div>'

      // การ์ดลายเซ็นอิเล็กทรอนิกส์ (วาดบน Canvas หรืออัปโหลดไฟล์)
      + '    <div class="card">'
      + '      <div class="card-header">'
      + '        <div class="card-title"><i class="fa-solid fa-signature" style="color:var(--primary);"></i> ลายเซ็นอิเล็กทรอนิกส์ (Signature)</div>'
      + '      </div>'
      + (sigUrl
        ? '<div style="margin-bottom:0.85rem;text-align:center;padding:0.65rem;background:var(--bg-body);border-radius:10px;border:1px solid var(--border-color);">'
          + '  <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:0.35rem;">ลายเซ็นปัจจุบันของคุณ:</div>'
          + '  <img id="pfCurrentSigImg" src="' + esc(sigUrl) + '" alt="Signature" style="max-height:75px;max-width:100%;object-fit:contain;">'
          + '</div>'
        : '')
      + '      <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:0.4rem;">วาดลายเซ็นใหม่ลงในกรอบด้านล่าง หรือเลือกไฟล์รูปภาพลายเซ็น (PNG พื้นหลังโปร่งใส):</div>'
      + '      <canvas id="pfSigCanvas" class="sig-pad-canvas" width="460" height="160"></canvas>'
      + '      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.75rem;">'
      + '        <button type="button" class="btn btn-sm btn-outline" onclick="PORTAL_APP.clearSignaturePad()"><i class="fa-solid fa-eraser"></i> ล้างกระดาน</button>'
      + '        <button type="button" class="btn btn-sm btn-primary" onclick="PORTAL_APP.saveCanvasSignature()"><i class="fa-solid fa-cloud-arrow-up"></i> บันทึกลายเซ็นที่วาด</button>'
      + '        <input type="file" id="pfSigFileInput" accept="image/*" style="display:none;" onchange="PORTAL_APP.handleUploadSignatureFile(event)">'
      + '        <button type="button" class="btn btn-sm btn-amber" onclick="document.getElementById(\'pfSigFileInput\').click()"><i class="fa-solid fa-file-image"></i> อัปโหลดไฟล์ลายเซ็น</button>'
      + '      </div>'
      + '    </div>'
      + '  </div>'

      // คอลัมน์ขวา: ฟอร์มแก้ไขข้อมูลบุคลากรและบัญชี
      + '  <div class="card">'
      + '    <div class="card-header">'
      + '      <div class="card-title"><i class="fa-solid fa-user-pen" style="color:var(--primary);"></i> แก้ไขข้อมูลบุคลากรและรหัสผ่าน</div>'
      + '    </div>'
      + '    <form onsubmit="PORTAL_APP.submitProfileUpdate(event)">'
      + '      <div class="form-grid" style="margin-bottom:1rem;">'
      + '        <div class="form-group">'
      + '          <label class="form-label">รหัสบุคลากร</label>'
      + '          <input type="text" class="form-control" value="' + esc(u.Personnel_ID || u.personnelId) + '" readonly>'
      + '        </div>'
      + '        <div class="form-group">'
      + '          <label class="form-label">ชื่อผู้ใช้งาน (Username) ' + (usernameChanged ? '<span class="chip chip-slate">แก้ไขครบ 1 ครั้งแล้ว</span>' : '<span class="chip chip-amber">เปลี่ยนได้ 1 ครั้ง</span>') + '</label>'
      + '          <input id="pf_username" type="text" class="form-control" value="' + esc(u.Username || u.username) + '" ' + (usernameChanged ? 'readonly' : '') + '>'
      + '        </div>'
      + '        <div class="form-group">'
      + '          <label class="form-label">อีเมล (Email)</label>'
      + '          <input id="pf_email" type="email" class="form-control" value="' + esc(u.Email || u.email) + '" required>'
      + '        </div>'
      + '        <div class="form-group">'
      + '          <label class="form-label">คำนำหน้าชื่อ</label>'
      + '          <select id="pf_prefix" class="form-select">' + buildOptionsHtml(prefixes, u.Prefix || u.prefix, '-- เลือก --') + '</select>'
      + '        </div>'
      + '        <div class="form-group">'
      + '          <label class="form-label">ชื่อจริง *</label>'
      + '          <input id="pf_first_name" type="text" class="form-control" value="' + esc(u.FirstName || u.firstName) + '" required>'
      + '        </div>'
      + '        <div class="form-group">'
      + '          <label class="form-label">นามสกุล *</label>'
      + '          <input id="pf_last_name" type="text" class="form-control" value="' + esc(u.LastName || u.lastName) + '" required>'
      + '        </div>'
      + '        <div class="form-group">'
      + '          <label class="form-label">ประเภทตำแหน่ง</label>'
      + '          <select id="pf_position_type" class="form-select">' + buildOptionsHtml(posTypes, u.Position_Type || u.positionType, '-- เลือก --') + '</select>'
      + '        </div>'
      + '        <div class="form-group">'
      + '          <label class="form-label">ตำแหน่งสายงาน</label>'
      + '          <select id="pf_position" class="form-select"></select>'
      + '        </div>'
      + '        <div class="form-group">'
      + '          <label class="form-label">ระดับตำแหน่ง</label>'
      + '          <select id="pf_position_level" class="form-select"></select>'
      + '        </div>'
      + '        <div class="form-group">'
      + '          <label class="form-label">ตำแหน่งช่วยราชการ/รักษาการ (ถ้ามี)</label>'
      + '          <input id="pf_position_2" type="text" class="form-control" value="' + esc(u.Position_2 || u.position2 || '') + '">'
      + '        </div>'
      + '        <div class="form-group">'
      + '          <label class="form-label">สำนัก/หน่วยงานหลัก</label>'
      + '          <select id="pf_bureau_name" class="form-select">' + buildOptionsHtml(bureaus, u.Bureau_Name || u.bureauName || 'สำนักเทศกิจ', '-- เลือก --') + '</select>'
      + '        </div>'
      + '        <div class="form-group">'
      + '          <label class="form-label">สำนักงาน/กอง</label>'
      + '          <select id="pf_office" class="form-select"></select>'
      + '        </div>'
      + '        <div class="form-group">'
      + '          <label class="form-label">ฝ่าย/ส่วน</label>'
      + '          <select id="pf_department" class="form-select"></select>'
      + '        </div>'
      + '        <div class="form-group">'
      + '          <label class="form-label">กลุ่มงาน</label>'
      + '          <select id="pf_division" class="form-select"></select>'
      + '        </div>'
      + '        <div class="form-group">'
      + '          <label class="form-label">ปี พ.ศ. ที่บรรจุ</label>'
      + '          <input id="pf_start_year" type="number" class="form-control" value="' + esc(u.Start_Service_Year_BE || u.startServiceYearBE || '') + '">'
      + '        </div>'
      + '        <div class="form-group">'
      + '          <label class="form-label">เงินเดือนปัจจุบัน (บาท)</label>'
      + '          <input id="pf_salary" type="number" step="0.01" class="form-control" value="' + esc(u.Current_Salary || u.currentSalary || '') + '">'
      + '        </div>'
      + '      </div>'
      + '      <div style="padding-top:1rem;border-top:1px solid var(--border-color);margin-bottom:1.15rem;">'
      + '        <div style="font-weight:700;margin-bottom:0.65rem;"><i class="fa-solid fa-key" style="color:var(--primary);"></i> เปลี่ยนรหัสผ่าน (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)</div>'
      + '        <div class="form-grid">'
      + '          <div class="form-group">'
      + '            <label class="form-label">รหัสผ่านปัจจุบัน</label>'
      + '            <input id="pf_current_pw" type="password" class="form-control" placeholder="ระบุเมื่อต้องการเปลี่ยนรหัสผ่าน">'
      + '          </div>'
      + '          <div class="form-group">'
      + '            <label class="form-label">รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)</label>'
      + '            <input id="pf_new_pw" type="password" minlength="8" class="form-control" placeholder="รหัสผ่านใหม่">'
      + '          </div>'
      + '        </div>'
      + '      </div>'
      + '      <button type="submit" class="btn btn-primary btn-lg"><i class="fa-solid fa-floppy-disk"></i> บันทึกข้อมูลส่วนตัว</button>'
      + '    </form>'
      + '  </div>'
      + '</div>';

    bindOrgAndPositionCascade('pf', {
      position_type: u.Position_Type || u.positionType || '',
      position: u.Position || u.position || '',
      position_level: u.Position_Level || u.positionLevel || '',
      bureau_name: u.Bureau_Name || u.bureauName || 'สำนักเทศกิจ',
      office: u.Office || u.office || '',
      department: u.Department || u.department || '',
      division: u.Division || u.division || ''
    });

    initSignaturePad();
  }

  function initSignaturePad() {
    var canvas = document.getElementById('pfSigCanvas');
    if (!canvas) return;
    sigPadCtx = canvas.getContext('2d');
    sigPadCtx.strokeStyle = '#002612';
    sigPadCtx.lineWidth = 2.4;
    sigPadCtx.lineCap = 'round';
    sigPadCtx.lineJoin = 'round';
    sigPadDirty = false;

    function getPos(e) {
      var rect = canvas.getBoundingClientRect();
      var clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
      var clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
      };
    }

    function start(e) {
      e.preventDefault();
      sigPadDrawing = true;
      sigPadDirty = true;
      var p = getPos(e);
      sigPadCtx.beginPath();
      sigPadCtx.moveTo(p.x, p.y);
    }

    function move(e) {
      if (!sigPadDrawing) return;
      e.preventDefault();
      var p = getPos(e);
      sigPadCtx.lineTo(p.x, p.y);
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
      alertError('กรุณาวาดลายเซ็นลงในกระดานก่อนกดบันทึก');
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
      username: document.getElementById('pf_username').value.trim(),
      email: document.getElementById('pf_email').value.trim(),
      prefix: document.getElementById('pf_prefix').value,
      first_name: document.getElementById('pf_first_name').value.trim(),
      last_name: document.getElementById('pf_last_name').value.trim(),
      position_type: document.getElementById('pf_position_type').value,
      position: document.getElementById('pf_position').value,
      position_level: document.getElementById('pf_position_level').value,
      position_2: document.getElementById('pf_position_2').value.trim(),
      bureau_name: document.getElementById('pf_bureau_name').value,
      office: document.getElementById('pf_office').value,
      department: document.getElementById('pf_department').value,
      division: document.getElementById('pf_division').value,
      start_service_year_be: document.getElementById('pf_start_year').value,
      current_salary: document.getElementById('pf_salary').value,
      current_password: document.getElementById('pf_current_pw').value,
      new_password: document.getElementById('pf_new_pw').value
    };

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
  // 9. Public Interface & Admin Extension Hook
  // ===========================================================================
  function registerAdminRoute(routeName, handlerFn) {
    ADMIN_ROUTES[routeName] = handlerFn;
  }

  var PORTAL_APP = {
    STATE: STATE,
    esc: esc,
    resolveDriveImg: resolveDriveImg,
    bootSystem: bootSystem,
    navigate: navigate,
    setPageHeader: setPageHeader,
    toggleTheme: toggleTheme,
    applyBranding: applyBranding,
    renderHeaderUser: renderHeaderUser,
    renderSidebarNav: renderSidebarNav,
    openModal: openModal,
    closeModal: closeModal,
    toast: toast,
    alertError: alertError,
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
