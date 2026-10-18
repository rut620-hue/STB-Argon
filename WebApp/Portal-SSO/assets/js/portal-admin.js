/**
 * =============================================================================
 * STB APP n2 — Central Portal Admin & Superadmin Module (assets/js/portal-admin.js)
 * =============================================================================
 * 100% Faithful Reference Alignment with ref_122wc
 * - UI Atoms: sectionBar(), statCard(), table.tbl (th()), .btn-primary, .btn-ghost, .chip
 * - Lucide Icons everywhere + lucide.createIcons() on every render & modal
 * - 6 Comprehensive Modules:
 *   1. #personnel : ทะเบียนบุคลากร (Cascading Dropdowns, Filter, Search, Drive Upload)
 *   2. #users     : บัญชีผู้ใช้งาน & สิทธิ์ (First-Time Setup Bypass Auto-Lock + Per-App Access)
 *   3. #webapps   : เว็บแอปย่อย (SSO Registry & Icon Upload)
 *   4. #reference : โครงสร้างสังกัด 4 ระดับ & คำนำหน้าชื่อ (Reorder ▲▼ & Batch Add)
 *   5. #positions : โครงสร้างสายงาน/ตำแหน่ง 6 ประเภท (Reorder ▲▼ & Batch Add)
 *   6. #settings  : ตั้งค่าระบบ 13 Keys + ทดสอบ Google Drive Folder + รีเซ็ตข้อมูล 2 โหมด
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
    currentRefTab: 'PREFIX',
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

  // ===========================================================================
  // 1. โมดูลทำเนียบบุคลากร (#personnel)
  // ===========================================================================
  async function loadPersonnelData(silent) {
    try {
      var res = await getApi().listPersonnel(silent);
      var list = (res && (res.personnel || res.data)) || [];
      ADMIN_STATE.personnel = list;
      return list;
    } catch (err) {
      alertError('ไม่สามารถโหลดข้อมูลบุคลากรได้: ' + err.message);
      return [];
    }
  }

  function renderPersonnelPage() {
    var app = getApp();
    if (!app) return;
    app.setPageHeader('ทำเนียบบุคลากร', 'จัดการฐานข้อมูลบุคลากร ค้นหา กรองสถานะ และอัปโหลดรูปภาพ/ลายเซ็นลง Google Drive', 'users');

    var pageBody = getPageBody();
    if (!pageBody) return;

    var sSearch = (ADMIN_STATE.personnelSearch || '').toLowerCase();
    var sStatus = ADMIN_STATE.personnelStatusFilter || '';

    var filtered = (ADMIN_STATE.personnel || []).filter(function (p) {
      if (sStatus && p.status !== sStatus) return false;
      if (!sSearch) return true;
      var matchStr = [
        p.personnel_id,
        p.id_card_number,
        p.prefix,
        p.first_name,
        p.last_name,
        p.full_name,
        p.position,
        p.position_level,
        p.office,
        p.department,
        p.division
      ].join(' ').toLowerCase();
      return matchStr.indexOf(sSearch) !== -1;
    });

    var rowsHtml = '';
    if (filtered.length === 0) {
      rowsHtml = '<tr><td colspan="8" class="text-center py-10 muted"><i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i><div class="text-sm">ไม่พบข้อมูลบุคลากรตรงตามเงื่อนไข</div></td></tr>';
    } else {
      filtered.forEach(function (p, idx) {
        var photoSrc = resolveDriveImg(p.photo_url, 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png');
        var chipStatus = (p.status === 'ช่วยราชการ')
          ? '<span class="badge" style="background:rgba(255,179,0,.15);color:var(--amber)">' + esc(p.status) + '</span>'
          : (p.status === 'พ้นสภาพ'
            ? '<span class="badge" style="background:rgba(229,57,53,.15);color:var(--red)">' + esc(p.status) + '</span>'
            : '<span class="badge chip">' + esc(p.status || 'ทำงานอยู่') + '</span>');

        var accountBadge = p.has_user_account
          ? '<span class="badge chip" title="ชื่อผู้ใช้: ' + esc(p.username) + '"><i data-lucide="user-check" class="w-3 h-3"></i> ' + esc(p.username) + '</span>'
          : '<button type="button" class="btn-ghost !py-0.5 !px-2 !text-[11px]" onclick="PORTAL_ADMIN.quickCreateAccountForPersonnel(\'' + esc(p.personnel_id) + '\')" title="คลิกเพื่อผูกบัญชี"><i data-lucide="user-plus" class="w-3 h-3"></i> ผูกบัญชี</button>';

        rowsHtml += ''
          + '<tr>'
          + '  <td class="text-center muted">' + (idx + 1) + '</td>'
          + '  <td class="text-center">'
          + '    <img src="' + esc(photoSrc) + '" alt="Profile" class="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 mx-auto bg-white">'
          + '  </td>'
          + '  <td>'
          + '    <div class="font-bold text-slate-800 dark:text-slate-100">' + esc(p.full_name || ((p.prefix || '') + p.first_name + ' ' + p.last_name)) + '</div>'
          + '    <div class="text-[11px] muted flex items-center gap-1 mt-0.5"><i data-lucide="id-card" class="w-3 h-3"></i> ' + esc(p.id_card_number) + ' &bull; <code>' + esc(p.personnel_id) + '</code></div>'
          + '  </td>'
          + '  <td>'
          + '    <div class="font-medium">' + esc(p.position || '-') + '</div>'
          + '    <div class="text-[11px] muted">' + esc(p.position_level || 'ไม่มีระดับ') + (p.position_type ? ' (' + esc(p.position_type) + ')' : '') + '</div>'
          + '  </td>'
          + '  <td>'
          + '    <div>' + esc(p.office || '-') + '</div>'
          + '    <div class="text-[11px] muted">' + esc(p.department || '-') + (p.division ? ' / ' + esc(p.division) : '') + '</div>'
          + '  </td>'
          + '  <td>' + accountBadge + '</td>'
          + '  <td>' + chipStatus + '</td>'
          + '  <td class="text-right">'
          + '    <div class="inline-flex gap-1">'
          + '      <button type="button" class="btn-ghost !p-1.5" onclick="PORTAL_ADMIN.openPersonnelModal(\'' + esc(p.personnel_id) + '\')" title="แก้ไขข้อมูล"><i data-lucide="pencil" class="w-3.5 h-3.5 text-amber-500"></i></button>'
          + '      <button type="button" class="btn-ghost !p-1.5" onclick="PORTAL_ADMIN.deletePersonnel(\'' + esc(p.personnel_id) + '\', \'' + esc(p.full_name) + '\')" title="ลบข้อมูล"><i data-lucide="trash-2" class="w-3.5 h-3.5 text-red-500"></i></button>'
          + '    </div>'
          + '  </td>'
          + '</tr>';
      });
    }

    var toolsHtml = ''
      + '<button type="button" class="btn-ghost" onclick="PORTAL_ADMIN.refreshPersonnel()"><i data-lucide="refresh-cw" class="w-4 h-4"></i> รีเฟรช</button>'
      + '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.openPersonnelModal()"><i data-lucide="user-plus" class="w-4 h-4"></i> เพิ่มบุคลากร</button>';

    var sectionHeader = app.sectionBar('ทำเนียบบุคลากร (Personnel Management)', toolsHtml, 'users');

    var filterCard = ''
      + '<div class="card p-3 mb-4">'
      + '  <div class="flex flex-wrap gap-3 items-center justify-between">'
      + '    <div class="flex flex-wrap gap-2 items-center flex-1 max-w-xl">'
      + '      <div class="relative flex-1 min-w-[220px]">'
      + '        <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 muted"></i>'
      + '        <input type="text" id="personnelSearchInput" class="inp pl-9 !py-1.5 text-xs" placeholder="ค้นหาชื่อ, เลขบัตร, ตำแหน่ง, สังกัด..." value="' + esc(ADMIN_STATE.personnelSearch) + '">'
      + '      </div>'
      + '      <select id="personnelStatusSelect" class="inp !py-1.5 !w-auto text-xs">'
      + '        <option value="">-- ทุกสถานะ --</option>'
      + '        <option value="ทำงานอยู่"' + (sStatus === 'ทำงานอยู่' ? ' selected' : '') + '>ทำงานอยู่</option>'
      + '        <option value="ช่วยราชการ"' + (sStatus === 'ช่วยราชการ' ? ' selected' : '') + '>ช่วยราชการ</option>'
      + '        <option value="พ้นสภาพ"' + (sStatus === 'พ้นสภาพ' ? ' selected' : '') + '>พ้นสภาพ</option>'
      + '      </select>'
      + '    </div>'
      + '    <div class="text-xs muted">แสดง <b>' + filtered.length + '</b> จาก ' + (ADMIN_STATE.personnel || []).length + ' คน</div>'
      + '  </div>'
      + '</div>';

    var tableHtml = ''
      + '<div class="card overflow-hidden">'
      + '  <div class="overflow-x-auto">'
      + '    <table class="tbl min-w-[1000px]">'
      + '      <thead>'
      + '        <tr>'
      + app.th('#', 'no')
      + app.th('รูปถ่าย', 'file')
      + app.th('ชื่อ-นามสกุล / เลขประจำตัว', 'name')
      + app.th('ตำแหน่ง / สายงาน', 'position')
      + app.th('สังกัด / หน่วยงาน', 'unit')
      + app.th('บัญชีผู้ใช้', 'user')
      + app.th('สถานะ', 'status')
      + app.th('จัดการ', 'action')
      + '        </tr>'
      + '      </thead>'
      + '      <tbody>' + rowsHtml + '</tbody>'
      + '    </table>'
      + '  </div>'
      + '</div>';

    pageBody.innerHTML = sectionHeader + filterCard + tableHtml;

    var sInp = document.getElementById('personnelSearchInput');
    if (sInp) {
      sInp.addEventListener('input', function (e) {
        ADMIN_STATE.personnelSearch = e.target.value;
        renderPersonnelPage();
      });
    }

    var sSel = document.getElementById('personnelStatusSelect');
    if (sSel) {
      sSel.addEventListener('change', function (e) {
        ADMIN_STATE.personnelStatusFilter = e.target.value;
        renderPersonnelPage();
      });
    }

    triggerIcons();
  }

  function openPersonnelModal(personnelId) {
    var app = getApp();
    if (!app) return;
    var item = null;
    if (personnelId) {
      item = (ADMIN_STATE.personnel || []).find(function (p) { return p.personnel_id === personnelId; });
    }

    var isEdit = !!item;
    var p = item || {};

    var prefixes = app.getReferenceItems('PREFIX').map(function (x) { return x.value; });
    var bureaus = app.getReferenceItems('BUREAU').map(function (x) { return x.value; });
    if (bureaus.length === 0) bureaus = ['สำนักเทศกิจ'];
    var posTypes = app.getPositionTypes();

    var photoPreview = resolveDriveImg(p.photo_url, 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png');
    var signPreview = resolveDriveImg(p.signature_url, '');

    var bodyHtml = ''
      + '<form id="admPsnForm" onsubmit="event.preventDefault();" class="space-y-4">'
      + '  <input type="hidden" id="adm_p_id" value="' + esc(p.personnel_id || '') + '">'
      + '  <input type="hidden" id="adm_p_photo_url" value="' + esc(p.photo_url || '') + '">'
      + '  <input type="hidden" id="adm_p_signature_url" value="' + esc(p.signature_url || '') + '">'
      + '  <div class="grid grid-cols-3 gap-3">'
      + '    <div><label class="lbl">คำนำหน้า *</label><select id="adm_p_prefix" class="inp" required>' + app.buildOptionsHtml(prefixes, p.prefix, '-- เลือก --') + '</select></div>'
      + '    <div><label class="lbl">ชื่อจริง *</label><input type="text" id="adm_p_first_name" class="inp" value="' + esc(p.first_name || '') + '" required></div>'
      + '    <div><label class="lbl">นามสกุล *</label><input type="text" id="adm_p_last_name" class="inp" value="' + esc(p.last_name || '') + '" required></div>'
      + '  </div>'
      + '  <div class="grid grid-cols-2 gap-3">'
      + '    <div><label class="lbl">เลขประจำตัวประชาชน (13 หลัก) *</label><input type="text" id="adm_p_id_card" maxlength="13" class="inp" value="' + esc(p.id_card_number || '') + '"' + (isEdit ? ' readonly style="background:var(--surface2);"' : ' required') + '></div>'
      + '    <div><label class="lbl">สถานะการทำงาน *</label>'
      + '      <select id="adm_p_status" class="inp" required>'
      + '        <option value="ทำงานอยู่"' + (p.status === 'ทำงานอยู่' || !p.status ? ' selected' : '') + '>ทำงานอยู่</option>'
      + '        <option value="ช่วยราชการ"' + (p.status === 'ช่วยราชการ' ? ' selected' : '') + '>ช่วยราชการ</option>'
      + '        <option value="พ้นสภาพ"' + (p.status === 'พ้นสภาพ' ? ' selected' : '') + '>พ้นสภาพ</option>'
      + '      </select>'
      + '    </div>'
      + '  </div>'
      + '  <div class="p-3.5 rounded-xl soft space-y-3">'
      + '    <div class="font-bold text-xs muted uppercase tracking-wider flex items-center gap-1.5"><i data-lucide="briefcase" class="w-3.5 h-3.5 accent"></i> ตำแหน่งและโครงสร้างหน่วยงาน</div>'
      + '    <div class="grid grid-cols-3 gap-3">'
      + '      <div><label class="lbl">ประเภทตำแหน่ง</label><select id="adm_p_position_type" class="inp">' + app.buildOptionsHtml(posTypes, p.position_type || 'ประเภททั่วไป') + '</select></div>'
      + '      <div><label class="lbl">สายงาน/ตำแหน่ง *</label><select id="adm_p_position" class="inp" required></select></div>'
      + '      <div><label class="lbl">ระดับตำแหน่ง</label><select id="adm_p_position_level" class="inp"></select></div>'
      + '    </div>'
      + '    <div class="grid grid-cols-3 gap-3">'
      + '      <div><label class="lbl">สำนัก</label><select id="adm_p_bureau_name" class="inp">' + app.buildOptionsHtml(bureaus, p.bureau_name || 'สำนักเทศกิจ') + '</select></div>'
      + '      <div><label class="lbl">สำนักงาน/กอง *</label><select id="adm_p_office" class="inp" required></select></div>'
      + '      <div><label class="lbl">ฝ่าย/ส่วน *</label><select id="adm_p_department" class="inp" required></select></div>'
      + '    </div>'
      + '    <div class="grid grid-cols-2 gap-3">'
      + '      <div><label class="lbl">กลุ่มงาน</label><select id="adm_p_division" class="inp"></select></div>'
      + '      <div><label class="lbl">ตำแหน่งอื่น/รักษาการ (ถ้ามี)</label><input type="text" id="adm_p_position_2" class="inp" value="' + esc(p.position_2 || '') + '"></div>'
      + '    </div>'
      + '  </div>'
      + '  <div class="grid grid-cols-2 gap-3">'
      + '    <div><label class="lbl">ปีที่เริ่มรับราชการ (พ.ศ.)</label><input type="number" id="adm_p_start_year" class="inp" placeholder="เช่น 2558" value="' + esc(p.start_service_year_be || '') + '"></div>'
      + '    <div><label class="lbl">เงินเดือนปัจจุบัน (บาท)</label><input type="number" step="0.01" id="adm_p_salary" class="inp" placeholder="เช่น 28500" value="' + esc(p.current_salary || '') + '"></div>'
      + '  </div>'
      + '  <div class="grid grid-cols-2 gap-4 p-3.5 rounded-xl soft">'
      + '    <div>'
      + '      <label class="lbl">รูปถ่ายบุคลากร</label>'
      + '      <div class="flex items-center gap-3">'
      + '        <img id="adm_p_photo_preview" src="' + esc(photoPreview) + '" alt="Preview" class="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700 bg-white">'
      + '        <input type="file" id="adm_p_photo_file" accept="image/*" class="text-xs">'
      + '      </div>'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">ไฟล์ภาพลายเซ็น</label>'
      + '      <div class="flex items-center gap-3">'
      + '        <div class="w-20 h-12 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center p-1 bg-white">'
      + (signPreview ? '<img id="adm_p_sig_preview" src="' + esc(signPreview) + '" class="max-h-full max-w-full object-contain">' : '<span class="text-[10px] muted">ไม่มีลายเซ็น</span>')
      + '        </div>'
      + '        <input type="file" id="adm_p_sig_file" accept="image/*" class="text-xs">'
      + '      </div>'
      + '    </div>'
      + '  </div>'
      + '</form>';

    var footerHtml = ''
      + '<button type="button" class="btn-ghost" onclick="PORTAL_APP.closeModal()">ยกเลิก</button>'
      + '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.submitPersonnelModal()"><i data-lucide="save" class="w-4 h-4"></i> บันทึกข้อมูล</button>';

    var title = isEdit ? 'แก้ไขข้อมูลบุคลากร (' + esc(p.personnel_id) + ')' : 'เพิ่มข้อมูลบุคลากรใหม่';
    app.openModal(title, bodyHtml, footerHtml, '760px', 'user-pen');

    app.bindOrgAndPositionCascade('adm_p', {
      position: p.position,
      position_level: p.position_level,
      office: p.office,
      department: p.department,
      division: p.division
    });

    triggerIcons();
  }

  async function submitPersonnelModal() {
    var app = getApp();
    if (!app) return;

    var idCard = (document.getElementById('adm_p_id_card').value || '').trim();
    var firstName = (document.getElementById('adm_p_first_name').value || '').trim();
    var lastName = (document.getElementById('adm_p_last_name').value || '').trim();
    var prefix = document.getElementById('adm_p_prefix').value;
    var position = document.getElementById('adm_p_position').value;
    var office = document.getElementById('adm_p_office').value;
    var department = document.getElementById('adm_p_department').value;

    if (!idCard || !firstName || !lastName || !prefix || !position || !office || !department) {
      alertError('กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน');
      return;
    }

    if (!/^\d{13}$/.test(idCard)) {
      alertError('เลขประจำตัวประชาชนต้องเป็นตัวเลข 13 หลัก');
      return;
    }

    var photoFile = document.getElementById('adm_p_photo_file').files[0];
    var sigFile = document.getElementById('adm_p_sig_file').files[0];

    try {
      if (photoFile && global.STB_DRIVE) {
        var folderId = (app.STATE.settings && app.STATE.settings.Profile_Folder_ID) || '';
        var photoRes = await global.LOADER.busy(
          global.STB_DRIVE.uploadToDrive(photoFile, {
            folderId: folderId,
            fileName: 'PROFILE_' + idCard + '_' + Date.now()
          }),
          'กำลังอัปโหลดรูปโปรไฟล์ลง Google Drive...'
        );
        var finalUrl = photoRes.lh3Url || photoRes.fileUrl || '';
        if (finalUrl) document.getElementById('adm_p_photo_url').value = finalUrl;
      }

      if (sigFile && global.STB_DRIVE) {
        var folderId2 = (app.STATE.settings && app.STATE.settings.Signature_Folder_ID) || '';
        var sigRes = await global.LOADER.busy(
          global.STB_DRIVE.uploadToDrive(sigFile, {
            folderId: folderId2,
            fileName: 'SIGNATURE_' + idCard + '_' + Date.now()
          }),
          'กำลังอัปโหลดลายเซ็นลง Google Drive...'
        );
        var finalUrl2 = sigRes.lh3Url || sigRes.fileUrl || '';
        if (finalUrl2) document.getElementById('adm_p_signature_url').value = finalUrl2;
      }
    } catch (upErr) {
      alertError('อัปโหลดไฟล์ไม่สำเร็จ: ' + upErr.message);
      return;
    }

    var payload = {
      personnel_id: document.getElementById('adm_p_id').value || undefined,
      id_card_number: idCard,
      prefix: prefix,
      first_name: firstName,
      last_name: lastName,
      status: document.getElementById('adm_p_status').value,
      position_type: document.getElementById('adm_p_position_type').value,
      position: position,
      position_level: document.getElementById('adm_p_position_level').value,
      position_2: (document.getElementById('adm_p_position_2').value || '').trim(),
      bureau_name: document.getElementById('adm_p_bureau_name').value,
      office: office,
      department: department,
      division: document.getElementById('adm_p_division').value,
      start_service_year_be: document.getElementById('adm_p_start_year').value ? parseInt(document.getElementById('adm_p_start_year').value, 10) : null,
      current_salary: document.getElementById('adm_p_salary').value ? parseFloat(document.getElementById('adm_p_salary').value) : null,
      photo_url: document.getElementById('adm_p_photo_url').value,
      signature_url: document.getElementById('adm_p_signature_url').value
    };

    try {
      var res = await getApi().savePersonnel(payload);
      toast(res.message || 'บันทึกข้อมูลบุคลากรสำเร็จ');
      app.closeModal();
      await loadPersonnelData(true);
      renderPersonnelPage();
    } catch (err) {
      alertError(err.message || 'ไม่สามารถบันทึกข้อมูลบุคลากรได้');
    }
  }

  async function deletePersonnel(personnelId, fullName) {
    var confirmed = await getApp().confirmAction({
      title: 'ยืนยันการลบข้อมูลบุคลากร?',
      text: 'ต้องการลบข้อมูลของ ' + (fullName || personnelId) + ' ออกจากทำเนียบหรือไม่? (หากมีบัญชีผู้ใช้งาน บัญชีจะถูกยกเลิกการผูกด้วย)',
      confirmText: 'ลบข้อมูล',
      cancelText: 'ยกเลิก',
      confirmColor: '#E53935'
    });
    if (!confirmed) return;

    try {
      var res = await getApi().deletePersonnel(personnelId);
      toast(res.message || 'ลบข้อมูลบุคลากรสำเร็จ');
      await loadPersonnelData(true);
      renderPersonnelPage();
    } catch (err) {
      alertError(err.message || 'ไม่สามารถลบข้อมูลบุคลากรได้');
    }
  }

  // ===========================================================================
  // 2. โมดูลจัดการผู้ใช้งานและสิทธิ์ (#users)
  // ===========================================================================
  async function loadUsersData(silent) {
    try {
      var res = await getApi().listUsers(silent);
      var list = (res && (res.users || res.data)) || [];
      ADMIN_STATE.users = list;
      return list;
    } catch (err) {
      alertError('ไม่สามารถโหลดรายการผู้ใช้งานได้: ' + err.message);
      return [];
    }
  }

  function renderUsersPage() {
    var app = getApp();
    if (!app) return;
    app.setPageHeader('จัดการบัญชีผู้ใช้งานและสิทธิ์', 'ผูกบัญชีผู้ใช้กับบุคลากร กำหนดบทบาทสิทธิ์ (SUPERADMIN / ADMIN / USER) และสิทธิ์การเข้าใช้งานเว็บแอปย่อยรายบุคคล', 'shield-check');

    var pageBody = getPageBody();
    if (!pageBody) return;

    var sSearch = (ADMIN_STATE.usersSearch || '').toLowerCase();
    var sRole = ADMIN_STATE.usersRoleFilter || '';

    var filtered = (ADMIN_STATE.users || []).filter(function (u) {
      if (sRole && u.role !== sRole) return false;
      if (!sSearch) return true;
      var matchStr = [
        u.personnel_ref_id,
        u.username,
        u.email,
        u.full_name,
        u.position,
        u.office,
        u.role,
        u.status
      ].join(' ').toLowerCase();
      return matchStr.indexOf(sSearch) !== -1;
    });

    var rowsHtml = '';
    if (filtered.length === 0) {
      rowsHtml = '<tr><td colspan="8" class="text-center py-10 muted"><i data-lucide="shield-alert" class="w-8 h-8 mx-auto mb-2 opacity-50"></i><div class="text-sm">ไม่พบข้อมูลบัญชีผู้ใช้งานตรงตามเงื่อนไข</div></td></tr>';
    } else {
      filtered.forEach(function (u, idx) {
        var photoSrc = resolveDriveImg(u.photo_url, 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png');

        var roleChip = (u.role === 'SUPERADMIN')
          ? '<span class="badge" style="background:#00351B;color:#fff;">SUPERADMIN</span>'
          : (u.role === 'ADMIN'
            ? '<span class="badge" style="background:rgba(255,179,0,.15);color:var(--amber);">ADMIN</span>'
            : '<span class="badge chip">USER</span>');

        var statusChip = (u.status === 'รออนุมัติ')
          ? '<span class="badge" style="background:rgba(255,179,0,.15);color:var(--amber);">รออนุมัติ</span>'
          : (u.status === 'ระงับการใช้งาน' || u.status === 'ระงับบัญชี'
            ? '<span class="badge" style="background:rgba(229,57,53,.15);color:var(--red);">ระงับ</span>'
            : '<span class="badge chip">' + esc(u.status || 'ใช้งานปกติ') + '</span>');

        var perms = u.permissions || {};
        var grantedCount = 0;
        Object.keys(perms).forEach(function (k) {
          if (perms[k] === 'USER' || perms[k] === 'ADMIN') grantedCount++;
        });

        rowsHtml += ''
          + '<tr>'
          + '  <td class="text-center muted">' + (idx + 1) + '</td>'
          + '  <td>'
          + '    <div class="flex items-center gap-2.5">'
          + '      <img src="' + esc(photoSrc) + '" alt="Avatar" class="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 bg-white">'
          + '      <div>'
          + '        <div class="font-bold text-slate-800 dark:text-slate-100">' + esc(u.username) + '</div>'
          + '        <div class="text-[11px] muted">' + esc(u.email) + '</div>'
          + '      </div>'
          + '    </div>'
          + '  </td>'
          + '  <td>'
          + '    <div class="font-medium">' + esc(u.full_name || '-') + '</div>'
          + '    <div class="text-[11px] muted">' + esc(u.position || '') + ' (' + esc(u.office || '-') + ')</div>'
          + '  </td>'
          + '  <td>' + roleChip + '</td>'
          + '  <td><span class="badge chip" title="มีสิทธิ์เข้าถึง ' + grantedCount + ' แอป"><i data-lucide="layers" class="w-3 h-3"></i> ' + grantedCount + ' แอป</span></td>'
          + '  <td>' + statusChip + '</td>'
          + '  <td class="text-xs muted">' + (u.last_login_at ? new Date(u.last_login_at).toLocaleString('th-TH') : '-') + '</td>'
          + '  <td class="text-right">'
          + '    <div class="inline-flex gap-1">'
          + '      <button type="button" class="btn-ghost !p-1.5" onclick="PORTAL_ADMIN.openUserModal(\'' + esc(u.personnel_ref_id) + '\')" title="แก้ไขผู้ใช้และสิทธิ์"><i data-lucide="shield" class="w-3.5 h-3.5 text-amber-500"></i></button>'
          + '      <button type="button" class="btn-ghost !p-1.5" onclick="PORTAL_ADMIN.deleteUser(\'' + esc(u.personnel_ref_id) + '\', \'' + esc(u.username) + '\')" title="ลบบัญชี"><i data-lucide="trash-2" class="w-3.5 h-3.5 text-red-500"></i></button>'
          + '    </div>'
          + '  </td>'
          + '</tr>';
      });
    }

    var isSetup = app.STATE && app.STATE.isSetupMode;
    var setupBanner = isSetup
      ? '<div class="card p-4 mb-4 border-l-4 border-amber-500 bg-amber-500/10 flex items-center gap-3">'
      + '  <i data-lucide="alert-triangle" class="w-6 h-6 text-amber-500 shrink-0"></i>'
      + '  <div>'
      + '    <div class="font-bold text-sm">โหมดตั้งค่าเริ่มต้น (Setup Bypass Mode)</div>'
      + '    <div class="text-xs muted mt-0.5">ระบบยังไม่มีบัญชี SUPERADMIN กรุณาสร้างบัญชีแรกโดยกดปุ่ม <b>"+ สร้างบัญชีผู้ใช้งาน"</b> ด้านล่าง เมื่อสร้างสำเร็จ ระบบจะปิดโหมด Bypass และล็อกอินอัตโนมัติทันที</div>'
      + '  </div>'
      + '</div>'
      : '';

    var toolsHtml = ''
      + '<button type="button" class="btn-ghost" onclick="PORTAL_ADMIN.refreshUsers()"><i data-lucide="refresh-cw" class="w-4 h-4"></i> รีเฟรช</button>'
      + '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.openUserModal()"><i data-lucide="user-plus" class="w-4 h-4"></i> สร้างบัญชีผู้ใช้งาน</button>';

    var sectionHeader = app.sectionBar('จัดการบัญชีและสิทธิ์ (Users & Permissions)', toolsHtml, 'shield-check');

    var filterCard = ''
      + '<div class="card p-3 mb-4">'
      + '  <div class="flex flex-wrap gap-3 items-center justify-between">'
      + '    <div class="flex flex-wrap gap-2 items-center flex-1 max-w-xl">'
      + '      <div class="relative flex-1 min-w-[200px]">'
      + '        <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 muted"></i>'
      + '        <input type="text" id="usersSearchInput" class="inp pl-9 !py-1.5 text-xs" placeholder="ค้นหา Username, Email, ชื่อบุคลากร..." value="' + esc(ADMIN_STATE.usersSearch) + '">'
      + '      </div>'
      + '      <select id="usersRoleSelect" class="inp !py-1.5 !w-auto text-xs">'
      + '        <option value="">-- ทุกบทบาท --</option>'
      + '        <option value="SUPERADMIN"' + (sRole === 'SUPERADMIN' ? ' selected' : '') + '>SUPERADMIN</option>'
      + '        <option value="ADMIN"' + (sRole === 'ADMIN' ? ' selected' : '') + '>ADMIN</option>'
      + '        <option value="USER"' + (sRole === 'USER' ? ' selected' : '') + '>USER</option>'
      + '      </select>'
      + '    </div>'
      + '    <div class="text-xs muted">แสดง <b>' + filtered.length + '</b> จาก ' + (ADMIN_STATE.users || []).length + ' บัญชี</div>'
      + '  </div>'
      + '</div>';

    var tableHtml = ''
      + '<div class="card overflow-hidden">'
      + '  <div class="overflow-x-auto">'
      + '    <table class="tbl min-w-[1000px]">'
      + '      <thead>'
      + '        <tr>'
      + app.th('#', 'no')
      + app.th('บัญชีผู้ใช้งาน (Username / Email)', 'user')
      + app.th('บุคลากรเจ้าของบัญชี', 'name')
      + app.th('บทบาทสิทธิ์', 'role')
      + app.th('สิทธิ์รายแอป', 'action')
      + app.th('สถานะ', 'status')
      + app.th('เข้าสู่ระบบล่าสุด', 'date')
      + app.th('จัดการ', 'action')
      + '        </tr>'
      + '      </thead>'
      + '      <tbody>' + rowsHtml + '</tbody>'
      + '    </table>'
      + '  </div>'
      + '</div>';

    pageBody.innerHTML = setupBanner + sectionHeader + filterCard + tableHtml;

    var uInp = document.getElementById('usersSearchInput');
    if (uInp) {
      uInp.addEventListener('input', function (e) {
        ADMIN_STATE.usersSearch = e.target.value;
        renderUsersPage();
      });
    }

    var uSel = document.getElementById('usersRoleSelect');
    if (uSel) {
      uSel.addEventListener('change', function (e) {
        ADMIN_STATE.usersRoleFilter = e.target.value;
        renderUsersPage();
      });
    }

    triggerIcons();
  }

  function quickCreateAccountForPersonnel(personnelId) {
    openUserModal(personnelId, true);
  }

  function openUserModal(personnelRefId, isFromPersonnelQuick) {
    var app = getApp();
    if (!app) return;

    var existingUser = null;
    if (personnelRefId && !isFromPersonnelQuick) {
      existingUser = (ADMIN_STATE.users || []).find(function (u) { return u.personnel_ref_id === personnelRefId; });
    }

    var isEdit = !!existingUser;
    var u = existingUser || {};

    var personnelOptions = '';
    (ADMIN_STATE.personnel || []).forEach(function (p) {
      var isSelected = (p.personnel_id === personnelRefId || p.personnel_id === u.personnel_ref_id);
      personnelOptions += '<option value="' + esc(p.personnel_id) + '"' + (isSelected ? ' selected' : '') + '>'
        + esc(p.full_name || (p.first_name + ' ' + p.last_name)) + ' (' + esc(p.personnel_id) + ' - ' + esc(p.position || '') + ')'
        + '</option>';
    });

    var appCheckboxes = '';
    (ADMIN_STATE.webapps || []).forEach(function (w) {
      var userPerms = u.permissions || {};
      var curLevel = userPerms[w.webapp_id] || 'USER';
      var isGranted = !!userPerms[w.webapp_id];

      appCheckboxes += ''
        + '<div class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">'
        + '  <div class="flex items-center gap-2">'
        + '    <input type="checkbox" id="perm_chk_' + esc(w.webapp_id) + '"' + (isGranted ? ' checked' : '') + ' class="rounded text-green-600">'
        + '    <label for="perm_chk_' + esc(w.webapp_id) + '" class="font-medium text-xs cursor-pointer">' + esc(w.name) + ' <code>(' + esc(w.webapp_id) + ')</code></label>'
        + '  </div>'
        + '  <select id="perm_lvl_' + esc(w.webapp_id) + '" class="inp !py-1 !px-2 !text-xs !w-auto">'
        + '    <option value="USER"' + (curLevel === 'USER' ? ' selected' : '') + '>USER</option>'
        + '    <option value="ADMIN"' + (curLevel === 'ADMIN' ? ' selected' : '') + '>ADMIN</option>'
        + '  </select>'
        + '</div>';
    });

    var bodyHtml = ''
      + '<form id="admUserForm" onsubmit="event.preventDefault();" class="space-y-4">'
      + '  <div>'
      + '    <label class="lbl">เลือกบุคลากรเจ้าของบัญชี *</label>'
      + '    <select id="adm_u_personnel_id" class="inp" required' + (isEdit ? ' disabled style="background:var(--surface2);"' : '') + '>'
      + '      <option value="">-- เลือกบุคลากร --</option>' + personnelOptions
      + '    </select>'
      + '  </div>'
      + '  <div class="grid grid-cols-2 gap-3">'
      + '    <div><label class="lbl">ชื่อผู้ใช้งาน (Username) *</label><input type="text" id="adm_u_username" class="inp" placeholder="ภาษาอังกฤษ ตัวเลข" value="' + esc(u.username || '') + '"' + (isEdit ? ' readonly style="background:var(--surface2);"' : ' required') + '></div>'
      + '    <div><label class="lbl">อีเมล (Email) *</label><input type="email" id="adm_u_email" class="inp" placeholder="user@bangkok.go.th" value="' + esc(u.email || '') + '" required></div>'
      + '  </div>'
      + '  <div class="grid grid-cols-2 gap-3">'
      + '    <div><label class="lbl">บทบาทสิทธิ์ส่วนกลาง *</label>'
      + '      <select id="adm_u_role" class="inp" required>'
      + '        <option value="USER"' + (u.role === 'USER' || !u.role ? ' selected' : '') + '>USER (บุคลากรทั่วไป)</option>'
      + '        <option value="ADMIN"' + (u.role === 'ADMIN' ? ' selected' : '') + '>ADMIN (ผู้ดูแลระบบงาน)</option>'
      + '        <option value="SUPERADMIN"' + (u.role === 'SUPERADMIN' ? ' selected' : '') + '>SUPERADMIN (ผู้ดูแลระบบสูงสุด)</option>'
      + '      </select>'
      + '    </div>'
      + '    <div><label class="lbl">สถานะบัญชี *</label>'
      + '      <select id="adm_u_status" class="inp" required>'
      + '        <option value="ใช้งานปกติ"' + (u.status === 'ใช้งานปกติ' || !u.status ? ' selected' : '') + '>ใช้งานปกติ</option>'
      + '        <option value="รออนุมัติ"' + (u.status === 'รออนุมัติ' ? ' selected' : '') + '>รออนุมัติ</option>'
      + '        <option value="ระงับการใช้งาน"' + (u.status === 'ระงับการใช้งาน' ? ' selected' : '') + '>ระงับการใช้งาน</option>'
      + '      </select>'
      + '    </div>'
      + '  </div>'
      + '  <div class="p-3.5 rounded-xl soft">'
      + '    <label class="lbl">' + (isEdit ? 'รีเซ็ตรหัสผ่านใหม่ (เว้นว่างไว้หากไม่เปลี่ยน)' : 'รหัสผ่านเริ่มต้น *') + '</label>'
      + '    <input type="password" id="adm_u_password" class="inp" placeholder="อย่างน้อย 8 ตัวอักษร"' + (isEdit ? '' : ' required') + '>'
      + '  </div>'
      + '  <div>'
      + '    <label class="lbl mb-2">กำหนดสิทธิ์เข้าถึงเว็บแอปพลิเคชันย่อย (SSO Permissions)</label>'
      + '    <div class="space-y-2 max-h-48 overflow-y-auto">' + (appCheckboxes || '<span class="text-xs muted">ยังไม่มีเว็บแอปพลิเคชันในระบบ</span>') + '</div>'
      + '  </div>'
      + '</form>';

    var footerHtml = ''
      + '<button type="button" class="btn-ghost" onclick="PORTAL_APP.closeModal()">ยกเลิก</button>'
      + '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.submitUserModal(' + (isEdit ? 'true' : 'false') + ')"><i data-lucide="save" class="w-4 h-4"></i> บันทึกข้อมูลบัญชี</button>';

    var title = isEdit ? 'แก้ไขบัญชีผู้ใช้งาน (' + esc(u.username) + ')' : 'สร้างบัญชีผู้ใช้งานและกำหนดสิทธิ์';
    app.openModal(title, bodyHtml, footerHtml, '650px', 'user-shield');
    triggerIcons();
  }

  async function submitUserModal(isEdit) {
    var pId = document.getElementById('adm_u_personnel_id').value;
    var username = (document.getElementById('adm_u_username').value || '').trim();
    var email = (document.getElementById('adm_u_email').value || '').trim();
    var role = document.getElementById('adm_u_role').value;
    var status = document.getElementById('adm_u_status').value;
    var password = document.getElementById('adm_u_password').value;

    if (!pId || !username || !email || !role || !status) {
      alertError('กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน');
      return;
    }
    if (!isEdit && !password) {
      alertError('กรุณากำหนดรหัสผ่านเริ่มต้นสำหรับบัญชีใหม่');
      return;
    }

    var permissions = {};
    (ADMIN_STATE.webapps || []).forEach(function (w) {
      var chk = document.getElementById('perm_chk_' + w.webapp_id);
      var lvl = document.getElementById('perm_lvl_' + w.webapp_id);
      if (chk && chk.checked) {
        permissions[w.webapp_id] = lvl ? lvl.value : 'USER';
      }
    });

    var payload = {
      personnel_ref_id: pId,
      username: username,
      email: email,
      role: role,
      status: status,
      permissions: permissions
    };
    if (password) payload.password = password;

    try {
      var res = await getApi().saveUser(payload);
      toast(res.message || 'บันทึกบัญชีผู้ใช้งานสำเร็จ');
      getApp().closeModal();

      if (res && res.auto_session_token) {
        toast('สร้าง SUPERADMIN สำเร็จ! เข้าสู่ระบบด้วยบัญชีของคุณทันที', 'info');
        await getApp().bootSystem();
        return;
      }

      await loadUsersData(true);
      await loadPersonnelData(true);
      renderUsersPage();
    } catch (err) {
      alertError(err.message || 'ไม่สามารถบันทึกบัญชีผู้ใช้งานได้');
    }
  }

  async function deleteUser(personnelRefId, username) {
    var confirmed = await getApp().confirmAction({
      title: 'ยืนยันการลบบัญชีผู้ใช้งาน?',
      text: 'ต้องการลบบัญชีผู้ใช้งาน @' + username + ' หรือไม่? ข้อมูลประวัติบุคลากรจะยังคงอยู่ในทำเนียบ',
      confirmText: 'ลบบัญชี',
      cancelText: 'ยกเลิก',
      confirmColor: '#E53935'
    });
    if (!confirmed) return;

    try {
      var res = await getApi().deleteUser(personnelRefId);
      toast(res.message || 'ลบบัญชีผู้ใช้งานสำเร็จ');
      await loadUsersData(true);
      await loadPersonnelData(true);
      renderUsersPage();
    } catch (err) {
      alertError(err.message || 'ไม่สามารถลบบัญชีผู้ใช้งานได้');
    }
  }

  // ===========================================================================
  // 3. โมดูลจัดการเว็บแอปพลิเคชันย่อย (#webapps)
  // ===========================================================================
  async function loadWebappsData(silent) {
    try {
      var res = await getApi().listWebapps(silent);
      var list = (res && (res.webapps || res.data)) || [];
      ADMIN_STATE.webapps = list;
      return list;
    } catch (err) {
      alertError('ไม่สามารถโหลดรายการเว็บแอปพลิเคชันได้: ' + err.message);
      return [];
    }
  }

  function renderWebappsPage() {
    var app = getApp();
    if (!app) return;
    app.setPageHeader('จัดการเว็บแอปพลิเคชันย่อย', 'ลงทะเบียนเว็บแอปพลิเคชันในระบบ กำหนด URL ปลายทาง และจัดการไอคอนสำหรับเชื่อมต่อ Single Sign-On (SSO)', 'grid');

    var pageBody = getPageBody();
    if (!pageBody) return;

    var rowsHtml = '';
    var list = ADMIN_STATE.webapps || [];
    if (list.length === 0) {
      rowsHtml = '<tr><td colspan="7" class="text-center py-10 muted"><i data-lucide="layers" class="w-8 h-8 mx-auto mb-2 opacity-50"></i><div class="text-sm">ยังไม่มีเว็บแอปพลิเคชันในระบบ</div></td></tr>';
    } else {
      list.forEach(function (w, idx) {
        var iconHtml = '';
        if (w.icon_url && w.icon_url.indexOf('fa-') !== -1) {
          iconHtml = '<i data-lucide="layers" class="w-6 h-6 text-green-600 mx-auto"></i>';
        } else if (w.icon_url) {
          iconHtml = '<img src="' + esc(resolveDriveImg(w.icon_url)) + '" alt="Icon" class="w-9 h-9 object-cover rounded-lg mx-auto bg-white border border-slate-200 dark:border-slate-700">';
        } else {
          iconHtml = '<i data-lucide="layers" class="w-6 h-6 text-green-600 mx-auto"></i>';
        }

        var statusChip = (w.status === 'เปิดใช้งาน')
          ? '<span class="badge chip">เปิดใช้งาน</span>'
          : '<span class="badge" style="background:rgba(229,57,53,.15);color:var(--red);">ปิดปรับปรุง</span>';

        rowsHtml += ''
          + '<tr>'
          + '  <td class="text-center font-bold muted">' + esc(w.sort_order || (idx + 1)) + '</td>'
          + '  <td class="text-center">' + iconHtml + '</td>'
          + '  <td><code>' + esc(w.webapp_id) + '</code></td>'
          + '  <td>'
          + '    <div class="font-bold text-slate-800 dark:text-slate-100">' + esc(w.name) + '</div>'
          + '    <div class="text-[11px] muted">' + esc(w.description || '-') + '</div>'
          + '  </td>'
          + '  <td><a href="' + esc(w.url) + '" target="_blank" class="lnk">' + esc(w.url) + '</a></td>'
          + '  <td>' + statusChip + '</td>'
          + '  <td class="text-right">'
          + '    <div class="inline-flex gap-1">'
          + '      <button type="button" class="btn-ghost !p-1.5" onclick="PORTAL_APP.launchSubApp(\'' + esc(w.webapp_id) + '\')" title="ทดสอบเปิดแอปผ่าน SSO"><i data-lucide="external-link" class="w-3.5 h-3.5 text-blue-500"></i></button>'
          + '      <button type="button" class="btn-ghost !p-1.5" onclick="PORTAL_ADMIN.openWebappModal(\'' + esc(w.webapp_id) + '\')" title="แก้ไขแอป"><i data-lucide="pencil" class="w-3.5 h-3.5 text-amber-500"></i></button>'
          + '      <button type="button" class="btn-ghost !p-1.5" onclick="PORTAL_ADMIN.deleteWebapp(\'' + esc(w.webapp_id) + '\', \'' + esc(w.name) + '\')" title="ลบแอป"><i data-lucide="trash-2" class="w-3.5 h-3.5 text-red-500"></i></button>'
          + '    </div>'
          + '  </td>'
          + '</tr>';
      });
    }

    var toolsHtml = ''
      + '<button type="button" class="btn-ghost" onclick="PORTAL_ADMIN.refreshWebapps()"><i data-lucide="refresh-cw" class="w-4 h-4"></i> รีเฟรช</button>'
      + '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.openWebappModal()"><i data-lucide="plus" class="w-4 h-4"></i> เพิ่มเว็บแอปพลิเคชัน</button>';

    var sectionHeader = app.sectionBar('จัดการเว็บแอปพลิเคชันย่อย (SSO Registry)', toolsHtml, 'grid');

    var tableHtml = ''
      + '<div class="card overflow-hidden">'
      + '  <div class="overflow-x-auto">'
      + '    <table class="tbl min-w-[900px]">'
      + '      <thead>'
      + '        <tr>'
      + app.th('ลำดับ', 'no')
      + app.th('ไอคอน', 'file')
      + app.th('รหัสแอป', 'action')
      + app.th('ชื่อเว็บแอปพลิเคชัน / รายละเอียด', 'name')
      + app.th('URL ปลายทาง', 'unit')
      + app.th('สถานะ', 'status')
      + app.th('จัดการ', 'action')
      + '        </tr>'
      + '      </thead>'
      + '      <tbody>' + rowsHtml + '</tbody>'
      + '    </table>'
      + '  </div>'
      + '</div>';

    pageBody.innerHTML = sectionHeader + tableHtml;
    triggerIcons();
  }

  function openWebappModal(webappId) {
    var app = getApp();
    if (!app) return;
    var item = null;
    if (webappId) {
      item = (ADMIN_STATE.webapps || []).find(function (w) { return w.webapp_id === webappId; });
    }

    var isEdit = !!item;
    var w = item || {};
    var title = isEdit ? 'แก้ไขเว็บแอปพลิเคชัน (' + esc(w.webapp_id) + ')' : 'เพิ่มเว็บแอปพลิเคชันใหม่';

    var bodyHtml = ''
      + '<form id="admWebappForm" onsubmit="event.preventDefault();" class="space-y-4">'
      + '  <div class="grid grid-cols-2 gap-3">'
      + '    <div><label class="lbl">รหัสเว็บแอป (Webapp ID) *</label><input type="text" id="adm_w_id" class="inp" placeholder="เช่น APP0002" value="' + esc(w.webapp_id || '') + '"' + (isEdit ? ' readonly style="background:var(--surface2);"' : ' required') + '></div>'
      + '    <div><label class="lbl">ลำดับแสดงผล (Sort Order)</label><input type="number" id="adm_w_sort" class="inp" value="' + esc(w.sort_order || 1) + '"></div>'
      + '  </div>'
      + '  <div><label class="lbl">ชื่อเว็บแอปพลิเคชัน *</label><input type="text" id="adm_w_name" class="inp" placeholder="เช่น ระบบจัดการงานสารบรรณ" value="' + esc(w.name || '') + '" required></div>'
      + '  <div><label class="lbl">คำอธิบายระบบ</label><input type="text" id="adm_w_desc" class="inp" placeholder="คำอธิบายสรุปสั้นๆ สำหรับแสดงบน Launchpad" value="' + esc(w.description || '') + '"></div>'
      + '  <div><label class="lbl">URL ปลายทาง *</label><input type="text" id="adm_w_url" class="inp" placeholder="เช่น ../sample-subapp/index.html หรือ Full URL" value="' + esc(w.url || '') + '" required></div>'
      + '  <div class="grid grid-cols-2 gap-3">'
      + '    <div><label class="lbl">URL ภาพไอคอน (หรือ Drive Image URL)</label><input type="text" id="adm_w_icon" class="inp" placeholder="วาง URL ภาพไอคอน" value="' + esc(w.icon_url || '') + '"></div>'
      + '    <div><label class="lbl">สถานะ *</label>'
      + '      <select id="adm_w_status" class="inp" required>'
      + '        <option value="เปิดใช้งาน"' + (w.status === 'เปิดใช้งาน' || !w.status ? ' selected' : '') + '>เปิดใช้งาน</option>'
      + '        <option value="ปิดปรับปรุง"' + (w.status === 'ปิดปรับปรุง' ? ' selected' : '') + '>ปิดปรับปรุง</option>'
      + '      </select>'
      + '    </div>'
      + '  </div>'
      + '  <div class="p-3.5 rounded-xl soft">'
      + '    <label class="lbl">อัปโหลดไฟล์ไอคอนภาพเข้า Google Drive (ตัวเลือก)</label>'
      + '    <input type="file" id="adm_w_icon_file" accept="image/*" class="text-xs">'
      + '  </div>'
      + '</form>';

    var footerHtml = ''
      + '<button type="button" class="btn-ghost" onclick="PORTAL_APP.closeModal()">ยกเลิก</button>'
      + '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.submitWebappModal()"><i data-lucide="save" class="w-4 h-4"></i> บันทึกข้อมูลเว็บแอป</button>';

    app.openModal(title, bodyHtml, footerHtml, '620px', 'grid');
    triggerIcons();
  }

  async function submitWebappModal() {
    var id = (document.getElementById('adm_w_id').value || '').trim();
    var name = (document.getElementById('adm_w_name').value || '').trim();
    var url = (document.getElementById('adm_w_url').value || '').trim();
    var status = document.getElementById('adm_w_status').value;
    var sortOrder = parseInt(document.getElementById('adm_w_sort').value, 10) || 1;
    var iconUrl = (document.getElementById('adm_w_icon').value || '').trim();
    var desc = (document.getElementById('adm_w_desc').value || '').trim();

    if (!id || !name || !url) {
      alertError('กรุณากรอกรหัสแอป, ชื่อแอป และ URL ปลายทาง');
      return;
    }

    var iconFile = document.getElementById('adm_w_icon_file').files[0];
    if (iconFile && global.STB_DRIVE) {
      try {
        var app = getApp();
        var folderId = (app.STATE.settings && app.STATE.settings.Profile_Folder_ID) || '';
        var upRes = await global.LOADER.busy(
          global.STB_DRIVE.uploadToDrive(iconFile, {
            folderId: folderId,
            fileName: 'APP_ICON_' + id + '_' + Date.now()
          }),
          'กำลังอัปโหลดไอคอนเว็บแอป...'
        );
        if (upRes.lh3Url || upRes.fileUrl) {
          iconUrl = upRes.lh3Url || upRes.fileUrl;
        }
      } catch (e) {
        alertError('อัปโหลดไอคอนไม่สำเร็จ: ' + e.message);
        return;
      }
    }

    var payload = {
      webapp_id: id,
      name: name,
      description: desc,
      url: url,
      icon_url: iconUrl,
      status: status,
      sort_order: sortOrder
    };

    try {
      var res = await getApi().saveWebapp(payload);
      toast(res.message || 'บันทึกเว็บแอปพลิเคชันสำเร็จ');
      getApp().closeModal();
      await loadWebappsData(true);
      renderWebappsPage();
    } catch (err) {
      alertError(err.message || 'ไม่สามารถบันทึกเว็บแอปพลิเคชันได้');
    }
  }

  async function deleteWebapp(webappId, name) {
    var confirmed = await getApp().confirmAction({
      title: 'ยืนยันการลบเว็บแอปพลิเคชัน?',
      text: 'ต้องการลบ ' + name + ' (' + webappId + ') หรือไม่? ระบบจะไม่สามารถเชื่อมต่อ SSO ไปยังแอปนี้ได้อีก',
      confirmText: 'ลบเว็บแอป',
      cancelText: 'ยกเลิก',
      confirmColor: '#E53935'
    });
    if (!confirmed) return;

    try {
      var res = await getApi().deleteWebapp(webappId);
      toast(res.message || 'ลบเว็บแอปพลิเคชันสำเร็จ');
      await loadWebappsData(true);
      renderWebappsPage();
    } catch (err) {
      alertError(err.message || 'ไม่สามารถลบเว็บแอปได้');
    }
  }

  // ===========================================================================
  // 4. โมดูลโครงสร้างสังกัด & ข้อมูลอ้างอิง (#reference)
  // ===========================================================================
  function renderReferencePage() {
    var app = getApp();
    if (!app) return;
    app.setPageHeader('โครงสร้างสังกัด & คำนำหน้า', 'จัดการข้อมูลอ้างอิง สังกัด 4 ระดับ (สำนัก, สำนักงาน, ฝ่าย, กลุ่มงาน) และคำนำหน้าชื่อ เลื่อนลำดับ และเพิ่มแบบกลุ่ม', 'network');

    var pageBody = getPageBody();
    if (!pageBody) return;

    var curTab = ADMIN_STATE.currentRefTab || 'PREFIX';
    var tabs = [
      { id: 'PREFIX', label: 'คำนำหน้าชื่อ' },
      { id: 'BUREAU', label: '1. สำนัก' },
      { id: 'OFFICE', label: '2. สำนักงาน/กอง' },
      { id: 'DEPARTMENT', label: '3. ส่วน/ฝ่าย' },
      { id: 'DIVISION', label: '4. กลุ่มงาน' }
    ];

    var tabButtonsHtml = '<div class="flex gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4 max-w-fit overflow-x-auto">';
    tabs.forEach(function (t) {
      var isActive = t.id === curTab;
      tabButtonsHtml += '<button type="button" onclick="PORTAL_ADMIN.switchRefTab(\'' + t.id + '\')" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ' + (isActive ? 'bg-[#007B3E] text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900') + '">' + esc(t.label) + '</button>';
    });
    tabButtonsHtml += '</div>';

    var parentFilterHtml = '';
    var parentVal = ADMIN_STATE.currentRefParentFilter;
    if (curTab === 'OFFICE') {
      var bureaus = (app.STATE.referenceData || []).filter(function (x) { return x.type === 'BUREAU'; });
      parentFilterHtml = '<div class="flex items-center gap-2"><span class="text-xs font-bold muted">กรองตามสำนัก:</span>'
        + '<select class="inp !py-1 !text-xs !w-auto" onchange="PORTAL_ADMIN.setRefParentFilter(this.value)">'
        + '<option value="">-- แสดงทุกสำนัก --</option>'
        + bureaus.map(function (b) { return '<option value="' + esc(b.value) + '"' + (parentVal === b.value ? ' selected' : '') + '>' + esc(b.value) + '</option>'; }).join('')
        + '</select></div>';
    } else if (curTab === 'DEPARTMENT') {
      var offices = (app.STATE.referenceData || []).filter(function (x) { return x.type === 'OFFICE'; });
      parentFilterHtml = '<div class="flex items-center gap-2"><span class="text-xs font-bold muted">กรองตามสำนักงาน:</span>'
        + '<select class="inp !py-1 !text-xs !w-auto" onchange="PORTAL_ADMIN.setRefParentFilter(this.value)">'
        + '<option value="">-- แสดงทุกสำนักงาน --</option>'
        + offices.map(function (o) { return '<option value="' + esc(o.value) + '"' + (parentVal === o.value ? ' selected' : '') + '>' + esc(o.value) + '</option>'; }).join('')
        + '</select></div>';
    } else if (curTab === 'DIVISION') {
      var depts = (app.STATE.referenceData || []).filter(function (x) { return x.type === 'DEPARTMENT'; });
      parentFilterHtml = '<div class="flex items-center gap-2"><span class="text-xs font-bold muted">กรองตามส่วน/ฝ่าย:</span>'
        + '<select class="inp !py-1 !text-xs !w-auto" onchange="PORTAL_ADMIN.setRefParentFilter(this.value)">'
        + '<option value="">-- แสดงทุกส่วน/ฝ่าย --</option>'
        + depts.map(function (d) { return '<option value="' + esc(d.value) + '"' + (parentVal === d.value ? ' selected' : '') + '>' + esc(d.value) + '</option>'; }).join('')
        + '</select></div>';
    }

    var items = (app.STATE.referenceData || []).filter(function (r) {
      if (r.type !== curTab) return false;
      if (parentVal && r.parent_value !== parentVal) return false;
      return true;
    }).sort(function (a, b) {
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

    var rowsHtml = '';
    if (items.length === 0) {
      rowsHtml = '<tr><td colspan="6" class="text-center py-10 muted"><i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i><div class="text-sm">ไม่มีข้อมูลในหมวดนี้</div></td></tr>';
    } else {
      items.forEach(function (r, idx) {
        rowsHtml += ''
          + '<tr>'
          + '  <td class="text-center font-bold muted">' + (idx + 1) + '</td>'
          + '  <td><span class="font-bold text-slate-800 dark:text-slate-100">' + esc(r.value) + '</span></td>'
          + '  <td class="text-xs muted">' + esc(r.short_name || '-') + '</td>'
          + '  <td>' + (r.parent_value ? '<span class="badge soft">' + esc(r.parent_value) + '</span>' : '<span class="text-xs muted">-</span>') + '</td>'
          + '  <td class="text-center">'
          + '    <div class="inline-flex gap-1">'
          + '      <button type="button" class="btn-ghost !p-1" onclick="PORTAL_ADMIN.moveReference(\'' + esc(r.reference_id) + '\', \'UP\')" title="เลื่อนขึ้น"><i data-lucide="arrow-up" class="w-3.5 h-3.5"></i></button>'
          + '      <button type="button" class="btn-ghost !p-1" onclick="PORTAL_ADMIN.moveReference(\'' + esc(r.reference_id) + '\', \'DOWN\')" title="เลื่อนลง"><i data-lucide="arrow-down" class="w-3.5 h-3.5"></i></button>'
          + '    </div>'
          + '  </td>'
          + '  <td class="text-right">'
          + '    <div class="inline-flex gap-1">'
          + '      <button type="button" class="btn-ghost !p-1.5" onclick="PORTAL_ADMIN.openSingleReferenceModal(\'' + esc(r.reference_id) + '\')" title="แก้ไข"><i data-lucide="pencil" class="w-3.5 h-3.5 text-amber-500"></i></button>'
          + '      <button type="button" class="btn-ghost !p-1.5" onclick="PORTAL_ADMIN.deleteReference(\'' + esc(r.reference_id) + '\', \'' + esc(r.value) + '\')" title="ลบ"><i data-lucide="trash-2" class="w-3.5 h-3.5 text-red-500"></i></button>'
          + '    </div>'
          + '  </td>'
          + '</tr>';
      });
    }

    var toolsHtml = ''
      + '<button type="button" class="btn-ghost" onclick="PORTAL_ADMIN.openBatchReferenceModal(\'' + curTab + '\')"><i data-lucide="file-plus" class="w-4 h-4"></i> เพิ่มแบบกลุ่ม</button>'
      + '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.openSingleReferenceModal()"><i data-lucide="plus" class="w-4 h-4"></i> เพิ่มรายการเดี่ยว</button>';

    var sectionHeader = app.sectionBar('โครงสร้างสังกัด & คำนำหน้าชื่อ (Reference Structure)', toolsHtml, 'network');

    var filterCard = parentFilterHtml
      ? '<div class="card p-3 mb-4">' + parentFilterHtml + '</div>'
      : '';

    var tableHtml = ''
      + '<div class="card overflow-hidden">'
      + '  <div class="overflow-x-auto">'
      + '    <table class="tbl min-w-[760px]">'
      + '      <thead>'
      + '        <tr>'
      + app.th('ลำดับ', 'no')
      + app.th('ค่าข้อมูล (Value)', 'name')
      + app.th('ชื่อย่อ (Short Name)', 'action')
      + app.th('สังกัดแม่ (Parent)', 'unit')
      + app.th('เลื่อนลำดับ', 'action')
      + app.th('จัดการ', 'action')
      + '        </tr>'
      + '      </thead>'
      + '      <tbody>' + rowsHtml + '</tbody>'
      + '    </table>'
      + '  </div>'
      + '</div>';

    pageBody.innerHTML = sectionHeader + tabButtonsHtml + filterCard + tableHtml;
    triggerIcons();
  }

  function switchRefTab(tabId) {
    ADMIN_STATE.currentRefTab = tabId;
    ADMIN_STATE.currentRefParentFilter = '';
    renderReferencePage();
  }

  function setRefParentFilter(val) {
    ADMIN_STATE.currentRefParentFilter = val;
    renderReferencePage();
  }

  async function moveReference(referenceId, direction) {
    var app = getApp();
    if (!app) return;
    var curTab = ADMIN_STATE.currentRefTab;
    var parentVal = ADMIN_STATE.currentRefParentFilter;

    var list = (app.STATE.referenceData || []).filter(function (r) {
      if (r.type !== curTab) return false;
      if (parentVal && r.parent_value !== parentVal) return false;
      return true;
    }).sort(function (a, b) {
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

    var idx = list.findIndex(function (x) { return x.reference_id === referenceId; });
    if (idx === -1) return;
    var targetIdx = (direction === 'UP') ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    var itemA = list[idx];
    var itemB = list[targetIdx];

    var sortA = itemA.sort_order || (idx + 1);
    var sortB = itemB.sort_order || (targetIdx + 1);
    if (sortA === sortB) {
      sortA = idx + 1;
      sortB = targetIdx + 1;
    }

    try {
      await getApi().saveReferenceData({ reference_id: itemA.reference_id, sort_order: sortB });
      await getApi().saveReferenceData({ reference_id: itemB.reference_id, sort_order: sortA });

      itemA.sort_order = sortB;
      itemB.sort_order = sortA;
      renderReferencePage();
      toast('ปรับลำดับเรียบร้อย');
    } catch (e) {
      alertError('ปรับลำดับไม่สำเร็จ: ' + e.message);
    }
  }

  function openSingleReferenceModal(referenceId) {
    var app = getApp();
    if (!app) return;
    var curTab = ADMIN_STATE.currentRefTab;
    var item = null;
    if (referenceId) {
      item = (app.STATE.referenceData || []).find(function (x) { return x.reference_id === referenceId; });
    }

    var isEdit = !!item;
    var r = item || {};
    var type = isEdit ? r.type : curTab;

    var parentType = '';
    var parentOptionsHtml = '<input type="text" id="adm_ref_parent_val" class="inp" placeholder="สังกัดแม่ (ถ้ามี)" value="' + esc(r.parent_value || '') + '">';

    if (type === 'OFFICE') {
      parentType = 'BUREAU';
      var bureaus = (app.STATE.referenceData || []).filter(function (x) { return x.type === 'BUREAU'; });
      parentOptionsHtml = '<select id="adm_ref_parent_val" class="inp">' + bureaus.map(function (b) { return '<option value="' + esc(b.value) + '"' + (r.parent_value === b.value ? ' selected' : '') + '>' + esc(b.value) + '</option>'; }).join('') + '</select>';
    } else if (type === 'DEPARTMENT') {
      parentType = 'OFFICE';
      var offices = (app.STATE.referenceData || []).filter(function (x) { return x.type === 'OFFICE'; });
      parentOptionsHtml = '<select id="adm_ref_parent_val" class="inp">' + offices.map(function (o) { return '<option value="' + esc(o.value) + '"' + (r.parent_value === o.value ? ' selected' : '') + '>' + esc(o.value) + '</option>'; }).join('') + '</select>';
    } else if (type === 'DIVISION') {
      parentType = 'DEPARTMENT';
      var depts = (app.STATE.referenceData || []).filter(function (x) { return x.type === 'DEPARTMENT'; });
      parentOptionsHtml = '<select id="adm_ref_parent_val" class="inp">' + depts.map(function (d) { return '<option value="' + esc(d.value) + '"' + (r.parent_value === d.value ? ' selected' : '') + '>' + esc(d.value) + '</option>'; }).join('') + '</select>';
    }

    var title = isEdit ? 'แก้ไขรายการอ้างอิง' : 'เพิ่มรายการอ้างอิง (' + esc(type) + ')';

    var bodyHtml = ''
      + '<form id="admRefForm" onsubmit="event.preventDefault();" class="space-y-4">'
      + '  <input type="hidden" id="adm_ref_id" value="' + esc(r.reference_id || '') + '">'
      + '  <input type="hidden" id="adm_ref_type" value="' + esc(type) + '">'
      + '  <input type="hidden" id="adm_ref_parent_type" value="' + esc(parentType) + '">'
      + '  <div><label class="lbl">ประเภทข้อมูล</label><input type="text" class="inp" value="' + esc(type) + '" readonly style="background:var(--surface2);font-weight:700;"></div>'
      + '  <div><label class="lbl">ค่าข้อมูล (ชื่อเต็ม) *</label><input type="text" id="adm_ref_val" class="inp" placeholder="เช่น ฝ่ายตรวจและบังคับการ 1" value="' + esc(r.value || '') + '" required></div>'
      + '  <div><label class="lbl">ชื่อย่อ (Short Name)</label><input type="text" id="adm_ref_short" class="inp" placeholder="เช่น ฝตบ.1" value="' + esc(r.short_name || '') + '"></div>'
      + (parentType ? '<div><label class="lbl">สังกัดหน่วยงานแม่ (' + esc(parentType) + ')</label>' + parentOptionsHtml + '</div>' : '')
      + '  <div><label class="lbl">ลำดับแสดงผล (Sort Order)</label><input type="number" id="adm_ref_sort" class="inp" value="' + esc(r.sort_order || 1) + '"></div>'
      + '</form>';

    var footerHtml = ''
      + '<button type="button" class="btn-ghost" onclick="PORTAL_APP.closeModal()">ยกเลิก</button>'
      + '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.submitSingleReferenceModal()"><i data-lucide="save" class="w-4 h-4"></i> บันทึกข้อมูล</button>';

    app.openModal(title, bodyHtml, footerHtml, '520px', 'network');
    triggerIcons();
  }

  async function submitSingleReferenceModal() {
    var val = (document.getElementById('adm_ref_val').value || '').trim();
    if (!val) {
      alertError('กรุณาระบุค่าข้อมูล');
      return;
    }

    var parentValEl = document.getElementById('adm_ref_parent_val');
    var payload = {
      reference_id: (document.getElementById('adm_ref_id').value || '').trim(),
      type: document.getElementById('adm_ref_type').value,
      value: val,
      short_name: (document.getElementById('adm_ref_short').value || '').trim(),
      parent_type: document.getElementById('adm_ref_parent_type').value,
      parent_value: parentValEl ? parentValEl.value.trim() : '',
      sort_order: parseInt(document.getElementById('adm_ref_sort').value, 10) || 1
    };

    try {
      var res = await getApi().saveReferenceData(payload);
      toast(res.message || 'บันทึกข้อมูลอ้างอิงสำเร็จ');
      getApp().closeModal();

      var bootRes = await getApi().checkSystemInit(true);
      if (bootRes && bootRes.reference_data) {
        getApp().STATE.referenceData = bootRes.reference_data;
      }
      renderReferencePage();
    } catch (err) {
      alertError(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
    }
  }

  function openBatchReferenceModal(currentType) {
    var app = getApp();
    if (!app) return;
    var type = currentType || ADMIN_STATE.currentRefTab;

    var parentType = '';
    var parentOptionsHtml = '';
    if (type === 'OFFICE') {
      parentType = 'BUREAU';
      var bureaus = (app.STATE.referenceData || []).filter(function (x) { return x.type === 'BUREAU'; });
      parentOptionsHtml = '<div><label class="lbl">สังกัดสำนักแม่ (BUREAU)</label><select id="adm_batch_ref_parent" class="inp">' + bureaus.map(function (b) { return '<option value="' + esc(b.value) + '">' + esc(b.value) + '</option>'; }).join('') + '</select></div>';
    } else if (type === 'DEPARTMENT') {
      parentType = 'OFFICE';
      var offices = (app.STATE.referenceData || []).filter(function (x) { return x.type === 'OFFICE'; });
      parentOptionsHtml = '<div><label class="lbl">สังกัดสำนักงานแม่ (OFFICE)</label><select id="adm_batch_ref_parent" class="inp">' + offices.map(function (o) { return '<option value="' + esc(o.value) + '">' + esc(o.value) + '</option>'; }).join('') + '</select></div>';
    } else if (type === 'DIVISION') {
      parentType = 'DEPARTMENT';
      var depts = (app.STATE.referenceData || []).filter(function (x) { return x.type === 'DEPARTMENT'; });
      parentOptionsHtml = '<div><label class="lbl">สังกัดฝ่ายแม่ (DEPARTMENT)</label><select id="adm_batch_ref_parent" class="inp">' + depts.map(function (d) { return '<option value="' + esc(d.value) + '">' + esc(d.value) + '</option>'; }).join('') + '</select></div>';
    }

    var title = 'เพิ่มข้อมูลอ้างอิงแบบกลุ่ม (Batch Add: ' + esc(type) + ')';

    var bodyHtml = ''
      + '<form id="admBatchRefForm" onsubmit="event.preventDefault();" class="space-y-4">'
      + '  <input type="hidden" id="adm_batch_ref_type" value="' + esc(type) + '">'
      + '  <input type="hidden" id="adm_batch_ref_parent_type" value="' + esc(parentType) + '">'
      + (parentOptionsHtml || '')
      + '  <div>'
      + '    <label class="lbl">รายการข้อมูล (วาง 1 บรรทัด ต่อ 1 รายการ) *</label>'
      + '    <p class="text-xs muted mb-1.5">สามารถระบุชื่อย่อคั่นด้วยเครื่องหมายจุลภาค <code>,</code> เช่น <code>ฝ่ายตรวจและบังคับการ 1, ฝตบ.1</code></p>'
      + '    <textarea id="adm_batch_ref_lines" class="inp" rows="8" placeholder="ฝ่ายตรวจและบังคับการ 1&#10;ฝ่ายตรวจและบังคับการ 2&#10;ฝ่ายตรวจและบังคับการ 3"></textarea>'
      + '  </div>'
      + '</form>';

    var footerHtml = ''
      + '<button type="button" class="btn-ghost" onclick="PORTAL_APP.closeModal()">ยกเลิก</button>'
      + '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.submitBatchReferenceModal()"><i data-lucide="plus-circle" class="w-4 h-4"></i> เพิ่มข้อมูลทั้งหมด</button>';

    app.openModal(title, bodyHtml, footerHtml, '580px', 'file-plus');
    triggerIcons();
  }

  async function submitBatchReferenceModal() {
    var linesStr = (document.getElementById('adm_batch_ref_lines').value || '').trim();
    if (!linesStr) {
      alertError('กรุณาระบุรายการข้อมูลอย่างน้อย 1 บรรทัด');
      return;
    }

    var type = document.getElementById('adm_batch_ref_type').value;
    var parentType = document.getElementById('adm_batch_ref_parent_type').value;
    var parentValEl = document.getElementById('adm_batch_ref_parent');
    var parentVal = parentValEl ? parentValEl.value : '';

    var lines = linesStr.split('\n');
    var items = [];
    lines.forEach(function (line) {
      var trimmed = line.trim();
      if (!trimmed) return;
      var parts = trimmed.split(',');
      items.push({
        value: parts[0].trim(),
        short_name: parts[1] ? parts[1].trim() : ''
      });
    });

    try {
      var res = await getApi().batchAddReference({
        type: type,
        parent_type: parentType,
        parent_value: parentVal,
        items: items
      });
      toast(res.message || 'เพิ่มข้อมูลอ้างอิงแบบกลุ่มสำเร็จ');
      getApp().closeModal();

      var bootRes = await getApi().checkSystemInit(true);
      if (bootRes && bootRes.reference_data) {
        getApp().STATE.referenceData = bootRes.reference_data;
      }
      renderReferencePage();
    } catch (err) {
      alertError(err.message || 'ไม่สามารถเพิ่มข้อมูลแบบกลุ่มได้');
    }
  }

  async function deleteReference(referenceId, value) {
    var confirmed = await getApp().confirmAction({
      title: 'ยืนยันการลบรายการอ้างอิง?',
      text: 'ต้องการลบ "' + value + '" หรือไม่?',
      confirmText: 'ลบข้อมูล',
      cancelText: 'ยกเลิก',
      confirmColor: '#E53935'
    });
    if (!confirmed) return;

    try {
      var res = await getApi().deleteReferenceData(referenceId);
      toast(res.message || 'ลบข้อมูลสำเร็จ');
      var bootRes = await getApi().checkSystemInit(true);
      if (bootRes && bootRes.reference_data) {
        getApp().STATE.referenceData = bootRes.reference_data;
      }
      renderReferencePage();
    } catch (err) {
      alertError(err.message || 'ไม่สามารถลบข้อมูลได้');
    }
  }

  // ===========================================================================
  // 5. โมดูลโครงสร้างสายงาน/ตำแหน่ง (#positions)
  // ===========================================================================
  function renderPositionsPage() {
    var app = getApp();
    if (!app) return;
    app.setPageHeader('โครงสร้างสายงานและตำแหน่ง', 'กำหนดประเภทตำแหน่ง 6 ประเภทของกรุงเทพมหานคร สายงาน ระดับตำแหน่ง เลื่อนลำดับ และเพิ่มแบบกลุ่ม', 'layers');

    var pageBody = getPageBody();
    if (!pageBody) return;

    var curType = ADMIN_STATE.currentPosTab || 'ผู้บริหาร';
    var posTypes = app.getPositionTypes();

    var tabButtonsHtml = '<div class="flex gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4 max-w-fit overflow-x-auto">';
    posTypes.forEach(function (t) {
      var isActive = t === curType;
      tabButtonsHtml += '<button type="button" onclick="PORTAL_ADMIN.switchPosTab(\'' + t + '\')" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ' + (isActive ? 'bg-[#007B3E] text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900') + '">' + esc(t) + '</button>';
    });
    tabButtonsHtml += '</div>';

    var items = (app.STATE.positionStructure || []).filter(function (p) {
      return p.position_type === curType;
    }).sort(function (a, b) {
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

    var rowsHtml = '';
    if (items.length === 0) {
      rowsHtml = '<tr><td colspan="5" class="text-center py-10 muted"><i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i><div class="text-sm">ไม่มีข้อมูลตำแหน่งในประเภทนี้</div></td></tr>';
    } else {
      items.forEach(function (p, idx) {
        rowsHtml += ''
          + '<tr>'
          + '  <td class="text-center font-bold muted">' + (idx + 1) + '</td>'
          + '  <td><span class="font-bold text-slate-800 dark:text-slate-100">' + esc(p.position_name) + '</span></td>'
          + '  <td>' + (p.position_level ? '<span class="badge chip">' + esc(p.position_level) + '</span>' : '<span class="text-xs muted">-</span>') + '</td>'
          + '  <td class="text-center">'
          + '    <div class="inline-flex gap-1">'
          + '      <button type="button" class="btn-ghost !p-1" onclick="PORTAL_ADMIN.movePosition(\'' + esc(p.position_id) + '\', \'UP\')" title="เลื่อนขึ้น"><i data-lucide="arrow-up" class="w-3.5 h-3.5"></i></button>'
          + '      <button type="button" class="btn-ghost !p-1" onclick="PORTAL_ADMIN.movePosition(\'' + esc(p.position_id) + '\', \'DOWN\')" title="เลื่อนลง"><i data-lucide="arrow-down" class="w-3.5 h-3.5"></i></button>'
          + '    </div>'
          + '  </td>'
          + '  <td class="text-right">'
          + '    <div class="inline-flex gap-1">'
          + '      <button type="button" class="btn-ghost !p-1.5" onclick="PORTAL_ADMIN.openSinglePositionModal(\'' + esc(p.position_id) + '\')" title="แก้ไข"><i data-lucide="pencil" class="w-3.5 h-3.5 text-amber-500"></i></button>'
          + '      <button type="button" class="btn-ghost !p-1.5" onclick="PORTAL_ADMIN.deletePosition(\'' + esc(p.position_id) + '\', \'' + esc(p.position_name) + '\')" title="ลบ"><i data-lucide="trash-2" class="w-3.5 h-3.5 text-red-500"></i></button>'
          + '    </div>'
          + '  </td>'
          + '</tr>';
      });
    }

    var toolsHtml = ''
      + '<button type="button" class="btn-ghost" onclick="PORTAL_ADMIN.openBatchPositionModal(\'' + curType + '\')"><i data-lucide="file-plus" class="w-4 h-4"></i> เพิ่มแบบกลุ่ม</button>'
      + '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.openSinglePositionModal()"><i data-lucide="plus" class="w-4 h-4"></i> เพิ่มตำแหน่งเดี่ยว</button>';

    var sectionHeader = app.sectionBar('โครงสร้างสายงานและระดับตำแหน่ง (Position Structure)', toolsHtml, 'layers');

    var tableHtml = ''
      + '<div class="card overflow-hidden">'
      + '  <div class="overflow-x-auto">'
      + '    <table class="tbl min-w-[700px]">'
      + '      <thead>'
      + '        <tr>'
      + app.th('ลำดับ', 'no')
      + app.th('ชื่อสายงาน / ตำแหน่ง', 'name')
      + app.th('ระดับตำแหน่ง', 'position')
      + app.th('เลื่อนลำดับ', 'action')
      + app.th('จัดการ', 'action')
      + '        </tr>'
      + '      </thead>'
      + '      <tbody>' + rowsHtml + '</tbody>'
      + '    </table>'
      + '  </div>'
      + '</div>';

    pageBody.innerHTML = sectionHeader + tabButtonsHtml + tableHtml;
    triggerIcons();
  }

  function switchPosTab(tabType) {
    ADMIN_STATE.currentPosTab = tabType;
    renderPositionsPage();
  }

  async function movePosition(positionId, direction) {
    var app = getApp();
    if (!app) return;
    var curType = ADMIN_STATE.currentPosTab;

    var list = (app.STATE.positionStructure || []).filter(function (p) {
      return p.position_type === curType;
    }).sort(function (a, b) {
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

    var idx = list.findIndex(function (x) { return x.position_id === positionId; });
    if (idx === -1) return;
    var targetIdx = (direction === 'UP') ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    var itemA = list[idx];
    var itemB = list[targetIdx];

    var sortA = itemA.sort_order || (idx + 1);
    var sortB = itemB.sort_order || (targetIdx + 1);
    if (sortA === sortB) {
      sortA = idx + 1;
      sortB = targetIdx + 1;
    }

    try {
      await getApi().savePositionStructure({ position_id: itemA.position_id, sort_order: sortB });
      await getApi().savePositionStructure({ position_id: itemB.position_id, sort_order: sortA });

      itemA.sort_order = sortB;
      itemB.sort_order = sortA;
      renderPositionsPage();
      toast('ปรับลำดับเรียบร้อย');
    } catch (e) {
      alertError('ปรับลำดับไม่สำเร็จ: ' + e.message);
    }
  }

  function openSinglePositionModal(positionId) {
    var app = getApp();
    if (!app) return;
    var curType = ADMIN_STATE.currentPosTab;
    var item = null;
    if (positionId) {
      item = (app.STATE.positionStructure || []).find(function (p) { return p.position_id === positionId; });
    }

    var isEdit = !!item;
    var p = item || {};
    var type = isEdit ? p.position_type : curType;
    var posTypes = app.getPositionTypes();

    var title = isEdit ? 'แก้ไขตำแหน่ง (' + esc(p.position_name) + ')' : 'เพิ่มตำแหน่งใหม่ (' + esc(type) + ')';

    var bodyHtml = ''
      + '<form id="admPosForm" onsubmit="event.preventDefault();" class="space-y-4">'
      + '  <input type="hidden" id="adm_pos_id" value="' + esc(p.position_id || '') + '">'
      + '  <div>'
      + '    <label class="lbl">ประเภทตำแหน่ง *</label>'
      + '    <select id="adm_pos_type" class="inp" required>' + app.buildOptionsHtml(posTypes, type) + '</select>'
      + '  </div>'
      + '  <div>'
      + '    <label class="lbl">ชื่อสายงาน / ตำแหน่ง *</label>'
      + '    <input type="text" id="adm_pos_name" class="inp" placeholder="เช่น เจ้าพนักงานเทศกิจ, นิติกร" value="' + esc(p.position_name || '') + '" required>'
      + '  </div>'
      + '  <div>'
      + '    <label class="lbl">ระดับตำแหน่ง (ถ้ามี)</label>'
      + '    <input type="text" id="adm_pos_level" class="inp" placeholder="เช่น ปฏิบัติการ, ชำนาญการ, เชี่ยวชาญ" value="' + esc(p.position_level || '') + '">'
      + '  </div>'
      + '  <div>'
      + '    <label class="lbl">ลำดับแสดงผล (Sort Order)</label>'
      + '    <input type="number" id="adm_pos_sort" class="inp" value="' + esc(p.sort_order || 1) + '">'
      + '  </div>'
      + '</form>';

    var footerHtml = ''
      + '<button type="button" class="btn-ghost" onclick="PORTAL_APP.closeModal()">ยกเลิก</button>'
      + '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.submitSinglePositionModal()"><i data-lucide="save" class="w-4 h-4"></i> บันทึกข้อมูลตำแหน่ง</button>';

    app.openModal(title, bodyHtml, footerHtml, '520px', 'layers');
    triggerIcons();
  }

  async function submitSinglePositionModal() {
    var pName = (document.getElementById('adm_pos_name').value || '').trim();
    if (!pName) {
      alertError('กรุณาระบุชื่อสายงาน/ตำแหน่ง');
      return;
    }

    var payload = {
      position_id: (document.getElementById('adm_pos_id').value || '').trim(),
      position_type: document.getElementById('adm_pos_type').value,
      position_name: pName,
      position_level: (document.getElementById('adm_pos_level').value || '').trim(),
      sort_order: parseInt(document.getElementById('adm_pos_sort').value, 10) || 1
    };

    try {
      var res = await getApi().savePositionStructure(payload);
      toast(res.message || 'บันทึกโครงสร้างตำแหน่งสำเร็จ');
      getApp().closeModal();

      var bootRes = await getApi().checkSystemInit(true);
      if (bootRes && bootRes.position_structure) {
        getApp().STATE.positionStructure = bootRes.position_structure;
      }
      renderPositionsPage();
    } catch (err) {
      alertError(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
    }
  }

  function openBatchPositionModal(currentType) {
    var app = getApp();
    if (!app) return;
    var type = currentType || ADMIN_STATE.currentPosTab;
    var posTypes = app.getPositionTypes();

    var title = 'เพิ่มสายงาน/ตำแหน่งแบบกลุ่ม (Batch Add: ' + esc(type) + ')';

    var bodyHtml = ''
      + '<form id="admBatchPosForm" onsubmit="event.preventDefault();" class="space-y-4">'
      + '  <div>'
      + '    <label class="lbl">ประเภทตำแหน่ง *</label>'
      + '    <select id="adm_batch_pos_type" class="inp" required>' + app.buildOptionsHtml(posTypes, type) + '</select>'
      + '  </div>'
      + '  <div>'
      + '    <label class="lbl">รายการสายงาน / ระดับ (วาง 1 บรรทัด ต่อ 1 ตำแหน่ง) *</label>'
      + '    <p class="text-xs muted mb-1.5">สามารถระบุระดับตำแหน่งคั่นด้วยเครื่องหมายจุลภาค <code>,</code> เช่น <code>เจ้าพนักงานเทศกิจ, ปฏิบัติงาน</code></p>'
      + '    <textarea id="adm_batch_pos_lines" class="inp" rows="8" placeholder="เจ้าพนักงานเทศกิจ, ปฏิบัติงาน&#10;เจ้าพนักงานเทศกิจ, ชำนาญงาน&#10;นิติกร, ปฏิบัติการ&#10;นิติกร, ชำนาญการ"></textarea>'
      + '  </div>'
      + '</form>';

    var footerHtml = ''
      + '<button type="button" class="btn-ghost" onclick="PORTAL_APP.closeModal()">ยกเลิก</button>'
      + '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.submitBatchPositionModal()"><i data-lucide="plus-circle" class="w-4 h-4"></i> เพิ่มตำแหน่งทั้งหมด</button>';

    app.openModal(title, bodyHtml, footerHtml, '580px', 'file-plus');
    triggerIcons();
  }

  async function submitBatchPositionModal() {
    var linesStr = (document.getElementById('adm_batch_pos_lines').value || '').trim();
    if (!linesStr) {
      alertError('กรุณาระบุรายการตำแหน่งอย่างน้อย 1 บรรทัด');
      return;
    }

    var type = document.getElementById('adm_batch_pos_type').value;
    var lines = linesStr.split('\n');
    var items = [];
    lines.forEach(function (line) {
      var trimmed = line.trim();
      if (!trimmed) return;
      var parts = trimmed.split(',');
      items.push({
        position_name: parts[0].trim(),
        position_level: parts[1] ? parts[1].trim() : ''
      });
    });

    try {
      var res = await getApi().batchAddPosition({
        position_type: type,
        items: items
      });
      toast(res.message || 'เพิ่มตำแหน่งแบบกลุ่มสำเร็จ');
      getApp().closeModal();

      var bootRes = await getApi().checkSystemInit(true);
      if (bootRes && bootRes.position_structure) {
        getApp().STATE.positionStructure = bootRes.position_structure;
      }
      renderPositionsPage();
    } catch (err) {
      alertError(err.message || 'ไม่สามารถเพิ่มตำแหน่งแบบกลุ่มได้');
    }
  }

  async function deletePosition(positionId, name) {
    var confirmed = await getApp().confirmAction({
      title: 'ยืนยันการลบโครงสร้างตำแหน่ง?',
      text: 'ต้องการลบ "' + name + '" หรือไม่?',
      confirmText: 'ลบตำแหน่ง',
      cancelText: 'ยกเลิก',
      confirmColor: '#E53935'
    });
    if (!confirmed) return;

    try {
      var res = await getApi().deletePositionStructure(positionId);
      toast(res.message || 'ลบตำแหน่งสำเร็จ');
      var bootRes = await getApi().checkSystemInit(true);
      if (bootRes && bootRes.position_structure) {
        getApp().STATE.positionStructure = bootRes.position_structure;
      }
      renderPositionsPage();
    } catch (err) {
      alertError(err.message || 'ไม่สามารถลบตำแหน่งได้');
    }
  }

  // ===========================================================================
  // 6. โมดูลตั้งค่าระบบ & Google Drive Folders (#settings)
  // ===========================================================================
  function renderSettingsPage() {
    var app = getApp();
    if (!app) return;
    app.setPageHeader('ตั้งค่าระบบส่วนกลาง', 'ปรับแต่งชื่อระบบ โลโก้ ธีมสี นโยบายความปลอดภัย โฟลเดอร์ Google Drive และรีเซ็ตข้อมูลทดสอบ', 'settings');

    var pageBody = getPageBody();
    if (!pageBody) return;

    var s = app.STATE.settings || {};

    var toolsHtml = ''
      + '<button type="button" class="btn-danger" onclick="PORTAL_ADMIN.confirmResetTestData()"><i data-lucide="alert-octagon" class="w-4 h-4"></i> รีเซ็ตข้อมูลทดสอบ</button>'
      + '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.submitSettings()"><i data-lucide="save" class="w-4 h-4"></i> บันทึกการตั้งค่า</button>';

    var sectionHeader = app.sectionBar('ตั้งค่าระบบส่วนกลาง (System Settings)', toolsHtml, 'settings');

    var formHtml = ''
      + '<form id="admSettingsForm" onsubmit="event.preventDefault();" class="space-y-6">'
      // Card 1: Branding
      + '  <div class="card p-5">'
      + '    <div class="flex items-center gap-2 mb-3"><i data-lucide="palette" class="w-4 h-4 accent"></i><h3 class="font-bold text-sm">1. อัตลักษณ์และแบรนด์ (Branding & Identity)</h3></div>'
      + '    <div class="grid md:grid-cols-2 gap-4">'
      + '      <div><label class="lbl">ชื่อระบบ (App_Name)</label><input type="text" id="cfg_App_Name" class="inp" value="' + esc(s.App_Name || '') + '"></div>'
      + '      <div><label class="lbl">ชื่อหน่วยงาน (Organization_Name)</label><input type="text" id="cfg_Organization_Name" class="inp" value="' + esc(s.Organization_Name || '') + '"></div>'
      + '      <div><label class="lbl">สังกัดย่อย (Organization_Sub)</label><input type="text" id="cfg_Organization_Sub" class="inp" value="' + esc(s.Organization_Sub || '') + '"></div>'
      + '      <div><label class="lbl">ธีมเริ่มต้น (Default_Theme)</label>'
      + '        <select id="cfg_Default_Theme" class="inp">'
      + '          <option value="light"' + (s.Default_Theme === 'light' ? ' selected' : '') + '>โหมดกลางวัน (Light Mode)</option>'
      + '          <option value="dark"' + (s.Default_Theme === 'dark' ? ' selected' : '') + '>โหมดกลางคืน (Dark Mode)</option>'
      + '        </select>'
      + '      </div>'
      + '      <div class="md:col-span-2"><label class="lbl">URL โลโก้กลาง (Portal_Logo_URL)</label><input type="text" id="cfg_Portal_Logo_URL" class="inp" value="' + esc(s.Portal_Logo_URL || '') + '"></div>'
      + '    </div>'
      + '  </div>'
      // Card 2: Security
      + '  <div class="card p-5">'
      + '    <div class="flex items-center gap-2 mb-3"><i data-lucide="shield" class="w-4 h-4 accent"></i><h3 class="font-bold text-sm">2. ความปลอดภัยและการเข้าถึง (Security Policies)</h3></div>'
      + '    <div class="grid md:grid-cols-3 gap-4">'
      + '      <div><label class="lbl">อนุญาตให้ลงทะเบียนเอง (Allow_Registration)</label>'
      + '        <select id="cfg_Allow_Registration" class="inp">'
      + '          <option value="TRUE"' + (s.Allow_Registration === 'TRUE' ? ' selected' : '') + '>เปิดให้ลงทะเบียนเอง</option>'
      + '          <option value="FALSE"' + (s.Allow_Registration === 'FALSE' ? ' selected' : '') + '>ปิด (ผู้ดูแลสร้างให้เท่านั้น)</option>'
      + '        </select>'
      + '      </div>'
      + '      <div><label class="lbl">บังคับยืนยันอีเมล (Require_Email_Verification)</label>'
      + '        <select id="cfg_Require_Email_Verification" class="inp">'
      + '          <option value="TRUE"' + (s.Require_Email_Verification === 'TRUE' ? ' selected' : '') + '>ต้องยืนยันอีเมลก่อนใช้งาน</option>'
      + '          <option value="FALSE"' + (s.Require_Email_Verification === 'FALSE' ? ' selected' : '') + '>ใช้งานได้ทันที</option>'
      + '        </select>'
      + '      </div>'
      + '      <div><label class="lbl">อายุ Session เข้าสู่ระบบ (Session_Timeout_Hours)</label><input type="number" id="cfg_Session_Timeout_Hours" class="inp" value="' + esc(s.Session_Timeout_Hours || 24) + '"></div>'
      + '    </div>'
      + '  </div>'
      // Card 3: Drive Folders
      + '  <div class="card p-5">'
      + '    <div class="flex items-center gap-2 mb-3"><i data-lucide="folder-git-2" class="w-4 h-4 accent"></i><h3 class="font-bold text-sm">3. โฟลเดอร์จัดเก็บไฟล์ Google Drive</h3></div>'
      + '    <div class="space-y-3">'
      + '      <div>'
      + '        <label class="lbl">Google Drive Folder ID รูปโปรไฟล์ (Profile_Folder_ID)</label>'
      + '        <div class="flex gap-2">'
      + '          <input type="text" id="cfg_Profile_Folder_ID" class="inp" value="' + esc(s.Profile_Folder_ID || '') + '" placeholder="Folder ID จากลิงก์ Drive">'
      + '          <button type="button" class="btn-ghost shrink-0" onclick="PORTAL_ADMIN.testDriveFolder(\'cfg_Profile_Folder_ID\', \'รูปโปรไฟล์\')"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> ทดสอบ</button>'
      + '        </div>'
      + '      </div>'
      + '      <div>'
      + '        <label class="lbl">Google Drive Folder ID ลายเซ็นดิจิทัล (Signature_Folder_ID)</label>'
      + '        <div class="flex gap-2">'
      + '          <input type="text" id="cfg_Signature_Folder_ID" class="inp" value="' + esc(s.Signature_Folder_ID || '') + '" placeholder="Folder ID จากลิงก์ Drive">'
      + '          <button type="button" class="btn-ghost shrink-0" onclick="PORTAL_ADMIN.testDriveFolder(\'cfg_Signature_Folder_ID\', \'ลายเซ็น\')"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> ทดสอบ</button>'
      + '        </div>'
      + '      </div>'
      + '      <div>'
      + '        <label class="lbl">Google Drive Folder ID เอกสารส่วนกลาง (Document_Folder_ID)</label>'
      + '        <div class="flex gap-2">'
      + '          <input type="text" id="cfg_Document_Folder_ID" class="inp" value="' + esc(s.Document_Folder_ID || '') + '" placeholder="Folder ID จากลิงก์ Drive">'
      + '          <button type="button" class="btn-ghost shrink-0" onclick="PORTAL_ADMIN.testDriveFolder(\'cfg_Document_Folder_ID\', \'เอกสารทั่วไป\')"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> ทดสอบ</button>'
      + '        </div>'
      + '      </div>'
      + '    </div>'
      + '  </div>'
      // Card 4: System
      + '  <div class="card p-5">'
      + '    <div class="flex items-center gap-2 mb-3"><i data-lucide="server" class="w-4 h-4 accent"></i><h3 class="font-bold text-sm">4. ตั้งค่าระบบและข้อความแจ้งเตือน</h3></div>'
      + '    <div class="space-y-3">'
      + '      <div><label class="lbl">ข้อความประกาศหน้าแรก (Announcement_Banner)</label><input type="text" id="cfg_Announcement_Banner" class="inp" value="' + esc(s.Announcement_Banner || '') + '"></div>'
      + '      <div><label class="lbl">อีเมลติดต่อฝ่ายดูแลระบบ (Support_Email)</label><input type="email" id="cfg_Support_Email" class="inp" value="' + esc(s.Support_Email || '') + '"></div>'
      + '    </div>'
      + '  </div>'
      + '</form>';

    pageBody.innerHTML = sectionHeader + formHtml;
    triggerIcons();
  }

  async function testDriveFolder(inputId, label) {
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
  }

  async function submitSettings() {
    var app = getApp();
    if (!app) return;

    var keys = [
      'App_Name',
      'Organization_Name',
      'Organization_Sub',
      'Portal_Logo_URL',
      'Default_Theme',
      'Allow_Registration',
      'Require_Email_Verification',
      'Session_Timeout_Hours',
      'Profile_Folder_ID',
      'Signature_Folder_ID',
      'Document_Folder_ID',
      'Announcement_Banner',
      'Support_Email'
    ];

    var updates = [];
    keys.forEach(function (k) {
      var el = document.getElementById('cfg_' + k);
      if (el) {
        updates.push({ key: k, value: el.value.trim() });
      }
    });

    try {
      for (var i = 0; i < updates.length; i++) {
        await getApi().saveSetting(updates[i].key, updates[i].value);
        app.STATE.settings[updates[i].key] = updates[i].value;
      }
      toast('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
      app.applyBranding();
      if (app.STATE.settings.Default_Theme) {
        app.applyTheme(app.STATE.settings.Default_Theme, false);
      }
      renderSettingsPage();
    } catch (err) {
      alertError(err.message || 'บันทึกการตั้งค่าไม่สำเร็จ');
    }
  }

  function confirmResetTestData() {
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
  }

  async function executeResetTestData() {
    var mode = 'MOCK_ONLY';
    var radios = document.getElementsByName('resetMode');
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) mode = radios[i].value;
    }

    try {
      var res = await getApi().resetTestData(mode);
      getApp().closeModal();
      toast(res.message || 'รีเซ็ตข้อมูลเรียบร้อยแล้ว');
      await getApp().bootSystem();
    } catch (err) {
      alertError(err.message || 'รีเซ็ตข้อมูลไม่สำเร็จ');
    }
  }

  // ===========================================================================
  // 7. Public Interface & Initialization
  // ===========================================================================
  var PORTAL_ADMIN = {
    ADMIN_STATE: ADMIN_STATE,

    // Personnel
    renderPersonnelPage: renderPersonnelPage,
    refreshPersonnel: async function () {
      await loadPersonnelData(false);
      renderPersonnelPage();
    },
    openPersonnelModal: openPersonnelModal,
    submitPersonnelModal: submitPersonnelModal,
    deletePersonnel: deletePersonnel,

    // Users
    renderUsersPage: renderUsersPage,
    refreshUsers: async function () {
      await loadUsersData(false);
      renderUsersPage();
    },
    quickCreateAccountForPersonnel: quickCreateAccountForPersonnel,
    openUserModal: openUserModal,
    submitUserModal: submitUserModal,
    deleteUser: deleteUser,

    // Webapps
    renderWebappsPage: renderWebappsPage,
    refreshWebapps: async function () {
      await loadWebappsData(false);
      renderWebappsPage();
    },
    openWebappModal: openWebappModal,
    submitWebappModal: submitWebappModal,
    deleteWebapp: deleteWebapp,

    // Reference
    renderReferencePage: renderReferencePage,
    switchRefTab: switchRefTab,
    setRefParentFilter: setRefParentFilter,
    moveReference: moveReference,
    openSingleReferenceModal: openSingleReferenceModal,
    submitSingleReferenceModal: submitSingleReferenceModal,
    openBatchReferenceModal: openBatchReferenceModal,
    submitBatchReferenceModal: submitBatchReferenceModal,
    deleteReference: deleteReference,

    // Positions
    renderPositionsPage: renderPositionsPage,
    switchPosTab: switchPosTab,
    movePosition: movePosition,
    openSinglePositionModal: openSinglePositionModal,
    submitSinglePositionModal: submitSinglePositionModal,
    openBatchPositionModal: openBatchPositionModal,
    submitBatchPositionModal: submitBatchPositionModal,
    deletePosition: deletePosition,

    // Settings & Reset
    renderSettingsPage: renderSettingsPage,
    testDriveFolder: testDriveFolder,
    submitSettings: submitSettings,
    confirmResetTestData: confirmResetTestData,
    executeResetTestData: executeResetTestData
  };

  global.PORTAL_ADMIN = PORTAL_ADMIN;

  function initAdminRoutes() {
    var app = getApp();
    if (!app || typeof app.registerAdminRoute !== 'function') return;

    app.registerAdminRoute('personnel', async function () {
      if (!ADMIN_STATE.personnel || ADMIN_STATE.personnel.length === 0) {
        await loadPersonnelData(true);
      }
      renderPersonnelPage();
    });

    app.registerAdminRoute('users', async function () {
      await Promise.all([
        loadUsersData(true),
        loadPersonnelData(true),
        loadWebappsData(true)
      ]);
      renderUsersPage();
    });

    app.registerAdminRoute('webapps', async function () {
      if (!ADMIN_STATE.webapps || ADMIN_STATE.webapps.length === 0) {
        await loadWebappsData(true);
      }
      renderWebappsPage();
    });

    app.registerAdminRoute('reference', function () {
      renderReferencePage();
    });

    app.registerAdminRoute('positions', function () {
      renderPositionsPage();
    });

    app.registerAdminRoute('settings', function () {
      renderSettingsPage();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminRoutes);
  } else {
    initAdminRoutes();
  }
})(window);
