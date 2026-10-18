/**
 * =============================================================================
 * STB APP n2 — Admin Settings Module (assets/js/admin/admin-settings.js)
 * =============================================================================
 * 13 Central Configuration Keys, Google Drive Folder Verification,
 * System Reset Dialog (Mock Purge vs Full Purge to Bypass Mode).
 * =============================================================================
 */
(function (global) {
  'use strict';

  function getShared() {
    return global.AdminShared || {};
  }
  function getApp() {
    return (getShared().getApp && getShared().getApp()) || global.PORTAL_APP;
  }
  function getApi() {
    return (getShared().getApi && getShared().getApi()) || global.PORTAL_API;
  }
  function esc(val) {
    return getShared().esc ? getShared().esc(val) : String(val == null ? '' : val);
  }
  function toast(title, icon) {
    if (getShared().toast) getShared().toast(title, icon);
  }
  function alertError(msg) {
    if (getShared().alertError) getShared().alertError(msg);
  }
  function triggerIcons() {
    if (getShared().triggerIcons) getShared().triggerIcons();
  }

  var AdminSettings = {
    renderSettingsPage: function () {
      var app = getApp();
      if (!app) return;
      app.setPageHeader('ตั้งค่าระบบส่วนกลาง', 'ปรับแต่งชื่อระบบ โลโก้ ธีมสี นโยบายความปลอดภัย โฟลเดอร์ Google Drive และรีเซ็ตข้อมูลทดสอบ', 'settings');

      var pageBody = getShared().getPageBody ? getShared().getPageBody() : document.getElementById('content');
      if (!pageBody) return;

      var s = (app.STATE && app.STATE.settings) || {};

      var toolsHtml = ''
        + '<button type="button" class="btn-danger" onclick="PORTAL_ADMIN.confirmResetTestData()"><i data-lucide="alert-octagon" class="w-4 h-4"></i> รีเซ็ตข้อมูลทดสอบ</button>'
        + '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.submitSettings()"><i data-lucide="save" class="w-4 h-4"></i> บันทึกการตั้งค่า</button>';

      var sectionHeader = app.sectionBar('ตั้งค่าระบบส่วนกลาง (System Settings)', toolsHtml, 'settings');

      var formHtml = ''
        + '<form id="admSettingsForm" onsubmit="event.preventDefault();" class="space-y-6">'
        // Card 1: Branding & Display
        + '  <div class="card p-5">'
        + '    <div class="flex items-center gap-2 mb-3"><i data-lucide="palette" class="w-4 h-4 accent"></i><h3 class="font-bold text-sm">1. อัตลักษณ์และแบรนด์ (Branding & Identity)</h3></div>'
        + '    <div class="grid md:grid-cols-2 gap-4">'
        + '      <div><label class="lbl">ชื่อระบบที่แสดง (App_Display_Name)</label><input type="text" id="cfg_App_Display_Name" class="inp" placeholder="เช่น ระบบ Central Portal & SSO (สตบ.สนท.)" value="' + esc(s.App_Display_Name || '') + '"></div>'
        + '      <div><label class="lbl">URL พื้นฐานของระบบ (App_Base_Url)</label><input type="text" id="cfg_App_Base_Url" class="inp" placeholder="เช่น https://stb.bangkok.go.th/portal" value="' + esc(s.App_Base_Url || '') + '"></div>'
        + '      <div><label class="lbl">URL รูปภาพโลโก้หน้า Login (Login_Logo_URL)</label><input type="text" id="cfg_Login_Logo_URL" class="inp" value="' + esc(s.Login_Logo_URL || '') + '"></div>'
        + '      <div><label class="lbl">URL รูปภาพโลโก้บน Header/Dashboard (Dashboard_Logo_URL)</label><input type="text" id="cfg_Dashboard_Logo_URL" class="inp" value="' + esc(s.Dashboard_Logo_URL || '') + '"></div>'
        + '      <div><label class="lbl">URL ภาพโปรไฟล์เริ่มต้น (Default_Profile_Picture_URL)</label><input type="text" id="cfg_Default_Profile_Picture_URL" class="inp" value="' + esc(s.Default_Profile_Picture_URL || '') + '"></div>'
        + '      <div><label class="lbl">ธีมเริ่มต้นของระบบ (Default_Theme)</label>'
        + '        <select id="cfg_Default_Theme" class="inp">'
        + '          <option value="light"' + (s.Default_Theme === 'light' || !s.Default_Theme ? ' selected' : '') + '>โหมดกลางวัน (Light Mode)</option>'
        + '          <option value="dark"' + (s.Default_Theme === 'dark' ? ' selected' : '') + '>โหมดกลางคืน (Dark Mode)</option>'
        + '        </select>'
        + '      </div>'
        + '    </div>'
        + '  </div>'
        // Card 2: Security & Session
        + '  <div class="card p-5">'
        + '    <div class="flex items-center gap-2 mb-3"><i data-lucide="shield" class="w-4 h-4 accent"></i><h3 class="font-bold text-sm">2. ความปลอดภัยและอายุโทเค็น (Security Policies & Token Lifetimes)</h3></div>'
        + '    <div class="grid md:grid-cols-3 gap-4">'
        + '      <div><label class="lbl">อายุ Session เข้าสู่ระบบ (Session_Hours - ชั่วโมง)</label><input type="number" id="cfg_Session_Hours" class="inp" value="' + esc(s.Session_Hours || 12) + '"></div>'
        + '      <div><label class="lbl">อายุลิงก์ยืนยันอีเมล (Verify_Email_Hours - ชั่วโมง)</label><input type="number" id="cfg_Verify_Email_Hours" class="inp" value="' + esc(s.Verify_Email_Hours || 24) + '"></div>'
        + '      <div><label class="lbl">อายุโทเค็นรีเซ็ตรหัสผ่าน (Reset_Token_Minutes - นาที)</label><input type="number" id="cfg_Reset_Token_Minutes" class="inp" value="' + esc(s.Reset_Token_Minutes || 15) + '"></div>'
        + '    </div>'
        + '  </div>'
        // Card 3: Google Drive Folders
        + '  <div class="card p-5">'
        + '    <div class="flex items-center gap-2 mb-3"><i data-lucide="folder-git-2" class="w-4 h-4 accent"></i><h3 class="font-bold text-sm">3. โฟลเดอร์จัดเก็บไฟล์ Google Drive</h3></div>'
        + '    <div class="grid md:grid-cols-2 gap-4">'
        + '      <div>'
        + '        <label class="lbl">โฟลเดอร์รูปโปรไฟล์ผู้ใช้ (Profile_Folder_ID)</label>'
        + '        <div class="flex gap-2">'
        + '          <input type="text" id="cfg_Profile_Folder_ID" class="inp" value="' + esc(s.Profile_Folder_ID || '') + '" placeholder="Folder ID จาก Google Drive">'
        + '          <button type="button" class="btn-ghost shrink-0" onclick="PORTAL_ADMIN.testDriveFolder(\'cfg_Profile_Folder_ID\', \'รูปโปรไฟล์\')"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> ทดสอบ</button>'
        + '        </div>'
        + '      </div>'
        + '      <div>'
        + '        <label class="lbl">โฟลเดอร์รูปลายเซ็นดิจิทัล (Signature_Folder_ID)</label>'
        + '        <div class="flex gap-2">'
        + '          <input type="text" id="cfg_Signature_Folder_ID" class="inp" value="' + esc(s.Signature_Folder_ID || '') + '" placeholder="Folder ID จาก Google Drive">'
        + '          <button type="button" class="btn-ghost shrink-0" onclick="PORTAL_ADMIN.testDriveFolder(\'cfg_Signature_Folder_ID\', \'ลายเซ็น\')"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> ทดสอบ</button>'
        + '        </div>'
        + '      </div>'
        + '      <div>'
        + '        <label class="lbl">โฟลเดอร์รูปถ่ายบุคลากรทางการ (Personnel_Photo_Folder_ID)</label>'
        + '        <div class="flex gap-2">'
        + '          <input type="text" id="cfg_Personnel_Photo_Folder_ID" class="inp" value="' + esc(s.Personnel_Photo_Folder_ID || '') + '" placeholder="Folder ID จาก Google Drive">'
        + '          <button type="button" class="btn-ghost shrink-0" onclick="PORTAL_ADMIN.testDriveFolder(\'cfg_Personnel_Photo_Folder_ID\', \'รูปบุคลากร\')"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> ทดสอบ</button>'
        + '        </div>'
        + '      </div>'
        + '      <div>'
        + '        <label class="lbl">โฟลเดอร์ไอคอนเว็บแอปย่อย (App_Icon_Folder_ID)</label>'
        + '        <div class="flex gap-2">'
        + '          <input type="text" id="cfg_App_Icon_Folder_ID" class="inp" value="' + esc(s.App_Icon_Folder_ID || '') + '" placeholder="Folder ID จาก Google Drive">'
        + '          <button type="button" class="btn-ghost shrink-0" onclick="PORTAL_ADMIN.testDriveFolder(\'cfg_App_Icon_Folder_ID\', \'ไอคอนเว็บแอป\')"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> ทดสอบ</button>'
        + '        </div>'
        + '      </div>'
        + '    </div>'
        + '  </div>'
        + '</form>';

      pageBody.innerHTML = sectionHeader + formHtml;
      triggerIcons();
    },

    testDriveFolder: async function (inputId, label) {
      var val = (document.getElementById(inputId).value || '').trim();
      if (!val) {
        alertError('กรุณาระบุ Folder ID ก่อนทดสอบ');
        return;
      }
      if (!global.STB_DRIVE || typeof global.STB_DRIVE.testFolderAccess !== 'function') {
        alertError('ไม่พบโมดูล STB_DRIVE หรือยังไม่ได้ตั้งค่า Google Apps Script Bridge URL');
        return;
      }

      try {
        var res = await global.LOADER.busy(
          global.STB_DRIVE.testFolderAccess(val),
          'กำลังตรวจสอบสิทธิ์โฟลเดอร์ Google Drive (' + label + ')...'
        );
        if (res && res.ok) {
          toast('เชื่อมต่อโฟลเดอร์ Google Drive "' + (res.folderName || label) + '" สำเร็จ!');
        } else {
          alertError('ไม่สามารถเข้าถึงโฟลเดอร์ได้: ' + ((res && res.error) || 'สิทธิ์ไม่เพียงพอ'));
        }
      } catch (e) {
        alertError('ทดสอบการเชื่อมต่อโฟลเดอร์ไม่สำเร็จ: ' + e.message);
      }
    },

    submitSettings: async function () {
      var app = getApp();
      if (!app) return;

      var keys = [
        'App_Display_Name',
        'App_Base_Url',
        'Login_Logo_URL',
        'Dashboard_Logo_URL',
        'Default_Profile_Picture_URL',
        'Default_Theme',
        'Session_Hours',
        'Verify_Email_Hours',
        'Reset_Token_Minutes',
        'Profile_Folder_ID',
        'Signature_Folder_ID',
        'Personnel_Photo_Folder_ID',
        'App_Icon_Folder_ID'
      ];

      var settingsObj = {};
      keys.forEach(function (k) {
        var el = document.getElementById('cfg_' + k);
        if (el) {
          settingsObj[k] = el.value.trim();
        }
      });

      try {
        var res = await global.LOADER.busy(
          getApi().saveSystemSettings(settingsObj),
          'กำลังบันทึกการตั้งค่าระบบ...'
        );
        Object.assign(app.STATE.settings, settingsObj);
        toast(res.message || 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
        app.applyBranding();
        if (app.STATE.settings.Default_Theme) {
          app.applyTheme(app.STATE.settings.Default_Theme, false);
        }
        AdminSettings.renderSettingsPage();
      } catch (err) {
        alertError(err.message || 'บันทึกการตั้งค่าไม่สำเร็จ');
      }
    },

    confirmResetTestData: function () {
      var app = getApp();
      if (!app) return;

      var bodyHtml = ''
        + '<div class="space-y-4">'
        + '  <div class="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-600 dark:text-red-400 leading-relaxed">'
        + '    <div class="font-bold flex items-center gap-1.5 mb-1"><i data-lucide="alert-triangle" class="w-4 h-4"></i> คำเตือนสำคัญสำหรับการรีเซ็ตข้อมูล:</div>'
        + '    โปรดเลือกโหมดการรีเซ็ตข้อมูลอย่างระมัดระวัง ข้อมูลที่ถูกลบจะไม่สามารถกู้คืนได้'
        + '  </div>'
        + '  <div class="space-y-3">'
        + '    <label class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3 cursor-pointer hover:border-slate-400 transition">'
        + '      <input type="radio" name="resetMode" value="MOCK_ONLY" checked class="mt-1">'
        + '      <div>'
        + '        <div class="font-bold text-sm">โหมดที่ 1: ลบเฉพาะข้อมูลจำลอง (Mock Data Only — แนะนำ)</div>'
        + '        <div class="text-xs muted mt-0.5">ลบบัญชีและบุคลากรทดสอบ (MOCK_%) แต่คงบัญชีจริงและข้อมูลโครงสร้างระบบไว้</div>'
        + '      </div>'
        + '    </label>'
        + '    <label class="p-3.5 rounded-xl border border-red-500/30 bg-red-500/5 flex items-start gap-3 cursor-pointer hover:border-red-500 transition">'
        + '      <input type="radio" name="resetMode" value="FULL_PURGE" class="mt-1 text-red-600">'
        + '      <div>'
        + '        <div class="font-bold text-sm text-red-600 dark:text-red-400">โหมดที่ 2: ล้างข้อมูลทั้งหมดเพื่อเริ่มระบบใหม่ (Full Reset to Bypass Mode)</div>'
        + '        <div class="text-xs muted mt-0.5">ลบผู้ใช้งานและบุคลากรทั้งหมด ระบบจะกลับเข้าสู่ <b>First-Time Setup Bypass Mode</b> ทันที เพื่อให้ท่านสร้างบัญชี SUPERADMIN คนแรกใหม่</div>'
        + '      </div>'
        + '    </label>'
        + '  </div>'
        + '</div>';

      var footerHtml = ''
        + '<button type="button" class="btn-ghost" onclick="PORTAL_APP.closeModal()">ยกเลิก</button>'
        + '<button type="button" class="btn-danger" onclick="PORTAL_ADMIN.executeResetTestData()"><i data-lucide="trash-2" class="w-4 h-4"></i> ยืนยันการรีเซ็ต</button>';

      app.openModal('รีเซ็ตข้อมูลระบบ (System Data Reset)', bodyHtml, footerHtml, '600px', 'alert-octagon');
      triggerIcons();
    },

    executeResetTestData: async function () {
      var mode = 'MOCK_ONLY';
      var radios = document.getElementsByName('resetMode');
      for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) mode = radios[i].value;
      }

      try {
        var res = await global.LOADER.busy(
          getApi().resetTestData(mode),
          'กำลังรีเซ็ตข้อมูลระบบ...'
        );
        getApp().closeModal();
        toast(res.message || 'รีเซ็ตข้อมูลเรียบร้อยแล้ว');
        await getApp().bootSystem();
      } catch (err) {
        alertError(err.message || 'รีเซ็ตข้อมูลไม่สำเร็จ');
      }
    }
  };

  global.AdminSettings = AdminSettings;
})(window);

