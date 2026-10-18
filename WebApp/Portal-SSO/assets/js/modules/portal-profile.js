/**
 * =============================================================================
 * STB APP n2 — Portal Profile & Canvas Signature Pad (assets/js/modules/portal-profile.js)
 * =============================================================================
 * Self-Service Profile Editing, Masked Thai Citizen ID, One-time Username Sync,
 * Google Drive Photo/Signature Upload & HTML5 Canvas Signature Pad.
 * =============================================================================
 */
(function (global) {
  'use strict';

  var sigPadCtx = null;
  var sigPadDrawing = false;
  var sigPadDirty = false;

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

  var PortalProfile = {
    formatMaskedIdCard: function (id) {
      var digits = String(id || '').replace(/\D/g, '');
      if (digits.length !== 13) return id || '-';
      return digits[0] + '-' + digits.slice(1, 5) + '-' + digits.slice(5, 10) + '-' + digits.slice(10, 12) + '-' + digits[12];
    },

    renderProfilePage: function () {
      var content = (global.PortalState && global.PortalState.getContentEl)
        ? global.PortalState.getContentEl()
        : document.getElementById('content');
      if (!content) return;
      var state = getState();
      var u = state.user || {};

      var prefixes = (global.PortalCascade ? global.PortalCascade.getReferenceItems('PREFIX') : []).map(function (x) { return x.value; });
      var bureaus = (global.PortalCascade ? global.PortalCascade.getReferenceItems('BUREAU') : []).map(function (x) { return x.value; });
      if (bureaus.length === 0) bureaus = ['สำนักเทศกิจ'];
      var posTypes = global.PortalCascade ? global.PortalCascade.getPositionTypes() : [];

      var photoUrl = (global.PortalState && global.PortalState.resolveDriveImg)
        ? global.PortalState.resolveDriveImg(
            u.Photo_URL || u.photoUrl,
            'https://pr-bangkok.com/wp-content/uploads/2025/06/231116_BMA-Emblem_Edited_Green-600x600.png'
          )
        : (u.Photo_URL || u.photoUrl || '');

      var sigUrl = (global.PortalState && global.PortalState.resolveDriveImg)
        ? global.PortalState.resolveDriveImg(u.Signature_URL || u.signatureUrl, '')
        : (u.Signature_URL || u.signatureUrl || '');

      var canChangeUsername = !u.username_changed && !u.Username_Changed;
      var usernameFieldHtml = canChangeUsername
        ? '<div><label class="lbl">ชื่อผู้ใช้งาน (Username) <span class="text-xs accent font-normal">(แก้ไขได้ครั้งเดียว)</span></label><input id="pf_username" class="inp" value="' + esc(u.Username || u.username || '') + '"></div>'
        : '<div><label class="lbl">ชื่อผู้ใช้งาน (Username) <span class="text-xs muted font-normal">(แก้ไขไปแล้ว)</span></label><input id="pf_username" class="inp" value="' + esc(u.Username || u.username || '') + '" disabled style="background:var(--surface2);"></div>';

      var secBarFn = (global.PortalState && global.PortalState.sectionBar) ? global.PortalState.sectionBar : function (t) { return '<h2>' + t + '</h2>'; };
      var buildOptFn = global.PortalCascade ? global.PortalCascade.buildOptionsHtml : function () { return ''; };

      content.innerHTML = ''
        + secBarFn('ข้อมูลโปรไฟล์และลายเซ็นอิเล็กทรอนิกส์', '', 'id-card')
        + '<div class="grid lg:grid-cols-3 gap-6 items-start">'
        // Left Column: Avatar & Signature
        + '  <div class="space-y-6">'
        + '    <div class="card p-6 text-center">'
        + '      <img id="pfAvatarPreview" src="' + esc(photoUrl) + '" alt="Profile" class="w-28 h-28 rounded-full object-cover mx-auto mb-3 border-4 border-[#007B3E] bg-white shadow-md">'
        + '      <h3 class="font-bold text-lg">' + esc(u.FullName || u.fullName) + '</h3>'
        + '      <p class="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 mt-1"><i data-lucide="credit-card" class="w-3.5 h-3.5 inline mr-1 opacity-70"></i>' + esc(PortalProfile.formatMaskedIdCard(u.Id_Card || u.id_card_number || u.idCardNumber)) + '</p>'
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
        // Right Column: Personal Edit Form
        + '  <div class="lg:col-span-2">'
        + '    <div class="card p-6">'
        + '      <h4 class="font-bold text-base mb-4 flex items-center gap-2"><i data-lucide="user-pen" class="w-4 h-4 accent"></i> แก้ไขข้อมูลส่วนบุคคล</h4>'
        + '      <form onsubmit="PORTAL_APP.submitProfileUpdate(event)" class="space-y-4">'
        + '        <div class="grid grid-cols-2 gap-4">'
        + usernameFieldHtml
        + '          <div><label class="lbl">อีเมล (Email) *</label><input id="pf_email" type="email" class="inp" value="' + esc(u.Email || u.email) + '" required></div>'
        + '        </div>'
        + '        <div class="grid grid-cols-3 gap-3">'
        + '          <div><label class="lbl">คำนำหน้า *</label><select id="pf_prefix" class="inp" required>' + buildOptFn(prefixes, u.Prefix || u.prefix) + '</select></div>'
        + '          <div><label class="lbl">ชื่อจริง *</label><input id="pf_first_name" class="inp" value="' + esc(u.FirstName || u.firstName) + '" required></div>'
        + '          <div><label class="lbl">นามสกุล *</label><input id="pf_last_name" class="inp" value="' + esc(u.LastName || u.lastName) + '" required></div>'
        + '        </div>'
        + '        <div class="grid grid-cols-3 gap-3">'
        + '          <div><label class="lbl">ประเภทตำแหน่ง</label><select id="pf_position_type" class="inp">' + buildOptFn(posTypes, u.Position_Type || u.positionType) + '</select></div>'
        + '          <div><label class="lbl">สายงาน/ตำแหน่ง</label><select id="pf_position" class="inp"></select></div>'
        + '          <div><label class="lbl">ระดับตำแหน่ง</label><select id="pf_position_level" class="inp"></select></div>'
        + '        </div>'
        + '        <div class="grid grid-cols-3 gap-3">'
        + '          <div><label class="lbl">สำนัก</label><select id="pf_bureau_name" class="inp">' + buildOptFn(bureaus, u.Bureau_Name || u.bureauName || 'สำนักเทศกิจ') + '</select></div>'
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

      if (global.PortalCascade) {
        global.PortalCascade.bindOrgAndPositionCascade('pf', {
          position: u.Position || u.position,
          position_level: u.Position_Level || u.positionLevel,
          office: u.Office || u.office,
          department: u.Department || u.department,
          division: u.Division || u.division
        });
      }

      PortalProfile.initSignaturePad();
      icons();
    },

    initSignaturePad: function () {
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
    },

    clearSignaturePad: function () {
      var canvas = document.getElementById('pfSigCanvas');
      if (!canvas || !sigPadCtx) return;
      sigPadCtx.clearRect(0, 0, canvas.width, canvas.height);
      sigPadDirty = false;
    },

    saveCanvasSignature: async function () {
      var canvas = document.getElementById('pfSigCanvas');
      if (!canvas || !sigPadDirty) {
        global.PortalUI.alertError('กรุณาเซ็นชื่อลงในช่องก่อนบันทึก');
        return;
      }
      var state = getState();
      try {
        var dataUrl = canvas.toDataURL('image/png');
        var folderId = (state.settings && state.settings.Signature_Folder_ID) || '';
        var pid = (state.user && (state.user.Personnel_ID || state.user.personnelId)) || 'USER';

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
        state.user = saveRes.user;
        global.PortalUI.toast('บันทึกลายเซ็นอิเล็กทรอนิกส์เรียบร้อยแล้ว');
        PortalProfile.renderProfilePage();
      } catch (err) {
        global.PortalUI.alertError(err.message);
      }
    },

    handleUploadProfilePhoto: async function (ev) {
      var file = ev.target && ev.target.files && ev.target.files[0];
      if (!file) return;
      var state = getState();
      try {
        var folderId = (state.settings && state.settings.Profile_Folder_ID) || '';
        var pid = (state.user && (state.user.Personnel_ID || state.user.personnelId)) || 'USER';
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
        state.user = saveRes.user;
        global.PortalUI.renderHeaderUser();
        PortalProfile.renderProfilePage();
        global.PortalUI.toast('อัปเดตรูปโปรไฟล์สำเร็จ');
      } catch (err) {
        global.PortalUI.alertError(err.message);
      }
    },

    handleUploadSignatureFile: async function (ev) {
      var file = ev.target && ev.target.files && ev.target.files[0];
      if (!file) return;
      var state = getState();
      try {
        var folderId = (state.settings && state.settings.Signature_Folder_ID) || '';
        var pid = (state.user && (state.user.Personnel_ID || state.user.personnelId)) || 'USER';
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
        state.user = saveRes.user;
        PortalProfile.renderProfilePage();
        global.PortalUI.toast('อัปเดตไฟล์ลายเซ็นสำเร็จ');
      } catch (err) {
        global.PortalUI.alertError(err.message);
      }
    },

    submitProfileUpdate: async function (ev) {
      if (ev) ev.preventDefault();
      var state = getState();
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
        var oldUname = String((state.user && (state.user.Username || state.user.username)) || '').trim().toLowerCase();
        if (newUname && newUname !== oldUname) {
          payload.username = newUname;
        }
      }

      try {
        var res = await global.LOADER.busy(
          global.PORTAL_API.updateMyProfile(payload),
          'กำลังบันทึกข้อมูลโปรไฟล์...'
        );
        state.user = res.user;
        global.PortalUI.renderHeaderUser();
        PortalProfile.renderProfilePage();
        global.PortalUI.toast(res.message || 'บันทึกข้อมูลส่วนตัวสำเร็จ');
      } catch (err) {
        global.PortalUI.alertError(err.message);
      }
    }
  };

  global.PortalProfile = PortalProfile;
})(window);

