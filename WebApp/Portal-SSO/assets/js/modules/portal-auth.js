/**
 * =============================================================================
 * STB APP n2 — Portal Auth & Registration Wizard (assets/js/modules/portal-auth.js)
 * =============================================================================
 * Single Sign-On Authentication, 3-Step Registration Wizard, Forgot/Reset
 * Password, Email Verification & Logout Confirm.
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

  var PortalAuth = {
    renderMissingKeyNotice: function () {
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
    },

    renderBootErrorPanel: function (err) {
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
    },

    renderLoginForm: function () {
      var box = document.getElementById('authPanelBody');
      if (!box) return;
      var state = getState();
      var allowReg = String((state.settings && state.settings.Allow_Registration) || 'TRUE').toUpperCase() === 'TRUE';

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
    },

    submitLogin: async function (ev) {
      if (ev) ev.preventDefault();
      var uEl = document.getElementById('loginUsername');
      var pEl = document.getElementById('loginPassword');
      var username = uEl ? uEl.value.trim() : '';
      var password = pEl ? pEl.value : '';
      if (!username || !password) return;

      try {
        var res = await global.LOADER.busy(
          global.PORTAL_API.login(username, password),
          'กำลังตรวจสอบข้อมูลการเข้าสู่ระบบ...'
        );
        var state = getState();
        state.user = res.user;
        state.isSetupMode = false;
        state.hasSuperadmin = true;
        if (global.PortalUI && typeof global.PortalUI.toast === 'function') {
          global.PortalUI.toast('ยินดีต้อนรับ ' + (state.user.FullName || state.user.Username));
          global.PortalUI.showAppShell();
        }
        if (global.PORTAL_APP && typeof global.PORTAL_APP.navigate === 'function') {
          await global.PORTAL_APP.navigate('dashboard');
        }
      } catch (err) {
        if (global.PortalUI && typeof global.PortalUI.alertError === 'function') {
          global.PortalUI.alertError(err.message || 'ไม่สามารถเข้าสู่ระบบได้', 'เข้าสู่ระบบไม่สำเร็จ');
        } else {
          alert(err.message || 'ไม่สามารถเข้าสู่ระบบได้');
        }
      }
    },

    handleLogout: async function () {
      var state = getState();
      var u = state.user || {};
      var name = u.FullName || u.fullName || u.Username || 'ผู้ใช้งาน';
      var confirmed = await global.PortalUI.confirmAction({
        title: 'ต้องการออกจากระบบหรือไม่?',
        text: 'ระบบจะล้างข้อมูลการเข้าสู่ระบบของ ' + name + ' และกลับสู่หน้าเข้าสู่ระบบ',
        confirmText: 'ออกจากระบบ',
        cancelText: 'อยู่ต่อ',
        confirmColor: '#E53935'
      });
      if (!confirmed) return;

      await global.PORTAL_API.logout();
      state.user = null;
      if (global.PORTAL_APP && typeof global.PORTAL_APP.bootSystem === 'function') {
        await global.PORTAL_APP.bootSystem();
      }
    },

    // -------------------------------------------------------------------------
    // Registration Wizard
    // -------------------------------------------------------------------------
    startRegisterWizard: function () {
      var state = getState();
      state.regWizard = {
        step: 1,
        idCard: '',
        isExistingPersonnel: false,
        existingPersonnel: null,
        formData: {}
      };
      PortalAuth.renderRegisterWizard();
    },

    renderRegisterWizard: function () {
      var box = document.getElementById('authPanelBody');
      if (!box) return;
      var state = getState();
      var w = state.regWizard;

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
        var prefixes = (global.PortalCascade ? global.PortalCascade.getReferenceItems('PREFIX') : []).map(function (x) { return x.value; });
        var bureaus = (global.PortalCascade ? global.PortalCascade.getReferenceItems('BUREAU') : []).map(function (x) { return x.value; });
        var posTypes = global.PortalCascade ? global.PortalCascade.getPositionTypes() : [];
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
          + '    <div><label class="lbl">คำนำหน้า *</label><select id="reg_prefix" class="inp" required>' + (global.PortalCascade ? global.PortalCascade.buildOptionsHtml(prefixes, fd.prefix, '-- เลือก --') : '') + '</select></div>'
          + '    <div><label class="lbl">ชื่อ *</label><input id="reg_first_name" class="inp" value="' + esc(fd.first_name || '') + '" required></div>'
          + '    <div><label class="lbl">นามสกุล *</label><input id="reg_last_name" class="inp" value="' + esc(fd.last_name || '') + '" required></div>'
          + '  </div>'
          + '  <div class="grid grid-cols-2 gap-2">'
          + '    <div><label class="lbl">ประเภทตำแหน่ง *</label><select id="reg_position_type" class="inp" required>' + (global.PortalCascade ? global.PortalCascade.buildOptionsHtml(posTypes, defPosType, '-- เลือกประเภทตำแหน่ง --') : '') + '</select></div>'
          + '    <div><label class="lbl">สายงาน/ตำแหน่ง *</label><select id="reg_position" class="inp" required></select></div>'
          + '  </div>'
          + '  <div class="grid grid-cols-2 gap-2">'
          + '    <div><label class="lbl">ระดับตำแหน่ง</label><select id="reg_position_level" class="inp"></select></div>'
          + '    <div><label class="lbl">สำนัก *</label><select id="reg_bureau_name" class="inp" required>' + (global.PortalCascade ? global.PortalCascade.buildOptionsHtml(bureaus, defBureau, '-- เลือกสำนัก --') : '') + '</select></div>'
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

        if (global.PortalCascade) {
          global.PortalCascade.bindOrgAndPositionCascade('reg', fd);
        }
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
    },

    backRegStep: function (targetStep) {
      var state = getState();
      state.regWizard.step = targetStep;
      PortalAuth.renderRegisterWizard();
    },

    submitRegStep1: async function (ev) {
      if (ev) ev.preventDefault();
      var idInput = document.getElementById('regIdCardInput');
      var idVal = idInput ? idInput.value.trim() : '';

      if (!/^\d{13}$/.test(idVal)) {
        global.PortalUI.alertError('เลขประจำตัวประชาชนต้องเป็นตัวเลข 13 หลัก');
        return;
      }

      try {
        var res = await global.LOADER.busy(
          global.PORTAL_API.checkIdCardPersonnel(idVal),
          'กำลังตรวจสอบเลขบัตรประชาชน...'
        );
        var state = getState();
        state.regWizard.idCard = idVal;
        state.regWizard.isExistingPersonnel = !!res.found;
        state.regWizard.existingPersonnel = res.personnel || null;

        if (res.found && res.has_user_account) {
          global.PortalUI.alertError('เลขบัตรประชาชนนี้มีบัญชีผู้ใช้งานในระบบแล้ว กรุณาเข้าสู่ระบบ หรือใช้เมนูลืมรหัสผ่าน');
          return;
        }

        if (res.found) {
          var p = res.personnel || {};
          global.PortalUI.toast('พบข้อมูลบุคลากรเดิม: ' + (p.full_name || (p.first_name + ' ' + p.last_name)));
          state.regWizard.formData = {
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
          state.regWizard.step = 3;
        } else {
          state.regWizard.step = 2;
        }
        PortalAuth.renderRegisterWizard();
      } catch (err) {
        global.PortalUI.alertError(err.message || 'ไม่สามารถตรวจสอบเลขบัตรประชาชนได้');
      }
    },

    submitRegStep2: function (ev) {
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
        global.PortalUI.alertError('กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน');
        return;
      }

      var state = getState();
      state.regWizard.formData = fd;
      state.regWizard.step = 3;
      PortalAuth.renderRegisterWizard();
    },

    submitRegStep3: async function (ev) {
      if (ev) ev.preventDefault();
      var username = document.getElementById('reg_username').value.trim();
      var email = document.getElementById('reg_email').value.trim();
      var p1 = document.getElementById('reg_password').value;
      var p2 = document.getElementById('reg_password_confirm').value;

      if (p1 !== p2) {
        global.PortalUI.alertError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
        return;
      }

      var state = getState();
      var w = state.regWizard;
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
        var res = await global.LOADER.busy(
          global.PORTAL_API.register(payload),
          'กำลังบันทึกข้อมูลการลงทะเบียน...'
        );
        global.PortalUI.alertSuccess(
          res.message || 'ลงทะเบียนสำเร็จ! หากระบบต้องการยืนยันอีเมล กรุณาตรวจสอบลิงก์ในกล่องข้อความของท่าน',
          'ลงทะเบียนสำเร็จ'
        );
        PortalAuth.renderLoginForm();
      } catch (err) {
        global.PortalUI.alertError(err.message || 'ไม่สามารถลงทะเบียนได้');
      }
    },

    // -------------------------------------------------------------------------
    // Forgot & Reset Password
    // -------------------------------------------------------------------------
    renderForgotPasswordForm: function () {
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
    },

    submitForgotPassword: async function (ev) {
      if (ev) ev.preventDefault();
      var email = document.getElementById('forgotEmailInput').value.trim();
      if (!email) return;

      try {
        var res = await global.LOADER.busy(
          global.PORTAL_API.requestPasswordReset(email),
          'กำลังส่งลิงก์ตั้งรหัสผ่านใหม่...'
        );
        global.PortalUI.alertSuccess(res.message || 'ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมลของท่านเรียบร้อยแล้ว');
        PortalAuth.renderLoginForm();
      } catch (err) {
        global.PortalUI.alertError(err.message);
      }
    },

    handleVerifyEmailHash: async function (rawHash) {
      var m = rawHash.match(/token=([^&]+)/);
      var token = m ? decodeURIComponent(m[1]) : '';
      if (!token) return;
      try {
        var res = await global.LOADER.busy(
          global.PORTAL_API.verifyEmail(token),
          'กำลังยืนยันอีเมล...'
        );
        global.PortalUI.alertSuccess(res.message || 'ยืนยันอีเมลสำเร็จ ตอนนี้ท่านสามารถเข้าสู่ระบบได้ทันที');
        history.replaceState(null, '', window.location.pathname);
        PortalAuth.renderLoginForm();
      } catch (err) {
        global.PortalUI.alertError(err.message);
      }
    },

    renderResetPasswordForm: function (rawHash) {
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
    },

    submitResetPassword: async function (ev, token) {
      if (ev) ev.preventDefault();
      var p1 = document.getElementById('newResetPw1').value;
      var p2 = document.getElementById('newResetPw2').value;
      if (p1 !== p2) {
        global.PortalUI.alertError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
        return;
      }
      try {
        var res = await global.LOADER.busy(
          global.PORTAL_API.resetPassword(token, p1),
          'กำลังบันทึกรหัสผ่านใหม่...'
        );
        global.PortalUI.toast(res.message || 'เปลี่ยนรหัสผ่านสำเร็จ');
        history.replaceState(null, '', window.location.pathname);
        PortalAuth.renderLoginForm();
      } catch (err) {
        global.PortalUI.alertError(err.message);
      }
    }
  };

  global.PortalAuth = PortalAuth;
})(window);

