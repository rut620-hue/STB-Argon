/**
 * =============================================================================
 * STB APP n2 — Portal UI & Modal System (assets/js/core/portal-ui.js)
 * =============================================================================
 * Theme, Branding (with dynamic footer year & LOADER brand caching),
 * Header/Sidebar Navigation, Modals, SweetAlert2 Dialogs & API Key Settings.
 * =============================================================================
 */
(function (global) {
  'use strict';

  function getState() {
    return (global.PortalState && global.PortalState.STATE) || (global.PORTAL_APP && global.PORTAL_APP.STATE) || {};
  }

  function esc(val) {
    return (global.PortalState && global.PortalState.esc) ? global.PortalState.esc(val) : String(val == null ? '' : val);
  }

  function icons() {
    if (global.PortalState && typeof global.PortalState.icons === 'function') {
      global.PortalState.icons();
    } else if (global.lucide && global.lucide.createIcons) {
      global.lucide.createIcons();
    }
  }

  var PortalUI = {
    // -------------------------------------------------------------------------
    // 1. Theme Management
    // -------------------------------------------------------------------------
    applyTheme: function (mode, saveLocal) {
      var state = getState();
      var m = (String(mode || '').toLowerCase() === 'dark') ? 'dark' : 'light';
      state.theme = m;
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
    },

    toggleTheme: function () {
      var state = getState();
      PortalUI.applyTheme(state.theme === 'dark' ? 'light' : 'dark', true);
      if (state.currentRoute === 'dashboard' && global.PortalDashboard && typeof global.PortalDashboard.renderDashboardCharts === 'function') {
        global.PortalDashboard.renderDashboardCharts();
      }
    },

    // -------------------------------------------------------------------------
    // 2. Branding & Dynamic Footer
    // -------------------------------------------------------------------------
    applyBranding: function () {
      var state = getState();
      var s = state.settings || {};
      var appName = s.App_Display_Name || s.App_Name || 'Central Portal & Single Sign-On';
      var orgName = s.Organization_Name || 'ส่วนตรวจและบังคับการ สำนักเทศกิจ';
      var subName = s.Organization_Sub || 'กรุงเทพมหานคร';
      var desc = s.App_Desc || 'ศูนย์กลางการยืนยันตัวตน (Single Sign-On) ทะเบียนประวัติบุคลากร และประตูเชื่อมต่อไปยังระบบงานย่อยของหน่วยงานอย่างปลอดภัย';
      var logoUrl = (global.PortalState && global.PortalState.resolveDriveImg)
        ? global.PortalState.resolveDriveImg(
            s.Portal_Logo_URL || s.Custom_Logo_URL || s.Default_Logo_URL,
            'https://pr-bangkok.com/wp-content/uploads/2025/06/231116_BMA-Emblem_Edited_Green-600x600.png'
          )
        : (s.Portal_Logo_URL || 'https://pr-bangkok.com/wp-content/uploads/2025/06/231116_BMA-Emblem_Edited_Green-600x600.png');

      document.title = appName + ' · ' + orgName;

      // Update BMA Loader logo & persist brand cache for instant boot
      if (global.LOADER) {
        if (typeof global.LOADER.setLogo === 'function') {
          global.LOADER.setLogo(logoUrl);
        }
        if (typeof global.LOADER.saveBrand === 'function') {
          global.LOADER.saveBrand({
            sys: appName,
            org: orgName,
            sub: subName,
            logo: logoUrl
          });
        }
      }

      // Synchronize all Branding text nodes in SPA Shell
      [
        ['loginSys', appName], ['sbTitle', appName], ['spSys', appName], ['ftSys', appName],
        ['loginOrg', orgName], ['sbOrg', orgName], ['spOrg', orgName], ['ftOrg', orgName],
        ['loginSub', subName], ['spSub', subName],
        ['loginDesc', desc]
      ].forEach(function (pair) {
        var el = document.getElementById(pair[0]);
        if (el && pair[1]) el.textContent = pair[1];
      });

      // Dynamic Buddhist Era Year in Footer
      var curYearBE = (new Date()).getFullYear() + 543;
      var elFtYear = document.getElementById('ftYear');
      if (elFtYear) {
        elFtYear.textContent = String(curYearBE);
      }

      var loginLogo = document.getElementById('loginLogo');
      if (loginLogo && logoUrl) loginLogo.src = logoUrl;
      var sbLogo = document.getElementById('sbLogo');
      if (sbLogo && logoUrl) sbLogo.src = logoUrl;
    },

    // -------------------------------------------------------------------------
    // 3. Shell Switching & Splash
    // -------------------------------------------------------------------------
    hideSplash: function () {
      if (global.LOADER && typeof global.LOADER.closeSplash === 'function') {
        global.LOADER.closeSplash();
      }
      var sp = document.getElementById('splash');
      if (sp) {
        sp.style.transition = 'opacity 0.3s ease';
        sp.style.opacity = '0';
        setTimeout(function () {
          sp.style.display = 'none';
          sp.classList.add('hidden');
        }, 300);
      }
    },

    showLoginShell: function () {
      var lv = document.getElementById('loginView');
      var av = document.getElementById('appView');
      if (lv) { lv.style.display = 'flex'; lv.classList.remove('hidden'); }
      if (av) { av.style.display = 'none'; av.classList.add('hidden'); }
      icons();
    },

    showAppShell: function () {
      var state = getState();
      var lv = document.getElementById('loginView');
      var av = document.getElementById('appView');
      var sb = document.getElementById('setupBanner');
      if (lv) { lv.style.display = 'none'; lv.classList.add('hidden'); }
      if (av) { av.style.display = 'flex'; av.classList.remove('hidden'); }
      if (sb) sb.style.display = (state.isSetupMode || !state.hasSuperadmin) ? 'flex' : 'none';
      PortalUI.renderHeaderUser();
      PortalUI.renderSidebarNav();
      icons();
    },

    renderHeaderUser: function () {
      var state = getState();
      var u = state.user || {};
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
        var photo = (global.PortalState && global.PortalState.resolveDriveImg)
          ? global.PortalState.resolveDriveImg(u.Photo_URL || u.photoUrl || u.photo_url, '')
          : (u.Photo_URL || u.photoUrl || '');
        if (photo) {
          elHdAvatar.innerHTML = '<img src="' + esc(photo) + '" class="w-full h-full rounded-full object-cover" alt="Avatar">';
        } else {
          elHdAvatar.textContent = ini;
        }
      }

      var elRoleBadge = document.getElementById('roleBadgeTx') || document.getElementById('sbRoleBadge');
      if (elRoleBadge) {
        elRoleBadge.textContent = state.isSetupMode ? 'SETUP MODE' : role;
      }
      var elSetupBadge = document.getElementById('setupBadge');
      if (elSetupBadge) {
        if (state.isSetupMode || !state.hasSuperadmin) elSetupBadge.classList.remove('hidden');
        else elSetupBadge.classList.add('hidden');
      }
    },

    renderSidebarNav: function () {
      var state = getState();
      var nav = document.getElementById('sbNav');
      if (!nav) return;

      var role = (state.user && (state.user.Role || state.user.role)) || 'USER';
      var isAdmin = state.isSetupMode || role === 'ADMIN' || role === 'SUPERADMIN';
      var isSuper = state.isSetupMode || role === 'SUPERADMIN';

      var html = '';
      html += '<div class="menu-group">ข้อมูลและบริการ</div>';
      html += '<div class="menu-item' + (state.currentRoute === 'dashboard' ? ' active' : '') + '" data-route="dashboard" onclick="PORTAL_APP.navigate(\'dashboard\')">'
        + '<i data-lucide="layout-dashboard" class="w-[18px] h-[18px] shrink-0"></i><span class="truncate">Dashboard</span></div>';

      if (!state.isSetupMode) {
        html += '<div class="menu-item' + (state.currentRoute === 'profile' ? ' active' : '') + '" data-route="profile" onclick="PORTAL_APP.navigate(\'profile\')">'
          + '<i data-lucide="id-card" class="w-[18px] h-[18px] shrink-0"></i><span class="truncate">โปรไฟล์และลายเซ็น</span></div>';
      }

      if (isAdmin) {
        html += '<div class="menu-group">จัดการระบบ (Admin)</div>';
        html += '<div class="menu-item' + (state.currentRoute === 'personnel' ? ' active' : '') + '" data-route="personnel" onclick="PORTAL_APP.navigate(\'personnel\')">'
          + '<i data-lucide="users" class="w-[18px] h-[18px] shrink-0"></i><span class="truncate">ทำเนียบบุคลากร</span></div>';
        html += '<div class="menu-item' + (state.currentRoute === 'users' ? ' active' : '') + '" data-route="users" onclick="PORTAL_APP.navigate(\'users\')">'
          + '<i data-lucide="shield-check" class="w-[18px] h-[18px] shrink-0"></i><span class="truncate">จัดการบัญชีและสิทธิ์</span></div>';
      }

      if (isSuper) {
        html += '<div class="menu-group">ตั้งค่าโครงสร้าง (Superadmin)</div>';
        html += '<div class="menu-item' + (state.currentRoute === 'webapps' ? ' active' : '') + '" data-route="webapps" onclick="PORTAL_APP.navigate(\'webapps\')">'
          + '<i data-lucide="grid" class="w-[18px] h-[18px] shrink-0"></i><span class="truncate">จัดการเว็บแอปย่อย (SSO)</span></div>';
        html += '<div class="menu-item' + (state.currentRoute === 'reference' ? ' active' : '') + '" data-route="reference" onclick="PORTAL_APP.navigate(\'reference\')">'
          + '<i data-lucide="network" class="w-[18px] h-[18px] shrink-0"></i><span class="truncate">โครงสร้างสังกัด & คำนำหน้า</span></div>';
        html += '<div class="menu-item' + (state.currentRoute === 'positions' ? ' active' : '') + '" data-route="positions" onclick="PORTAL_APP.navigate(\'positions\')">'
          + '<i data-lucide="layers" class="w-[18px] h-[18px] shrink-0"></i><span class="truncate">โครงสร้างตำแหน่ง/ระดับ</span></div>';
        html += '<div class="menu-item' + (state.currentRoute === 'settings' ? ' active' : '') + '" data-route="settings" onclick="PORTAL_APP.navigate(\'settings\')">'
          + '<i data-lucide="settings" class="w-[18px] h-[18px] shrink-0"></i><span class="truncate">ตั้งค่าระบบ (Settings)</span></div>';
      }

      nav.innerHTML = html;
      icons();
    },

    highlightSidebar: function (route) {
      var links = document.querySelectorAll('#sbNav .menu-item');
      for (var i = 0; i < links.length; i++) {
        var r = links[i].getAttribute('data-route');
        if (r === route) links[i].classList.add('active');
        else links[i].classList.remove('active');
      }
    },

    setPageHeader: function (title, subtitle, iconName) {
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
    },

    togglePasswordVisibility: function (id) {
      var el = document.getElementById(id);
      if (el) el.type = el.type === 'password' ? 'text' : 'password';
    },

    toggleSidebar: function () {
      var sb = document.getElementById('sidebar');
      var ov = document.getElementById('overlay');
      if (sb) sb.classList.toggle('-translate-x-full');
      if (ov) ov.classList.toggle('hidden');
    },

    // -------------------------------------------------------------------------
    // 4. Universal Modal & SweetAlert2 Dialogs
    // -------------------------------------------------------------------------
    openModal: function (title, bodyHtml, footerHtml, maxWidth, iconName) {
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
    },

    closeModal: function () {
      var modal = document.getElementById('appModal');
      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
      }
    },

    toast: function (title, icon) {
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
    },

    alertError: function (msg, title) {
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
    },

    alertSuccess: function (msg, title) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'success',
          title: title || 'ดำเนินการสำเร็จ',
          html: '<div style="font-size:14px;text-align:left;line-height:1.7">' + esc(msg) + '</div>',
          confirmButtonColor: '#007B3E'
        });
      }
    },

    confirmAction: function (options) {
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
    },

    // -------------------------------------------------------------------------
    // 5. Connection Config Modal (API Key Setup)
    // -------------------------------------------------------------------------
    openConnectionConfigModal: function (autoRetryBoot) {
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

      PortalUI.openModal('ตั้งค่าการเชื่อมต่อระบบ (Supabase & GAS Bridge)', body, footer, '620px', 'plug');
    },

    saveConnectionConfig: async function (retryBoot) {
      var keyEl = document.getElementById('cfgAnonKeyInput');
      var gasEl = document.getElementById('cfgGasUrlInput');
      var keyVal = keyEl ? keyEl.value.trim() : '';
      var gasVal = gasEl ? gasEl.value.trim() : '';

      if (!keyVal) {
        PortalUI.alertError('กรุณาวาง Supabase Anon Public Key ก่อนบันทึก');
        return;
      }

      if (global.STB_CONFIG) {
        global.STB_CONFIG.setSupabaseAnonKey(keyVal);
        if (gasVal) global.STB_CONFIG.setGasBridgeUrl(gasVal);
      }
      PortalUI.closeModal();
      PortalUI.toast('บันทึกการตั้งค่าการเชื่อมต่อเรียบร้อยแล้ว');
      var state = getState();
      if (retryBoot || !state.booted) {
        if (global.PORTAL_APP && typeof global.PORTAL_APP.bootSystem === 'function') {
          await global.PORTAL_APP.bootSystem();
        }
      }
    }
  };

  global.PortalUI = PortalUI;
})(window);

