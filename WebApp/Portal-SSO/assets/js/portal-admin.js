/**
 * =============================================================================
 * STB APP n2 — Central Portal Admin & Superadmin Module (assets/js/portal-admin.js)
 * =============================================================================
 * พัฒนาเต็มรูปแบบสำหรับ 🟣 เฟส 1D (Admin & Superadmin Views ครบ 6 โมดูล):
 * - #personnel : จัดการทำเนียบบุคลากร (20 คอลัมน์ + Cascading Dropdowns + อัปโหลดรูป/ลายเซ็นลง Google Drive)
 * - #users     : จัดการผู้ใช้งาน & ผูกบัญชี SUPERADMIN คนแรก (Auto-Lock Setup Mode) + กำหนดสิทธิ์รายแอป
 * - #webapps   : จัดการเว็บแอปย่อย (SSO Registry + อัปโหลดไอคอนแอป)
 * - #reference : จัดการโครงสร้างสังกัด 4 ระดับ & คำนำหน้าชื่อ (เลื่อนลำดับ ▲▼ & Batch Add)
 * - #positions : จัดการโครงสร้างตำแหน่ง 6 ประเภทของ กทม. (เลื่อนลำดับ ▲▼ & Batch Add)
 * - #settings  : ตั้งค่าระบบ 13 Keys + ทดสอบโฟลเดอร์ Google Drive + รีเซ็ตข้อมูลทดสอบ 2 โหมด
 * =============================================================================
 */
(function (global) {
  'use strict';

  // State เก็บข้อมูลในหน่วยความจำของ Admin Module
  var ADMIN_STATE = {
    personnel: [],
    users: [],
    webapps: [],
    referenceData: [],
    positionStructure: [],
    settings: {},

    // ตัวแปรควบคุมการกรองและการสลับแท็บ
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
        timer: 3000
      });
    }
  }

  function alertError(msg) {
    var app = getApp();
    if (app && typeof app.alertError === 'function') {
      app.alertError(msg);
    } else if (global.Swal) {
      global.Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: msg });
    } else {
      alert(msg);
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
    app.setPageHeader(
      'ทำเนียบบุคลากร (Personnel Management)',
      'จัดการฐานข้อมูลบุคลากร 20 คอลัมน์ ค้นหา กรองสถานะ และอัปโหลดรูปภาพ/ลายเซ็นลง Google Drive'
    );

    var pageBody = document.getElementById('pageBody');
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
      rowsHtml = '<tr><td colspan="9" style="text-align:center;padding:2.5rem;color:var(--muted);"><i class="fa-solid fa-inbox" style="font-size:2rem;margin-bottom:0.5rem;display:block;"></i>ไม่พบข้อมูลบุคลากรตรงตามเงื่อนไข</td></tr>';
    } else {
      filtered.forEach(function (p, idx) {
        var photoSrc = resolveDriveImg(p.photo_url, 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png');
        var chipStatus = 'chip';
        if (p.status === 'ช่วยราชการ') chipStatus = 'chip amber';
        else if (p.status === 'พ้นสภาพ') chipStatus = 'chip red';

        var accountBadge = p.has_user_account
          ? '<span class="chip" title="ชื่อผู้ใช้: ' + esc(p.username) + '"><i class="fa-solid fa-user-check"></i> ' + esc(p.username) + '</span>'
          : '<button type="button" class="btn btn-sm btn-outline" onclick="PORTAL_ADMIN.quickCreateAccountForPersonnel(\'' + esc(p.personnel_id) + '\')" title="คลิกเพื่อผูกบัญชี"><i class="fa-solid fa-user-plus"></i> ผูกบัญชี</button>';

        rowsHtml += ''
          + '<tr>'
          + '  <td style="text-align:center;font-weight:600;color:var(--muted);">' + (idx + 1) + '</td>'
          + '  <td style="text-align:center;">'
          + '    <img src="' + esc(photoSrc) + '" alt="Profile" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:1px solid var(--border);">'
          + '  </td>'
          + '  <td>'
          + '    <div style="font-weight:700;color:var(--text);">' + esc(p.full_name || ((p.prefix || '') + p.first_name + ' ' + p.last_name)) + '</div>'
          + '    <div style="font-size:0.8rem;color:var(--muted);"><i class="fa-regular fa-id-card"></i> ' + esc(p.id_card_number) + ' &bull; <code>' + esc(p.personnel_id) + '</code></div>'
          + '  </td>'
          + '  <td>'
          + '    <div>' + esc(p.position || '-') + '</div>'
          + '    <div style="font-size:0.8rem;color:var(--muted);">' + esc(p.position_level || 'ไม่มีระดับ') + (p.position_type ? ' (' + esc(p.position_type) + ')' : '') + '</div>'
          + '  </td>'
          + '  <td>'
          + '    <div>' + esc(p.office || '-') + '</div>'
          + '    <div style="font-size:0.8rem;color:var(--muted);">' + esc(p.department || '-') + (p.division ? ' / ' + esc(p.division) : '') + '</div>'
          + '  </td>'
          + '  <td>' + accountBadge + '</td>'
          + '  <td><span class="' + chipStatus + '">' + esc(p.status || 'ทำงานอยู่') + '</span></td>'
          + '  <td style="text-align:right;">'
          + '    <button type="button" class="btn btn-sm btn-outline" onclick="PORTAL_ADMIN.openPersonnelModal(\'' + esc(p.personnel_id) + '\')" title="แก้ไขข้อมูล"><i class="fa-solid fa-pen-to-square"></i></button>'
          + '    <button type="button" class="btn btn-sm btn-outline" style="color:var(--red);border-color:rgba(229,57,53,0.3);" onclick="PORTAL_ADMIN.deletePersonnel(\'' + esc(p.personnel_id) + '\', \'' + esc(p.full_name) + '\')" title="ลบข้อมูล"><i class="fa-solid fa-trash-can"></i></button>'
          + '  </td>'
          + '</tr>';
      });
    }

    pageBody.innerHTML = ''
      + '<div class="card" style="margin-bottom:1.25rem;">'
      + '  <div style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:center;justify-content:space-between;">'
      + '    <div style="display:flex;flex-wrap:wrap;gap:0.6rem;align-items:center;flex:1;max-width:650px;">'
      + '      <div style="position:relative;flex:1;min-width:220px;">'
      + '        <i class="fa-solid fa-magnifying-glass" style="position:absolute;left:0.85rem;top:50%;transform:translateY(-50%);color:var(--muted);"></i>'
      + '        <input type="text" id="personnelSearchInput" class="inp" style="padding-left:2.35rem;" placeholder="ค้นหาชื่อ, เลขบัตร, ตำแหน่ง, สังกัด..." value="' + esc(ADMIN_STATE.personnelSearch) + '">'
      + '      </div>'
      + '      <select id="personnelStatusSelect" class="sel" style="width:160px;">'
      + '        <option value="">-- ทุกสถานะ --</option>'
      + '        <option value="ทำงานอยู่"' + (sStatus === 'ทำงานอยู่' ? ' selected' : '') + '>ทำงานอยู่</option>'
      + '        <option value="ช่วยราชการ"' + (sStatus === 'ช่วยราชการ' ? ' selected' : '') + '>ช่วยราชการ</option>'
      + '        <option value="พ้นสภาพ"' + (sStatus === 'พ้นสภาพ' ? ' selected' : '') + '>พ้นสภาพ</option>'
      + '      </select>'
      + '    </div>'
      + '    <div style="display:flex;gap:0.5rem;">'
      + '      <button type="button" class="btn btn-outline" onclick="PORTAL_ADMIN.refreshPersonnel()"><i class="fa-solid fa-rotate"></i> รีเฟรช</button>'
      + '      <button type="button" class="btn btn-primary" onclick="PORTAL_ADMIN.openPersonnelModal()"><i class="fa-solid fa-user-plus"></i> เพิ่มบุคลากรใหม่</button>'
      + '    </div>'
      + '  </div>'
      + '</div>'
      + '<div class="tbl-wrap">'
      + '  <table class="tbl">'
      + '    <thead>'
      + '      <tr>'
      + '        <th style="width:45px;text-align:center;">#</th>'
      + '        <th style="width:55px;text-align:center;">รูปถ่าย</th>'
      + '        <th>ชื่อ-นามสกุล / เลขประจำตัว</th>'
      + '        <th>ตำแหน่ง / สายงาน</th>'
      + '        <th>สังกัด / หน่วยงาน</th>'
      + '        <th>บัญชีผู้ใช้</th>'
      + '        <th>สถานะงาน</th>'
      + '        <th style="width:105px;text-align:right;">จัดการ</th>'
      + '      </tr>'
      + '    </thead>'
      + '    <tbody>' + rowsHtml + '</tbody>'
      + '  </table>'
      + '</div>';

    var searchInput = document.getElementById('personnelSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        ADMIN_STATE.personnelSearch = e.target.value;
        renderPersonnelPage();
      });
    }

    var statusSelect = document.getElementById('personnelStatusSelect');
    if (statusSelect) {
      statusSelect.addEventListener('change', function (e) {
        ADMIN_STATE.personnelStatusFilter = e.target.value;
        renderPersonnelPage();
      });
    }
  }

  function openPersonnelModal(personnelId) {
    var app = getApp();
    if (!app) return;
    var item = null;
    if (personnelId) {
      item = (ADMIN_STATE.personnel || []).find(function (x) { return x.personnel_id === personnelId; });
    }

    var isEdit = !!item;
    var p = item || {};
    var title = isEdit ? '<i class="fa-solid fa-user-pen"></i> แก้ไขข้อมูลบุคลากร (' + esc(p.personnel_id) + ')' : '<i class="fa-solid fa-user-plus"></i> เพิ่มข้อมูลบุคลากรใหม่';

    var prefixOptions = app.buildOptionsHtml(
      app.getReferenceItems('PREFIX').map(function (x) { return x.value; }),
      p.prefix,
      '-- เลือกคำนำหน้า --'
    );

    var posTypeOptions = app.buildOptionsHtml(
      app.getPositionTypes(),
      p.position_type,
      '-- เลือกประเภทตำแหน่ง --'
    );

    var bureauOptions = app.buildOptionsHtml(
      app.getReferenceItems('BUREAU').map(function (x) { return x.value; }),
      p.bureau_name || 'สำนักเทศกิจ',
      '-- เลือกสำนัก --'
    );

    var photoPreview = resolveDriveImg(p.photo_url, 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png');
    var signPreview = resolveDriveImg(p.signature_url, '');

    var bodyHtml = ''
      + '<form id="admPersonnelForm" onsubmit="event.preventDefault();">'
      + '  <input type="hidden" id="adm_p_id" value="' + esc(p.personnel_id || '') + '">'
      + '  <input type="hidden" id="adm_p_photo_url" value="' + esc(p.photo_url || '') + '">'
      + '  <input type="hidden" id="adm_p_signature_url" value="' + esc(p.signature_url || '') + '">'
      + '  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">'
      + '    <div style="grid-column:1/-1;background:var(--surface2);padding:0.75rem 1rem;border-radius:0.75rem;font-weight:700;color:var(--thead-tx);">'
      + '      <i class="fa-solid fa-address-card"></i> ข้อมูลระบุตัวตนและข้อมูลพื้นฐาน'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">เลขประจำตัวประชาชน 13 หลัก <span style="color:var(--red);">*</span></label>'
      + '      <input type="text" id="adm_p_id_card" class="inp" maxlength="13" placeholder="ตัวเลข 13 หลัก" value="' + esc(p.id_card_number || '') + '"' + (isEdit ? ' readonly style="background:var(--surface2);"' : '') + ' required>'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">คำนำหน้าชื่อ <span style="color:var(--red);">*</span></label>'
      + '      <select id="adm_p_prefix" class="sel" required>' + prefixOptions + '</select>'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">ชื่อจริง <span style="color:var(--red);">*</span></label>'
      + '      <input type="text" id="adm_p_first_name" class="inp" placeholder="ระบุชื่อจริง" value="' + esc(p.first_name || '') + '" required>'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">นามสกุล <span style="color:var(--red);">*</span></label>'
      + '      <input type="text" id="adm_p_last_name" class="inp" placeholder="ระบุนามสกุล" value="' + esc(p.last_name || '') + '" required>'
      + '    </div>'
      + '    <div style="grid-column:1/-1;background:var(--surface2);padding:0.75rem 1rem;border-radius:0.75rem;font-weight:700;color:var(--thead-tx);margin-top:0.5rem;">'
      + '      <i class="fa-solid fa-briefcase"></i> โครงสร้างตำแหน่งและสายงาน (กทม.)'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">ประเภทตำแหน่ง <span style="color:var(--red);">*</span></label>'
      + '      <select id="adm_p_position_type" class="sel" required>' + posTypeOptions + '</select>'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">สายงาน / ตำแหน่ง <span style="color:var(--red);">*</span></label>'
      + '      <select id="adm_p_position" class="sel" required><option value="">-- เลือกสายงาน --</option></select>'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">ระดับตำแหน่ง</label>'
      + '      <select id="adm_p_position_level" class="sel"><option value="">-- เลือกระดับตำแหน่ง --</option></select>'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">ตำแหน่งทางการบริหาร (ถ้ามี)</label>'
      + '      <input type="text" id="adm_p_position_2" class="inp" placeholder="เช่น หัวหน้าฝ่าย..." value="' + esc(p.position_2 || '') + '">'
      + '    </div>'
      + '    <div style="grid-column:1/-1;background:var(--surface2);padding:0.75rem 1rem;border-radius:0.75rem;font-weight:700;color:var(--thead-tx);margin-top:0.5rem;">'
      + '      <i class="fa-solid fa-sitemap"></i> โครงสร้างสังกัดหน่วยงาน (4 ระดับ)'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">สำนัก <span style="color:var(--red);">*</span></label>'
      + '      <select id="adm_p_bureau_name" class="sel" required>' + bureauOptions + '</select>'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">สำนักงาน / กอง <span style="color:var(--red);">*</span></label>'
      + '      <select id="adm_p_office" class="sel" required><option value="">-- เลือกสำนักงาน/กอง --</option></select>'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">ฝ่าย / ส่วน <span style="color:var(--red);">*</span></label>'
      + '      <select id="adm_p_department" class="sel" required><option value="">-- เลือกฝ่าย/ส่วน --</option></select>'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">กลุ่มงาน (ถ้ามี)</label>'
      + '      <select id="adm_p_division" class="sel"><option value="">-- เลือกกลุ่มงาน --</option></select>'
      + '    </div>'
      + '    <div style="grid-column:1/-1;background:var(--surface2);padding:0.75rem 1rem;border-radius:0.75rem;font-weight:700;color:var(--thead-tx);margin-top:0.5rem;">'
      + '      <i class="fa-solid fa-file-invoice-dollar"></i> ข้อมูลการปฏิบัติงานและเอกสารแนบ'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">ปี พ.ศ. ที่เริ่มรับราชการ</label>'
      + '      <input type="text" id="adm_p_start_year" class="inp" maxlength="4" placeholder="เช่น 2558" value="' + esc(p.start_service_year_be || '') + '">'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">เงินเดือนปัจจุบัน (บาท)</label>'
      + '      <input type="number" step="0.01" id="adm_p_salary" class="inp" placeholder="0.00" value="' + esc(p.current_salary || '0') + '">'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">สถานะการทำงาน <span style="color:var(--red);">*</span></label>'
      + '      <select id="adm_p_status" class="sel" required>'
      + '        <option value="ทำงานอยู่"' + (p.status === 'ทำงานอยู่' || !p.status ? ' selected' : '') + '>ทำงานอยู่</option>'
      + '        <option value="ช่วยราชการ"' + (p.status === 'ช่วยราชการ' ? ' selected' : '') + '>ช่วยราชการ</option>'
      + '        <option value="พ้นสภาพ"' + (p.status === 'พ้นสภาพ' ? ' selected' : '') + '>พ้นสภาพ</option>'
      + '      </select>'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">รูปโปรไฟล์ (บันทึกลง Google Drive)</label>'
      + '      <div style="display:flex;gap:0.75rem;align-items:center;">'
      + '        <img id="adm_p_photo_img" src="' + esc(photoPreview) + '" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:1px solid var(--border);">'
      + '        <input type="file" id="adm_p_photo_file" accept="image/*" style="font-size:0.82rem;">'
      + '      </div>'
      + '    </div>'
      + '    <div style="grid-column:1/-1;">'
      + '      <label class="lbl">รูปลายเซ็น (บันทึกลง Google Drive)</label>'
      + '      <div style="display:flex;gap:1rem;align-items:center;">'
      + '        <div id="adm_p_sig_box" style="width:160px;height:65px;border:1px dashed var(--border);border-radius:0.5rem;display:flex;align-items:center;justify-content:center;background:var(--surface2);overflow:hidden;">'
      + (signPreview ? '<img id="adm_p_sig_img" src="' + esc(signPreview) + '" style="max-width:100%;max-height:100%;object-fit:contain;">' : '<span id="adm_p_sig_text" style="color:var(--muted);font-size:0.8rem;">ไม่มีลายเซ็น</span>')
      + '        </div>'
      + '        <input type="file" id="adm_p_sig_file" accept="image/*" style="font-size:0.82rem;">'
      + '      </div>'
      + '    </div>'
      + '  </div>'
      + '</form>';

    var footerHtml = ''
      + '<button type="button" class="btn btn-outline" onclick="PORTAL_APP.closeModal()">ยกเลิก</button>'
      + '<button type="button" class="btn btn-primary" onclick="PORTAL_ADMIN.submitPersonnelModal()"><i class="fa-solid fa-save"></i> บันทึกข้อมูลบุคลากร</button>';

    app.openModal(title, bodyHtml, footerHtml, '780px');

    // ผูก Cascading Dropdowns
    app.bindOrgAndPositionCascade('adm_p', {
      position_type: p.position_type,
      position: p.position,
      position_level: p.position_level,
      bureau_name: p.bureau_name || 'สำนักเทศกิจ',
      office: p.office,
      department: p.department,
      division: p.division
    });

    // Event listener สำหรับอัปโหลดรูปโปรไฟล์
    var photoInput = document.getElementById('adm_p_photo_file');
    if (photoInput) {
      photoInput.addEventListener('change', async function () {
        if (!photoInput.files || !photoInput.files[0]) return;
        var file = photoInput.files[0];
        var idCard = document.getElementById('adm_p_id_card').value.trim() || 'PROFILE';
        try {
          var cfg = global.STB_CONFIG || {};
          var folderId = (app.STATE.settings && app.STATE.settings.Profile_Folder_ID) || '';
          if (global.LOADER) global.LOADER.busy(Promise.resolve(), 'กำลังอัปโหลดรูปโปรไฟล์เข้า Google Drive...');
          var upRes = await global.STB_DRIVE.uploadToDrive({
            file: file,
            folderId: folderId,
            fileName: 'PROFILE_' + idCard + '_' + Date.now()
          });
          var finalUrl = (upRes && (upRes.fileUrl || upRes.downloadUrl)) || '';
          document.getElementById('adm_p_photo_url').value = finalUrl;
          document.getElementById('adm_p_photo_img').src = resolveDriveImg(finalUrl);
          toast('อัปโหลดรูปโปรไฟล์เข้า Google Drive สำเร็จ');
        } catch (e) {
          alertError('อัปโหลดรูปภาพล้มเหลว: ' + e.message);
        } finally {
          if (global.LOADER) global.LOADER.hide();
        }
      });
    }

    // Event listener สำหรับอัปโหลดรูปลายเซ็น
    var sigInput = document.getElementById('adm_p_sig_file');
    if (sigInput) {
      sigInput.addEventListener('change', async function () {
        if (!sigInput.files || !sigInput.files[0]) return;
        var file = sigInput.files[0];
        var idCard = document.getElementById('adm_p_id_card').value.trim() || 'SIG';
        try {
          var folderId = (app.STATE.settings && app.STATE.settings.Signature_Folder_ID) || '';
          if (global.LOADER) global.LOADER.busy(Promise.resolve(), 'กำลังอัปโหลดรูปลายเซ็นเข้า Google Drive...');
          var upRes = await global.STB_DRIVE.uploadToDrive({
            file: file,
            folderId: folderId,
            fileName: 'SIGNATURE_' + idCard + '_' + Date.now()
          });
          var finalUrl = (upRes && (upRes.fileUrl || upRes.downloadUrl)) || '';
          document.getElementById('adm_p_signature_url').value = finalUrl;
          var sigBox = document.getElementById('adm_p_sig_box');
          if (sigBox) {
            sigBox.innerHTML = '<img src="' + esc(resolveDriveImg(finalUrl)) + '" style="max-width:100%;max-height:100%;object-fit:contain;">';
          }
          toast('อัปโหลดรูปลายเซ็นเข้า Google Drive สำเร็จ');
        } catch (e) {
          alertError('อัปโหลดรูปลายเซ็นล้มเหลว: ' + e.message);
        } finally {
          if (global.LOADER) global.LOADER.hide();
        }
      });
    }
  }

  async function submitPersonnelModal() {
    var idCard = (document.getElementById('adm_p_id_card').value || '').trim().replace(/\D/g, '');
    var prefix = (document.getElementById('adm_p_prefix').value || '').trim();
    var firstName = (document.getElementById('adm_p_first_name').value || '').trim();
    var lastName = (document.getElementById('adm_p_last_name').value || '').trim();

    if (!idCard || idCard.length !== 13) {
      alertError('กรุณาระบุเลขประจำตัวประชาชน 13 หลักให้ถูกต้อง');
      return;
    }
    if (!prefix || !firstName || !lastName) {
      alertError('กรุณากรอกคำนำหน้า ชื่อจริง และนามสกุล');
      return;
    }

    var payload = {
      personnel_id: (document.getElementById('adm_p_id').value || '').trim(),
      id_card_number: idCard,
      prefix: prefix,
      first_name: firstName,
      last_name: lastName,
      position_type: document.getElementById('adm_p_position_type').value,
      position: document.getElementById('adm_p_position').value,
      position_level: document.getElementById('adm_p_position_level').value,
      position_2: document.getElementById('adm_p_position_2').value,
      bureau_name: document.getElementById('adm_p_bureau_name').value,
      office: document.getElementById('adm_p_office').value,
      department: document.getElementById('adm_p_department').value,
      division: document.getElementById('adm_p_division').value,
      start_service_year_be: document.getElementById('adm_p_start_year').value,
      current_salary: document.getElementById('adm_p_salary').value,
      status: document.getElementById('adm_p_status').value,
      photo_url: document.getElementById('adm_p_photo_url').value,
      signature_url: document.getElementById('adm_p_signature_url').value
    };

    try {
      var res = await getApi().savePersonnel(payload);
      toast(res.message || 'บันทึกข้อมูลบุคลากรสำเร็จ');
      getApp().closeModal();
      await loadPersonnelData(true);
      renderPersonnelPage();
    } catch (err) {
      alertError(err.message || 'บันทึกข้อมูลบุคลากรไม่สำเร็จ');
    }
  }

  async function deletePersonnel(personnelId, name) {
    if (!personnelId) return;
    var confirmText = 'คุณต้องการลบข้อมูลบุคลากรของ "' + (name || personnelId) + '" ออกจากทำเนียบใช่หรือไม่?';
    if (global.Swal) {
      var r = await global.Swal.fire({
        title: 'ยืนยันการลบข้อมูลบุคลากร',
        text: confirmText,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E53935',
        cancelButtonColor: '#64748B',
        confirmButtonText: 'ลบข้อมูล',
        cancelButtonText: 'ยกเลิก'
      });
      if (!r.isConfirmed) return;
    } else {
      if (!confirm(confirmText)) return;
    }

    try {
      var res = await getApi().deletePersonnel(personnelId);
      toast(res.message || 'ลบข้อมูลบุคลากรเรียบร้อยแล้ว');
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
      alertError('ไม่สามารถโหลดข้อมูลบัญชีผู้ใช้งานได้: ' + err.message);
      return [];
    }
  }

  function renderUsersPage() {
    var app = getApp();
    if (!app) return;
    app.setPageHeader(
      'จัดการบัญชีผู้ใช้งานและสิทธิ์ (Users & Permissions)',
      'ผูกบัญชีผู้ใช้กับบุคลากร กำหนดบทบาทสิทธิ์ (SUPERADMIN / ADMIN / USER) และสิทธิ์การเข้าใช้งานเว็บแอปย่อยรายบุคคล'
    );

    var pageBody = document.getElementById('pageBody');
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
      rowsHtml = '<tr><td colspan="8" style="text-align:center;padding:2.5rem;color:var(--muted);"><i class="fa-solid fa-users-slash" style="font-size:2rem;margin-bottom:0.5rem;display:block;"></i>ไม่พบข้อมูลบัญชีผู้ใช้งานตรงตามเงื่อนไข</td></tr>';
    } else {
      filtered.forEach(function (u, idx) {
        var photoSrc = resolveDriveImg(u.photo_url, 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png');

        var roleChip = 'chip';
        if (u.role === 'SUPERADMIN') roleChip = 'chip green" style="background:#00351B;color:#fff;';
        else if (u.role === 'ADMIN') roleChip = 'chip amber';
        else roleChip = 'chip blue';

        var statusChip = 'chip';
        if (u.status === 'รออนุมัติ') statusChip = 'chip amber';
        else if (u.status === 'รอการยืนยันอีเมล') statusChip = 'chip yellow" style="background:#fef3c7;color:#b45309;';
        else if (u.status === 'ระงับการใช้งาน' || u.status === 'ระงับบัญชี') statusChip = 'chip red';

        // นับจำนวนสิทธิ์รายแอป
        var perms = u.permissions || {};
        var grantedCount = 0;
        Object.keys(perms).forEach(function (k) {
          if (perms[k] === 'USER' || perms[k] === 'ADMIN') grantedCount++;
        });

        rowsHtml += ''
          + '<tr>'
          + '  <td style="text-align:center;font-weight:600;color:var(--muted);">' + (idx + 1) + '</td>'
          + '  <td>'
          + '    <div style="display:flex;align-items:center;gap:0.75rem;">'
          + '      <img src="' + esc(photoSrc) + '" alt="Avatar" style="width:38px;height:38px;border-radius:50%;object-fit:cover;border:1px solid var(--border);">'
          + '      <div>'
          + '        <div style="font-weight:700;color:var(--text);">' + esc(u.username) + '</div>'
          + '        <div style="font-size:0.8rem;color:var(--muted);">' + esc(u.email) + '</div>'
          + '      </div>'
          + '    </div>'
          + '  </td>'
          + '  <td>'
          + '    <div style="font-weight:600;">' + esc(u.full_name || '-') + '</div>'
          + '    <div style="font-size:0.8rem;color:var(--muted);">' + esc(u.position || '') + ' (' + esc(u.office || '-') + ')</div>'
          + '  </td>'
          + '  <td><span class="' + roleChip + '">' + esc(u.role) + '</span></td>'
          + '  <td><span class="chip" title="มีสิทธิ์เข้าถึง ' + grantedCount + ' แอป"><i class="fa-solid fa-shapes"></i> ' + grantedCount + ' แอป</span></td>'
          + '  <td><span class="' + statusChip + '">' + esc(u.status || 'ใช้งานปกติ') + '</span></td>'
          + '  <td style="font-size:0.82rem;color:var(--muted);">' + (u.last_login_at ? new Date(u.last_login_at).toLocaleString('th-TH') : '-') + '</td>'
          + '  <td style="text-align:right;">'
          + '    <button type="button" class="btn btn-sm btn-outline" onclick="PORTAL_ADMIN.openUserModal(\'' + esc(u.personnel_ref_id) + '\')" title="แก้ไขผู้ใช้และสิทธิ์"><i class="fa-solid fa-user-gear"></i></button>'
          + '    <button type="button" class="btn btn-sm btn-outline" style="color:var(--red);border-color:rgba(229,57,53,0.3);" onclick="PORTAL_ADMIN.deleteUser(\'' + esc(u.personnel_ref_id) + '\', \'' + esc(u.username) + '\')" title="ลบบัญชี"><i class="fa-solid fa-trash-can"></i></button>'
          + '  </td>'
          + '</tr>';
      });
    }

    var isSetup = app.STATE && app.STATE.isSetupMode;
    var setupBanner = isSetup
      ? '<div style="background:rgba(255,179,0,0.15);border:1px solid var(--amber);padding:1rem 1.25rem;border-radius:1rem;margin-bottom:1.25rem;display:flex;align-items:center;gap:1rem;">'
      + '  <i class="fa-solid fa-triangle-exclamation" style="color:var(--amber);font-size:1.6rem;"></i>'
      + '  <div>'
      + '    <div style="font-weight:800;color:var(--text);">โหมดตั้งค่าเริ่มต้น (Setup Bypass Mode)</div>'
      + '    <div style="font-size:0.9rem;color:var(--muted);">ระบบยังไม่มีบัญชี SUPERADMIN กรุณาสร้างบัญชีแรกโดยกดปุ่ม <b>"+ สร้างบัญชีผู้ใช้งาน"</b> ด้านล่าง เมื่อสร้างสำเร็จ ระบบจะปิดโหมด Bypass และล็อกอินอัตโนมัติทันที</div>'
      + '  </div>'
      + '</div>'
      : '';

    pageBody.innerHTML = ''
      + setupBanner
      + '<div class="card" style="margin-bottom:1.25rem;">'
      + '  <div style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:center;justify-content:space-between;">'
      + '    <div style="display:flex;flex-wrap:wrap;gap:0.6rem;align-items:center;flex:1;max-width:600px;">'
      + '      <div style="position:relative;flex:1;min-width:200px;">'
      + '        <i class="fa-solid fa-magnifying-glass" style="position:absolute;left:0.85rem;top:50%;transform:translateY(-50%);color:var(--muted);"></i>'
      + '        <input type="text" id="usersSearchInput" class="inp" style="padding-left:2.35rem;" placeholder="ค้นหา Username, Email, ชื่อบุคลากร..." value="' + esc(ADMIN_STATE.usersSearch) + '">'
      + '      </div>'
      + '      <select id="usersRoleSelect" class="sel" style="width:160px;">'
      + '        <option value="">-- ทุกบทบาท --</option>'
      + '        <option value="SUPERADMIN"' + (sRole === 'SUPERADMIN' ? ' selected' : '') + '>SUPERADMIN</option>'
      + '        <option value="ADMIN"' + (sRole === 'ADMIN' ? ' selected' : '') + '>ADMIN</option>'
      + '        <option value="USER"' + (sRole === 'USER' ? ' selected' : '') + '>USER</option>'
      + '      </select>'
      + '    </div>'
      + '    <div style="display:flex;gap:0.5rem;">'
      + '      <button type="button" class="btn btn-outline" onclick="PORTAL_ADMIN.refreshUsers()"><i class="fa-solid fa-rotate"></i> รีเฟรช</button>'
      + '      <button type="button" class="btn btn-primary" onclick="PORTAL_ADMIN.openUserModal()"><i class="fa-solid fa-user-plus"></i> สร้างบัญชีผู้ใช้งาน</button>'
      + '    </div>'
      + '  </div>'
      + '</div>'
      + '<div class="tbl-wrap">'
      + '  <table class="tbl">'
      + '    <thead>'
      + '      <tr>'
      + '        <th style="width:45px;text-align:center;">#</th>'
      + '        <th>บัญชีผู้ใช้งาน (Username / Email)</th>'
      + '        <th>บุคลากรเจ้าของบัญชี</th>'
      + '        <th>บทบาทสิทธิ์</th>'
      + '        <th>สิทธิ์เว็บแอป</th>'
      + '        <th>สถานะบัญชี</th>'
      + '        <th>เข้าใช้งานล่าสุด</th>'
      + '        <th style="width:95px;text-align:right;">จัดการ</th>'
      + '      </tr>'
      + '    </thead>'
      + '    <tbody>' + rowsHtml + '</tbody>'
      + '  </table>'
      + '</div>';

    var searchInput = document.getElementById('usersSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        ADMIN_STATE.usersSearch = e.target.value;
        renderUsersPage();
      });
    }

    var roleSelect = document.getElementById('usersRoleSelect');
    if (roleSelect) {
      roleSelect.addEventListener('change', function (e) {
        ADMIN_STATE.usersRoleFilter = e.target.value;
        renderUsersPage();
      });
    }
  }

  function quickCreateAccountForPersonnel(personnelId) {
    openUserModal(null, personnelId);
  }

  async function openUserModal(personnelRefId, preselectedPersonnelId) {
    var app = getApp();
    if (!app) return;

    var item = null;
    if (personnelRefId) {
      item = (ADMIN_STATE.users || []).find(function (u) { return u.personnel_ref_id === personnelRefId; });
    }

    var isEdit = !!item;
    var u = item || {};
    var isSetup = app.STATE && app.STATE.isSetupMode;

    // โหลดรายชื่อแอปพลิเคชัน
    var webapps = ADMIN_STATE.webapps;
    if (!webapps || webapps.length === 0) {
      try {
        var wRes = await getApi().listWebapps(true);
        webapps = (wRes && (wRes.webapps || wRes.data)) || [];
        ADMIN_STATE.webapps = webapps;
      } catch (e) { webapps = []; }
    }

    // ตัวเลือกบุคลากร
    var pOptions = '';
    var selectedPid = isEdit ? u.personnel_ref_id : (preselectedPersonnelId || '');
    if (isEdit) {
      pOptions = '<option value="' + esc(u.personnel_ref_id) + '" selected>' + esc(u.full_name || u.personnel_ref_id) + ' (' + esc(u.personnel_ref_id) + ')</option>';
    } else {
      pOptions = '<option value="">-- เลือกบุคลากรที่จะผูกบัญชี --</option>';
      (ADMIN_STATE.personnel || []).forEach(function (p) {
        var isSel = p.personnel_id === selectedPid ? ' selected' : '';
        var disabled = (p.has_user_account && p.personnel_id !== selectedPid) ? ' disabled' : '';
        var extra = p.has_user_account ? ' (มีบัญชีแล้ว)' : '';
        pOptions += '<option value="' + esc(p.personnel_id) + '"' + isSel + disabled + '>' + esc(p.full_name || (p.first_name + ' ' + p.last_name)) + ' [' + esc(p.id_card_number) + ']' + extra + '</option>';
      });
    }

    // สร้าง Permissions Table
    var userPerms = u.permissions || {};
    var permsRows = '';
    webapps.forEach(function (w) {
      var curLvl = userPerms[w.webapp_id] || 'NONE';
      permsRows += ''
        + '<tr>'
        + '  <td>'
        + '    <div style="font-weight:700;">' + esc(w.name) + '</div>'
        + '    <div style="font-size:0.8rem;color:var(--muted);"><code>' + esc(w.webapp_id) + '</code> &bull; ' + esc(w.url) + '</div>'
        + '  </td>'
        + '  <td style="text-align:right;">'
        + '    <select class="sel adm_user_perm_sel" data-appid="' + esc(w.webapp_id) + '" style="width:140px;padding:0.4rem 0.6rem;">'
        + '      <option value="NONE"' + (curLvl === 'NONE' ? ' selected' : '') + '>ไม่มีสิทธิ์</option>'
        + '      <option value="USER"' + (curLvl === 'USER' ? ' selected' : '') + '>ผู้ใช้งาน (USER)</option>'
        + '      <option value="ADMIN"' + (curLvl === 'ADMIN' ? ' selected' : '') + '>ผู้ดูแลแอป (ADMIN)</option>'
        + '    </select>'
        + '  </td>'
        + '</tr>';
    });

    if (!permsRows) {
      permsRows = '<tr><td colspan="2" style="text-align:center;color:var(--muted);padding:1rem;">ยังไม่มีเว็บแอปพลิเคชันในระบบ</td></tr>';
    }

    var title = isEdit
      ? '<i class="fa-solid fa-user-pen"></i> แก้ไขบัญชีผู้ใช้งาน (' + esc(u.username) + ')'
      : '<i class="fa-solid fa-user-plus"></i> ' + (isSetup ? 'สร้างบัญชี SUPERADMIN คนแรก (Setup Mode)' : 'สร้างบัญชีผู้ใช้งานใหม่');

    var roleSelectorHtml = '';
    if (isSetup) {
      roleSelectorHtml = ''
        + '<input type="text" class="inp" value="SUPERADMIN (ระบบกำหนดให้อัตโนมัติ)" readonly style="background:var(--surface2);font-weight:700;color:var(--g1);">'
        + '<input type="hidden" id="adm_u_role" value="SUPERADMIN">';
    } else {
      roleSelectorHtml = ''
        + '<select id="adm_u_role" class="sel" required>'
        + '  <option value="USER"' + (u.role === 'USER' || !u.role ? ' selected' : '') + '>USER (ผู้ใช้งานทั่วไป)</option>'
        + '  <option value="ADMIN"' + (u.role === 'ADMIN' ? ' selected' : '') + '>ADMIN (ผู้ดูแลระบบ)</option>'
        + '  <option value="SUPERADMIN"' + (u.role === 'SUPERADMIN' ? ' selected' : '') + '>SUPERADMIN (ผู้ดูแลระบบสูงสุด)</option>'
        + '</select>';
    }

    var bodyHtml = ''
      + '<form id="admUserForm" onsubmit="event.preventDefault();">'
      + '  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">'
      + '    <div style="grid-column:1/-1;">'
      + '      <label class="lbl">เลือกบุคลากรในทำเนียบที่ต้องการผูกบัญชี <span style="color:var(--red);">*</span></label>'
      + '      <select id="adm_u_pid" class="sel"' + (isEdit ? ' disabled style="background:var(--surface2);"' : ' required') + '>' + pOptions + '</select>'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">ชื่อผู้ใช้งาน (Username) <span style="color:var(--red);">*</span></label>'
      + '      <input type="text" id="adm_u_username" class="inp" placeholder="พิมพ์ตัวพิมพ์เล็ก ตัวเลข เช่น somchai.s" value="' + esc(u.username || '') + '" required>'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">อีเมล (Email Address) <span style="color:var(--red);">*</span></label>'
      + '      <input type="email" id="adm_u_email" class="inp" placeholder="เช่น somchai@bangkok.go.th" value="' + esc(u.email || '') + '" required>'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">รหัสผ่าน ' + (isEdit ? '(เว้นว่างไว้หากไม่เปลี่ยน)' : '<span style="color:var(--red);">*</span>') + '</label>'
      + '      <input type="password" id="adm_u_password" class="inp" placeholder="' + (isEdit ? 'ระบุรหัสผ่านใหม่เมื่อต้องการเปลี่ยน' : 'อย่างน้อย 6 ตัวอักษร') + '"' + (isEdit ? '' : ' required') + '>'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">บทบาทสิทธิ์ (Role) <span style="color:var(--red);">*</span></label>'
      + roleSelectorHtml
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">สถานะบัญชี <span style="color:var(--red);">*</span></label>'
      + '      <select id="adm_u_status" class="sel" required>'
      + '        <option value="ใช้งานปกติ"' + (u.status === 'ใช้งานปกติ' || !u.status ? ' selected' : '') + '>ใช้งานปกติ</option>'
      + '        <option value="รออนุมัติ"' + (u.status === 'รออนุมัติ' ? ' selected' : '') + '>รออนุมัติ</option>'
      + '        <option value="รอการยืนยันอีเมล"' + (u.status === 'รอการยืนยันอีเมล' ? ' selected' : '') + '>รอการยืนยันอีเมล</option>'
      + '        <option value="ระงับการใช้งาน"' + (u.status === 'ระงับการใช้งาน' || u.status === 'ระงับบัญชี' ? ' selected' : '') + '>ระงับการใช้งาน</option>'
      + '      </select>'
      + '    </div>'
      + '    <div style="grid-column:1/-1;margin-top:0.5rem;">'
      + '      <label class="lbl"><i class="fa-solid fa-shield-halved"></i> กำหนดสิทธิ์รายเว็บแอปพลิเคชัน (SSO Permissions Matrix)</label>'
      + '      <div class="tbl-wrap" style="max-height:220px;overflow-y:auto;">'
      + '        <table class="tbl">'
      + '          <thead>'
      + '            <tr>'
      + '              <th>เว็บแอปพลิเคชัน</th>'
      + '              <th style="width:160px;text-align:right;">ระดับสิทธิ์การเข้าถึง</th>'
      + '            </tr>'
      + '          </thead>'
      + '          <tbody>' + permsRows + '</tbody>'
      + '        </table>'
      + '      </div>'
      + '    </div>'
      + '  </div>'
      + '</form>';

    var footerHtml = ''
      + '<button type="button" class="btn btn-outline" onclick="PORTAL_APP.closeModal()">ยกเลิก</button>'
      + '<button type="button" class="btn btn-primary" onclick="PORTAL_ADMIN.submitUserModal()"><i class="fa-solid fa-save"></i> บันทึกบัญชีผู้ใช้งาน</button>';

    app.openModal(title, bodyHtml, footerHtml, '720px');
  }

  async function submitUserModal() {
    var pidEl = document.getElementById('adm_u_pid');
    var pid = pidEl ? pidEl.value.trim() : '';
    var username = (document.getElementById('adm_u_username').value || '').trim();
    var email = (document.getElementById('adm_u_email').value || '').trim();
    var password = document.getElementById('adm_u_password').value;
    var role = document.getElementById('adm_u_role').value;
    var status = document.getElementById('adm_u_status').value;

    if (!pid) {
      alertError('กรุณาเลือกบุคลากรในทำเนียบที่จะผูกบัญชี');
      return;
    }
    if (!username || !email) {
      alertError('กรุณากรอก Username และ Email');
      return;
    }

    // รวบรวม permissions รายแอป
    var permissions = {};
    var permSelects = document.querySelectorAll('.adm_user_perm_sel');
    permSelects.forEach(function (sel) {
      var appId = sel.getAttribute('data-appid');
      if (appId) permissions[appId] = sel.value;
    });

    var payload = {
      personnel_ref_id: pid,
      username: username,
      email: email,
      password: password,
      role: role,
      status: status,
      permissions: permissions
    };

    try {
      var res = await getApi().saveUser(payload);
      getApp().closeModal();

      // ตรวจสอบว่าได้ token auto login หรือไม่ (กรณีสร้าง SUPERADMIN คนแรกใน Setup Mode)
      if (res && res.auto_session_token) {
        if (global.Swal) {
          await global.Swal.fire({
            icon: 'success',
            title: 'สร้าง SUPERADMIN คนแรกสำเร็จ!',
            text: 'ระบบได้ปิดโหมดตั้งค่าเริ่มต้น (Setup Mode) และนำท่านเข้าสู่ระบบโดยอัตโนมัติแล้ว',
            confirmButtonText: 'เข้าสู่หน้าหลัก'
          });
        } else {
          alert('สร้าง SUPERADMIN คนแรกสำเร็จ! ระบบเข้าสู่ระบบให้ท่านอัตโนมัติแล้ว');
        }
        getApp().bootSystem();
        return;
      }

      toast(res.message || 'บันทึกบัญชีผู้ใช้งานสำเร็จ');
      await loadUsersData(true);
      await loadPersonnelData(true);
      renderUsersPage();
    } catch (err) {
      alertError(err.message || 'บันทึกบัญชีผู้ใช้งานไม่สำเร็จ');
    }
  }

  async function deleteUser(personnelRefId, username) {
    if (!personnelRefId) return;
    var confirmText = 'คุณต้องการลบบัญชีผู้ใช้งาน "' + (username || personnelRefId) + '" ใช่หรือไม่? (ข้อมูลบุคลากรในทำเนียบจะไม่ถูกลบ)';
    if (global.Swal) {
      var r = await global.Swal.fire({
        title: 'ยืนยันการลบบัญชีผู้ใช้',
        text: confirmText,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E53935',
        cancelButtonColor: '#64748B',
        confirmButtonText: 'ลบบัญชี',
        cancelButtonText: 'ยกเลิก'
      });
      if (!r.isConfirmed) return;
    } else {
      if (!confirm(confirmText)) return;
    }

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
    app.setPageHeader(
      'จัดการเว็บแอปพลิเคชันย่อย (SSO WebApps)',
      'ลงทะเบียนเว็บแอปพลิเคชันในระบบ กำหนด URL ปลายทาง และจัดการไอคอนสำหรับเชื่อมต่อ Single Sign-On (SSO)'
    );

    var pageBody = document.getElementById('pageBody');
    if (!pageBody) return;

    var rowsHtml = '';
    var list = ADMIN_STATE.webapps || [];
    if (list.length === 0) {
      rowsHtml = '<tr><td colspan="7" style="text-align:center;padding:2.5rem;color:var(--muted);"><i class="fa-solid fa-layer-group" style="font-size:2rem;margin-bottom:0.5rem;display:block;"></i>ยังไม่มีเว็บแอปพลิเคชันในระบบ</td></tr>';
    } else {
      list.forEach(function (w, idx) {
        var iconHtml = '';
        if (w.icon_url && w.icon_url.indexOf('fa-') !== -1) {
          iconHtml = '<i class="' + esc(w.icon_url) + '" style="font-size:1.4rem;color:var(--primary);"></i>';
        } else if (w.icon_url) {
          iconHtml = '<img src="' + esc(resolveDriveImg(w.icon_url)) + '" alt="Icon" style="width:36px;height:36px;object-fit:cover;border-radius:0.5rem;">';
        } else {
          iconHtml = '<i class="fa-solid fa-shapes" style="font-size:1.4rem;color:var(--primary);"></i>';
        }

        var statusChip = (w.status === 'เปิดใช้งาน') ? 'chip' : 'chip red';

        rowsHtml += ''
          + '<tr>'
          + '  <td style="text-align:center;font-weight:700;color:var(--muted);">' + esc(w.sort_order || (idx + 1)) + '</td>'
          + '  <td style="text-align:center;">' + iconHtml + '</td>'
          + '  <td><code>' + esc(w.webapp_id) + '</code></td>'
          + '  <td>'
          + '    <div style="font-weight:700;color:var(--text);">' + esc(w.name) + '</div>'
          + '    <div style="font-size:0.8rem;color:var(--muted);">' + esc(w.description || '-') + '</div>'
          + '  </td>'
          + '  <td><a href="' + esc(w.url) + '" target="_blank" style="color:var(--g1);text-decoration:none;">' + esc(w.url) + '</a></td>'
          + '  <td><span class="' + statusChip + '">' + esc(w.status || 'เปิดใช้งาน') + '</span></td>'
          + '  <td style="text-align:right;">'
          + '    <button type="button" class="btn btn-sm btn-outline" onclick="PORTAL_APP.launchSubApp(ADMIN_STATE.webapps[' + idx + '])" title="ทดสอบเปิดแอปผ่าน SSO"><i class="fa-solid fa-arrow-up-right-from-square"></i></button>'
          + '    <button type="button" class="btn btn-sm btn-outline" onclick="PORTAL_ADMIN.openWebappModal(\'' + esc(w.webapp_id) + '\')" title="แก้ไขแอป"><i class="fa-solid fa-pen-to-square"></i></button>'
          + '    <button type="button" class="btn btn-sm btn-outline" style="color:var(--red);border-color:rgba(229,57,53,0.3);" onclick="PORTAL_ADMIN.deleteWebapp(\'' + esc(w.webapp_id) + '\', \'' + esc(w.name) + '\')" title="ลบแอป"><i class="fa-solid fa-trash-can"></i></button>'
          + '  </td>'
          + '</tr>';
      });
    }

    pageBody.innerHTML = ''
      + '<div class="card" style="margin-bottom:1.25rem;">'
      + '  <div style="display:flex;justify-content:space-between;align-items:center;">'
      + '    <div style="font-size:0.95rem;color:var(--muted);">ลงทะเบียนเว็บแอปพลิเคชันทั้งหมด <b>' + list.length + '</b> ระบบ</div>'
      + '    <div style="display:flex;gap:0.5rem;">'
      + '      <button type="button" class="btn btn-outline" onclick="PORTAL_ADMIN.refreshWebapps()"><i class="fa-solid fa-rotate"></i> รีเฟรช</button>'
      + '      <button type="button" class="btn btn-primary" onclick="PORTAL_ADMIN.openWebappModal()"><i class="fa-solid fa-plus"></i> เพิ่มเว็บแอปพลิเคชัน</button>'
      + '    </div>'
      + '  </div>'
      + '</div>'
      + '<div class="tbl-wrap">'
      + '  <table class="tbl">'
      + '    <thead>'
      + '      <tr>'
      + '        <th style="width:50px;text-align:center;">ลำดับ</th>'
      + '        <th style="width:60px;text-align:center;">ไอคอน</th>'
      + '        <th style="width:110px;">รหัสแอป</th>'
      + '        <th>ชื่อเว็บแอปพลิเคชัน / รายละเอียด</th>'
      + '        <th>URL ปลายทาง</th>'
      + '        <th style="width:110px;">สถานะ</th>'
      + '        <th style="width:140px;text-align:right;">จัดการ</th>'
      + '      </tr>'
      + '    </thead>'
      + '    <tbody>' + rowsHtml + '</tbody>'
      + '  </table>'
      + '</div>';
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
    var title = isEdit ? '<i class="fa-solid fa-pen-to-square"></i> แก้ไขเว็บแอปพลิเคชัน (' + esc(w.webapp_id) + ')' : '<i class="fa-solid fa-plus"></i> เพิ่มเว็บแอปพลิเคชันใหม่';

    var bodyHtml = ''
      + '<form id="admWebappForm" onsubmit="event.preventDefault();">'
      + '  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">'
      + '    <div>'
      + '      <label class="lbl">รหัสเว็บแอปพลิเคชัน (Webapp ID) <span style="color:var(--red);">*</span></label>'
      + '      <input type="text" id="adm_w_id" class="inp" placeholder="เช่น APP0002" value="' + esc(w.webapp_id || '') + '"' + (isEdit ? ' readonly style="background:var(--surface2);"' : ' required') + '>'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">ลำดับแสดงผล (Sort Order)</label>'
      + '      <input type="number" id="adm_w_sort" class="inp" value="' + esc(w.sort_order || 1) + '">'
      + '    </div>'
      + '    <div style="grid-column:1/-1;">'
      + '      <label class="lbl">ชื่อเว็บแอปพลิเคชัน <span style="color:var(--red);">*</span></label>'
      + '      <input type="text" id="adm_w_name" class="inp" placeholder="เช่น ระบบงานตรวจและจับกุม" value="' + esc(w.name || '') + '" required>'
      + '    </div>'
      + '    <div style="grid-column:1/-1;">'
      + '      <label class="lbl">URL ปลายทาง <span style="color:var(--red);">*</span></label>'
      + '      <input type="text" id="adm_w_url" class="inp" placeholder="เช่น ../sample-subapp/index.html หรือ Full URL" value="' + esc(w.url || '') + '" required>'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">ไอคอน (FontAwesome Class หรือ URL)</label>'
      + '      <input type="text" id="adm_w_icon" class="inp" placeholder="fa-solid fa-layer-group หรือ URL ภาพ" value="' + esc(w.icon_url || '') + '">'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">สถานะ <span style="color:var(--red);">*</span></label>'
      + '      <select id="adm_w_status" class="sel" required>'
      + '        <option value="เปิดใช้งาน"' + (w.status === 'เปิดใช้งาน' || !w.status ? ' selected' : '') + '>เปิดใช้งาน</option>'
      + '        <option value="ปิดปรับปรุง"' + (w.status === 'ปิดปรับปรุง' ? ' selected' : '') + '>ปิดปรับปรุง</option>'
      + '      </select>'
      + '    </div>'
      + '    <div style="grid-column:1/-1;">'
      + '      <label class="lbl">อัปโหลดไฟล์ไอคอนภาพเข้า Google Drive (ตัวเลือก)</label>'
      + '      <input type="file" id="adm_w_icon_file" accept="image/*" style="font-size:0.85rem;">'
      + '    </div>'
      + '    <div style="grid-column:1/-1;">'
      + '      <label class="lbl">คำอธิบายระบบ</label>'
      + '      <textarea id="adm_w_desc" class="inp" rows="3" placeholder="ระบุรายละเอียดสั้นๆ ของระบบงาน">' + esc(w.description || '') + '</textarea>'
      + '    </div>'
      + '  </div>'
      + '</form>';

    var footerHtml = ''
      + '<button type="button" class="btn btn-outline" onclick="PORTAL_APP.closeModal()">ยกเลิก</button>'
      + '<button type="button" class="btn btn-primary" onclick="PORTAL_ADMIN.submitWebappModal()"><i class="fa-solid fa-save"></i> บันทึกข้อมูลเว็บแอป</button>';

    app.openModal(title, bodyHtml, footerHtml, '650px');

    var fileInput = document.getElementById('adm_w_icon_file');
    if (fileInput) {
      fileInput.addEventListener('change', async function () {
        if (!fileInput.files || !fileInput.files[0]) return;
        var file = fileInput.files[0];
        try {
          var folderId = (app.STATE.settings && app.STATE.settings.App_Icon_Folder_ID) || '';
          if (global.LOADER) global.LOADER.busy(Promise.resolve(), 'กำลังอัปโหลดไอคอนเข้า Google Drive...');
          var upRes = await global.STB_DRIVE.uploadToDrive({
            file: file,
            folderId: folderId,
            fileName: 'ICON_' + (document.getElementById('adm_w_id').value || 'APP') + '_' + Date.now()
          });
          var finalUrl = (upRes && (upRes.fileUrl || upRes.downloadUrl)) || '';
          document.getElementById('adm_w_icon').value = finalUrl;
          toast('อัปโหลดไอคอนเข้า Google Drive สำเร็จ');
        } catch (e) {
          alertError('อัปโหลดไอคอนล้มเหลว: ' + e.message);
        } finally {
          if (global.LOADER) global.LOADER.hide();
        }
      });
    }
  }

  async function submitWebappModal() {
    var id = (document.getElementById('adm_w_id').value || '').trim();
    var name = (document.getElementById('adm_w_name').value || '').trim();
    var url = (document.getElementById('adm_w_url').value || '').trim();

    if (!name || !url) {
      alertError('กรุณากรอกชื่อเว็บแอปพลิเคชันและ URL ปลายทาง');
      return;
    }

    var payload = {
      webapp_id: id,
      name: name,
      url: url,
      icon_url: document.getElementById('adm_w_icon').value.trim(),
      status: document.getElementById('adm_w_status').value,
      sort_order: parseInt(document.getElementById('adm_w_sort').value, 10) || 1,
      description: document.getElementById('adm_w_desc').value.trim()
    };

    try {
      var res = await getApi().saveWebapp(payload);
      toast(res.message || 'บันทึกข้อมูลเว็บแอปพลิเคชันสำเร็จ');
      getApp().closeModal();
      await loadWebappsData(true);
      renderWebappsPage();
    } catch (err) {
      alertError(err.message || 'บันทึกข้อมูลเว็บแอปพลิเคชันไม่สำเร็จ');
    }
  }

  async function deleteWebapp(webappId, name) {
    if (!webappId) return;
    var confirmText = 'คุณต้องการลบเว็บแอปพลิเคชัน "' + (name || webappId) + '" ออกจากระบบใช่หรือไม่?';
    if (global.Swal) {
      var r = await global.Swal.fire({
        title: 'ยืนยันการลบเว็บแอป',
        text: confirmText,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E53935',
        cancelButtonColor: '#64748B',
        confirmButtonText: 'ลบเว็บแอป',
        cancelButtonText: 'ยกเลิก'
      });
      if (!r.isConfirmed) return;
    } else {
      if (!confirm(confirmText)) return;
    }

    try {
      var res = await getApi().deleteWebapp(webappId);
      toast(res.message || 'ลบเว็บแอปพลิเคชันสำเร็จ');
      await loadWebappsData(true);
      renderWebappsPage();
    } catch (err) {
      alertError(err.message || 'ไม่สามารถลบเว็บแอปพลิเคชันได้');
    }
  }

  // ===========================================================================
  // 4. โมดูลจัดการโครงสร้างสังกัด 4 ระดับ & คำนำหน้าชื่อ (#reference)
  // ===========================================================================
  function renderReferencePage() {
    var app = getApp();
    if (!app) return;
    app.setPageHeader(
      'จัดการโครงสร้างสังกัด 4 ระดับ & คำนำหน้าชื่อ',
      'จัดระเบียบข้อมูลคำนำหน้าชื่อ สำนัก สำนักงาน/กอง ฝ่าย/ส่วน และกลุ่มงาน พร้อมปุ่มเลื่อนลำดับ ▲▼ และเพิ่มแบบกลุ่ม (Batch Add)'
    );

    var pageBody = document.getElementById('pageBody');
    if (!pageBody) return;

    var curTab = ADMIN_STATE.currentRefTab || 'PREFIX';
    var tabs = [
      { id: 'PREFIX', name: '1. คำนำหน้าชื่อ' },
      { id: 'BUREAU', name: '2. สำนัก (BUREAU)' },
      { id: 'OFFICE', name: '3. สำนักงาน/กอง (OFFICE)' },
      { id: 'DEPARTMENT', name: '4. ฝ่าย/ส่วน (DEPARTMENT)' },
      { id: 'DIVISION', name: '5. กลุ่มงาน (DIVISION)' }
    ];

    var tabButtonsHtml = '<div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:1.25rem;">';
    tabs.forEach(function (t) {
      var activeClass = (t.id === curTab) ? 'btn-primary' : 'btn-outline';
      tabButtonsHtml += '<button type="button" class="btn btn-sm ' + activeClass + '" onclick="PORTAL_ADMIN.switchRefTab(\'' + t.id + '\')">' + esc(t.name) + '</button>';
    });
    tabButtonsHtml += '</div>';

    // กรอง Parent Selector สำหรับแท็บ OFFICE, DEPARTMENT, DIVISION
    var parentFilterHtml = '';
    var parentVal = ADMIN_STATE.currentRefParentFilter || '';
    if (curTab === 'OFFICE') {
      var bureauList = (app.STATE.referenceData || []).filter(function (x) { return x.type === 'BUREAU'; });
      parentFilterHtml = ''
        + '<div style="display:flex;align-items:center;gap:0.5rem;">'
        + '  <span style="font-size:0.88rem;font-weight:700;">สังกัดสำนัก:</span>'
        + '  <select id="refParentFilterSel" class="sel" style="width:220px;" onchange="PORTAL_ADMIN.setRefParentFilter(this.value)">'
        + '    <option value="">-- ทั้งหมด --</option>'
        + bureauList.map(function (b) { return '<option value="' + esc(b.value) + '"' + (parentVal === b.value ? ' selected' : '') + '>' + esc(b.value) + '</option>'; }).join('')
        + '  </select>'
        + '</div>';
    } else if (curTab === 'DEPARTMENT') {
      var officeList = (app.STATE.referenceData || []).filter(function (x) { return x.type === 'OFFICE'; });
      parentFilterHtml = ''
        + '<div style="display:flex;align-items:center;gap:0.5rem;">'
        + '  <span style="font-size:0.88rem;font-weight:700;">สังกัดสำนักงาน/กอง:</span>'
        + '  <select id="refParentFilterSel" class="sel" style="width:240px;" onchange="PORTAL_ADMIN.setRefParentFilter(this.value)">'
        + '    <option value="">-- ทั้งหมด --</option>'
        + officeList.map(function (o) { return '<option value="' + esc(o.value) + '"' + (parentVal === o.value ? ' selected' : '') + '>' + esc(o.value) + '</option>'; }).join('')
        + '  </select>'
        + '</div>';
    } else if (curTab === 'DIVISION') {
      var deptList = (app.STATE.referenceData || []).filter(function (x) { return x.type === 'DEPARTMENT'; });
      parentFilterHtml = ''
        + '<div style="display:flex;align-items:center;gap:0.5rem;">'
        + '  <span style="font-size:0.88rem;font-weight:700;">สังกัดฝ่าย/ส่วน:</span>'
        + '  <select id="refParentFilterSel" class="sel" style="width:240px;" onchange="PORTAL_ADMIN.setRefParentFilter(this.value)">'
        + '    <option value="">-- ทั้งหมด --</option>'
        + deptList.map(function (d) { return '<option value="' + esc(d.value) + '"' + (parentVal === d.value ? ' selected' : '') + '>' + esc(d.value) + '</option>'; }).join('')
        + '  </select>'
        + '</div>';
    }

    // กรองรายการข้อมูลในตาราง
    var allRefs = app.STATE.referenceData || [];
    var filtered = allRefs.filter(function (r) {
      if (r.type !== curTab) return false;
      if (parentVal && r.parent_value !== parentVal) return false;
      return true;
    }).sort(function (a, b) {
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

    var rowsHtml = '';
    if (filtered.length === 0) {
      rowsHtml = '<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:var(--muted);"><i class="fa-solid fa-inbox" style="font-size:2rem;margin-bottom:0.5rem;display:block;"></i>ไม่พบข้อมูลในหมวดหมู่นี้</td></tr>';
    } else {
      filtered.forEach(function (r, idx) {
        var isFirst = (idx === 0);
        var isLast = (idx === filtered.length - 1);
        rowsHtml += ''
          + '<tr>'
          + '  <td style="text-align:center;font-weight:700;color:var(--muted);">' + esc(r.sort_order || (idx + 1)) + '</td>'
          + '  <td style="font-weight:700;color:var(--text);">' + esc(r.value) + '</td>'
          + '  <td>' + esc(r.short_name || '-') + '</td>'
          + '  <td>' + esc(r.parent_value || '-') + '</td>'
          + '  <td style="text-align:center;">'
          + '    <button type="button" class="btn btn-sm btn-outline" style="padding:0.25rem 0.5rem;" onclick="PORTAL_ADMIN.moveReference(\'' + esc(r.reference_id) + '\', \'UP\')"' + (isFirst ? ' disabled' : '') + ' title="เลื่อนขึ้น">▲</button>'
          + '    <button type="button" class="btn btn-sm btn-outline" style="padding:0.25rem 0.5rem;" onclick="PORTAL_ADMIN.moveReference(\'' + esc(r.reference_id) + '\', \'DOWN\')"' + (isLast ? ' disabled' : '') + ' title="เลื่อนลง">▼</button>'
          + '  </td>'
          + '  <td style="text-align:right;">'
          + '    <button type="button" class="btn btn-sm btn-outline" onclick="PORTAL_ADMIN.openSingleReferenceModal(\'' + esc(r.reference_id) + '\')" title="แก้ไข"><i class="fa-solid fa-pen-to-square"></i></button>'
          + '    <button type="button" class="btn btn-sm btn-outline" style="color:var(--red);border-color:rgba(229,57,53,0.3);" onclick="PORTAL_ADMIN.deleteReference(\'' + esc(r.reference_id) + '\', \'' + esc(r.value) + '\')" title="ลบ"><i class="fa-solid fa-trash-can"></i></button>'
          + '  </td>'
          + '</tr>';
      });
    }

    pageBody.innerHTML = ''
      + tabButtonsHtml
      + '<div class="card" style="margin-bottom:1.25rem;">'
      + '  <div style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:center;justify-content:space-between;">'
      + '    <div>' + parentFilterHtml + '</div>'
      + '    <div style="display:flex;gap:0.5rem;">'
      + '      <button type="button" class="btn btn-outline" onclick="PORTAL_ADMIN.openBatchReferenceModal(\'' + curTab + '\')"><i class="fa-solid fa-file-circle-plus"></i> ➕ เพิ่มแบบกลุ่ม (Batch Add)</button>'
      + '      <button type="button" class="btn btn-primary" onclick="PORTAL_ADMIN.openSingleReferenceModal()"><i class="fa-solid fa-plus"></i> เพิ่มรายการเดี่ยว</button>'
      + '    </div>'
      + '  </div>'
      + '</div>'
      + '<div class="tbl-wrap">'
      + '  <table class="tbl">'
      + '    <thead>'
      + '      <tr>'
      + '        <th style="width:60px;text-align:center;">ลำดับ</th>'
      + '        <th>ค่าข้อมูล (Value)</th>'
      + '        <th style="width:140px;">ชื่อย่อ (Short Name)</th>'
      + '        <th>สังกัดแม่ (Parent)</th>'
      + '        <th style="width:100px;text-align:center;">เลื่อนลำดับ</th>'
      + '        <th style="width:95px;text-align:right;">จัดการ</th>'
      + '      </tr>'
      + '    </thead>'
      + '    <tbody>' + rowsHtml + '</tbody>'
      + '  </table>'
      + '</div>';
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
      parentOptionsHtml = '<select id="adm_ref_parent_val" class="sel">' + bureaus.map(function (b) { return '<option value="' + esc(b.value) + '"' + (r.parent_value === b.value ? ' selected' : '') + '>' + esc(b.value) + '</option>'; }).join('') + '</select>';
    } else if (type === 'DEPARTMENT') {
      parentType = 'OFFICE';
      var offices = (app.STATE.referenceData || []).filter(function (x) { return x.type === 'OFFICE'; });
      parentOptionsHtml = '<select id="adm_ref_parent_val" class="sel">' + offices.map(function (o) { return '<option value="' + esc(o.value) + '"' + (r.parent_value === o.value ? ' selected' : '') + '>' + esc(o.value) + '</option>'; }).join('') + '</select>';
    } else if (type === 'DIVISION') {
      parentType = 'DEPARTMENT';
      var depts = (app.STATE.referenceData || []).filter(function (x) { return x.type === 'DEPARTMENT'; });
      parentOptionsHtml = '<select id="adm_ref_parent_val" class="sel">' + depts.map(function (d) { return '<option value="' + esc(d.value) + '"' + (r.parent_value === d.value ? ' selected' : '') + '>' + esc(d.value) + '</option>'; }).join('') + '</select>';
    }

    var title = isEdit ? '<i class="fa-solid fa-pen-to-square"></i> แก้ไขรายการอ้างอิง' : '<i class="fa-solid fa-plus"></i> เพิ่มรายการอ้างอิง (' + esc(type) + ')';

    var bodyHtml = ''
      + '<form id="admRefForm" onsubmit="event.preventDefault();">'
      + '  <input type="hidden" id="adm_ref_id" value="' + esc(r.reference_id || '') + '">'
      + '  <input type="hidden" id="adm_ref_type" value="' + esc(type) + '">'
      + '  <input type="hidden" id="adm_ref_parent_type" value="' + esc(parentType) + '">'
      + '  <div style="display:flex;flex-direction:column;gap:1rem;">'
      + '    <div>'
      + '      <label class="lbl">ประเภทข้อมูล (Type)</label>'
      + '      <input type="text" class="inp" value="' + esc(type) + '" readonly style="background:var(--surface2);font-weight:700;">'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">ค่าข้อมูล (Value / ชื่อเต็ม) <span style="color:var(--red);">*</span></label>'
      + '      <input type="text" id="adm_ref_val" class="inp" placeholder="เช่น ฝ่ายตรวจและบังคับการ 1" value="' + esc(r.value || '') + '" required>'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">ชื่อย่อ (Short Name)</label>'
      + '      <input type="text" id="adm_ref_short" class="inp" placeholder="เช่น ฝตบ.1" value="' + esc(r.short_name || '') + '">'
      + '    </div>'
      + (parentType ? '<div><label class="lbl">สังกัดหน่วยงานแม่ (' + esc(parentType) + ')</label>' + parentOptionsHtml + '</div>' : '')
      + '    <div>'
      + '      <label class="lbl">ลำดับแสดงผล (Sort Order)</label>'
      + '      <input type="number" id="adm_ref_sort" class="inp" value="' + esc(r.sort_order || 1) + '">'
      + '    </div>'
      + '  </div>'
      + '</form>';

    var footerHtml = ''
      + '<button type="button" class="btn btn-outline" onclick="PORTAL_APP.closeModal()">ยกเลิก</button>'
      + '<button type="button" class="btn btn-primary" onclick="PORTAL_ADMIN.submitSingleReferenceModal()"><i class="fa-solid fa-save"></i> บันทึกข้อมูล</button>';

    app.openModal(title, bodyHtml, footerHtml, '520px');
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

      // รีเฟรช cache ใน PORTAL_APP.STATE
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
      parentOptionsHtml = '<div><label class="lbl">สังกัดสำนักแม่ (BUREAU)</label><select id="adm_batch_ref_parent" class="sel">' + bureaus.map(function (b) { return '<option value="' + esc(b.value) + '">' + esc(b.value) + '</option>'; }).join('') + '</select></div>';
    } else if (type === 'DEPARTMENT') {
      parentType = 'OFFICE';
      var offices = (app.STATE.referenceData || []).filter(function (x) { return x.type === 'OFFICE'; });
      parentOptionsHtml = '<div><label class="lbl">สังกัดสำนักงานแม่ (OFFICE)</label><select id="adm_batch_ref_parent" class="sel">' + offices.map(function (o) { return '<option value="' + esc(o.value) + '">' + esc(o.value) + '</option>'; }).join('') + '</select></div>';
    } else if (type === 'DIVISION') {
      parentType = 'DEPARTMENT';
      var depts = (app.STATE.referenceData || []).filter(function (x) { return x.type === 'DEPARTMENT'; });
      parentOptionsHtml = '<div><label class="lbl">สังกัดฝ่ายแม่ (DEPARTMENT)</label><select id="adm_batch_ref_parent" class="sel">' + depts.map(function (d) { return '<option value="' + esc(d.value) + '">' + esc(d.value) + '</option>'; }).join('') + '</select></div>';
    }

    var title = '<i class="fa-solid fa-file-circle-plus"></i> เพิ่มข้อมูลอ้างอิงแบบกลุ่ม (Batch Add: ' + esc(type) + ')';
    var bodyHtml = ''
      + '<form id="admBatchRefForm" onsubmit="event.preventDefault();">'
      + '  <input type="hidden" id="adm_batch_ref_type" value="' + esc(type) + '">'
      + '  <input type="hidden" id="adm_batch_ref_parent_type" value="' + esc(parentType) + '">'
      + '  <div style="display:flex;flex-direction:column;gap:1rem;">'
      + parentOptionsHtml
      + '    <div>'
      + '      <label class="lbl">รายการข้อมูล (ข้อมูลละ 1 บรรทัด / หรือคั่นด้วยจุลภาค: ชื่อย่อ, ชื่อเต็ม) <span style="color:var(--red);">*</span></label>'
      + '      <textarea id="adm_batch_ref_text" class="inp" rows="9" placeholder="ตัวอย่าง:\nนาย\nนาง\nนางสาว\nหรือ\nฝตบ.1, ฝ่ายตรวจและบังคับการ 1\nฝตบ.2, ฝ่ายตรวจและบังคับการ 2"></textarea>'
      + '    </div>'
      + '  </div>'
      + '</form>';

    var footerHtml = ''
      + '<button type="button" class="btn btn-outline" onclick="PORTAL_APP.closeModal()">ยกเลิก</button>'
      + '<button type="button" class="btn btn-primary" onclick="PORTAL_ADMIN.submitBatchReferenceModal()"><i class="fa-solid fa-plus-circle"></i> บันทึกข้อมูลแบบกลุ่ม</button>';

    app.openModal(title, bodyHtml, footerHtml, '560px');
  }

  async function submitBatchReferenceModal() {
    var rawText = (document.getElementById('adm_batch_ref_text').value || '').trim();
    if (!rawText) {
      alertError('กรุณากรอกรายการข้อมูลอย่างน้อย 1 รายการ');
      return;
    }

    var type = document.getElementById('adm_batch_ref_type').value;
    var parentType = document.getElementById('adm_batch_ref_parent_type').value;
    var parentValEl = document.getElementById('adm_batch_ref_parent');
    var parentVal = parentValEl ? parentValEl.value.trim() : '';

    var lines = rawText.split('\n');
    var items = [];
    lines.forEach(function (ln) {
      var trimmed = ln.trim();
      if (!trimmed) return;
      var shortName = '';
      var val = trimmed;
      if (trimmed.indexOf(',') !== -1) {
        var parts = trimmed.split(',');
        shortName = parts[0].trim();
        val = parts.slice(1).join(',').trim();
      }
      items.push({
        type: type,
        value: val,
        short_name: shortName,
        parent_type: parentType,
        parent_value: parentVal
      });
    });

    if (items.length === 0) {
      alertError('ไม่พบข้อมูลที่ถูกต้องสำหรับบันทึก');
      return;
    }

    try {
      var res = await getApi().saveReferenceData({ mode: 'BATCH', items: items });
      toast(res.message || 'เพิ่มข้อมูลอ้างอิงแบบกลุ่มสำเร็จ (' + items.length + ' รายการ)');
      getApp().closeModal();

      var bootRes = await getApi().checkSystemInit(true);
      if (bootRes && bootRes.reference_data) {
        getApp().STATE.referenceData = bootRes.reference_data;
      }
      renderReferencePage();
    } catch (err) {
      alertError(err.message || 'บันทึกข้อมูลแบบกลุ่มไม่สำเร็จ');
    }
  }

  async function deleteReference(referenceId, name) {
    if (!referenceId) return;
    var confirmText = 'คุณต้องการลบข้อมูล "' + (name || referenceId) + '" ออกจากระบบใช่หรือไม่?';
    if (global.Swal) {
      var r = await global.Swal.fire({
        title: 'ยืนยันการลบข้อมูล',
        text: confirmText,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E53935',
        cancelButtonColor: '#64748B',
        confirmButtonText: 'ลบข้อมูล',
        cancelButtonText: 'ยกเลิก'
      });
      if (!r.isConfirmed) return;
    } else {
      if (!confirm(confirmText)) return;
    }

    try {
      var res = await getApi().deleteReferenceData(referenceId);
      toast(res.message || 'ลบข้อมูลเรียบร้อยแล้ว');

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
  // 5. โมดูลจัดการโครงสร้างตำแหน่ง 6 ประเภท กทม. (#positions)
  // ===========================================================================
  function renderPositionsPage() {
    var app = getApp();
    if (!app) return;
    app.setPageHeader(
      'จัดการโครงสร้างสายงานและตำแหน่ง 6 ประเภท กทม.',
      'จัดระเบียบโครงสร้างประเภทตำแหน่ง สายงาน และระดับตำแหน่งตามมาตรฐาน กทม. พร้อมปุ่มเลื่อนลำดับ ▲▼ และเพิ่มแบบกลุ่ม (Batch Add)'
    );

    var pageBody = document.getElementById('pageBody');
    if (!pageBody) return;

    var curTab = ADMIN_STATE.currentPosTab || 'ผู้บริหาร';
    var tabs = [
      'ผู้บริหาร',
      'ประเภททั่วไป',
      'ประเภทวิชาการ',
      'ลูกจ้างประจำ',
      'ลูกจ้างชั่วคราว',
      'จ้างเหมาบริการฯ'
    ];

    var tabButtonsHtml = '<div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:1.25rem;">';
    tabs.forEach(function (t) {
      var activeClass = (t === curTab) ? 'btn-primary' : 'btn-outline';
      tabButtonsHtml += '<button type="button" class="btn btn-sm ' + activeClass + '" onclick="PORTAL_ADMIN.switchPosTab(\'' + t + '\')">' + esc(t) + '</button>';
    });
    tabButtonsHtml += '</div>';

    var allPositions = app.STATE.positionStructure || [];
    var filtered = allPositions.filter(function (p) {
      return p.position_type === curTab;
    }).sort(function (a, b) {
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

    var rowsHtml = '';
    if (filtered.length === 0) {
      rowsHtml = '<tr><td colspan="5" style="text-align:center;padding:2.5rem;color:var(--muted);"><i class="fa-solid fa-inbox" style="font-size:2rem;margin-bottom:0.5rem;display:block;"></i>ไม่พบตำแหน่งในประเภทนี้</td></tr>';
    } else {
      filtered.forEach(function (p, idx) {
        var isFirst = (idx === 0);
        var isLast = (idx === filtered.length - 1);
        rowsHtml += ''
          + '<tr>'
          + '  <td style="text-align:center;font-weight:700;color:var(--muted);">' + esc(p.sort_order || (idx + 1)) + '</td>'
          + '  <td style="font-weight:700;color:var(--text);">' + esc(p.position_name) + '</td>'
          + '  <td><span class="chip">' + esc(p.position_level || 'ไม่มีระดับ') + '</span></td>'
          + '  <td style="text-align:center;">'
          + '    <button type="button" class="btn btn-sm btn-outline" style="padding:0.25rem 0.5rem;" onclick="PORTAL_ADMIN.movePosition(\'' + esc(p.pos_id) + '\', \'UP\')"' + (isFirst ? ' disabled' : '') + ' title="เลื่อนขึ้น">▲</button>'
          + '    <button type="button" class="btn btn-sm btn-outline" style="padding:0.25rem 0.5rem;" onclick="PORTAL_ADMIN.movePosition(\'' + esc(p.pos_id) + '\', \'DOWN\')"' + (isLast ? ' disabled' : '') + ' title="เลื่อนลง">▼</button>'
          + '  </td>'
          + '  <td style="text-align:right;">'
          + '    <button type="button" class="btn btn-sm btn-outline" onclick="PORTAL_ADMIN.openSinglePositionModal(\'' + esc(p.pos_id) + '\')" title="แก้ไข"><i class="fa-solid fa-pen-to-square"></i></button>'
          + '    <button type="button" class="btn btn-sm btn-outline" style="color:var(--red);border-color:rgba(229,57,53,0.3);" onclick="PORTAL_ADMIN.deletePosition(\'' + esc(p.pos_id) + '\', \'' + esc(p.position_name) + '\')" title="ลบ"><i class="fa-solid fa-trash-can"></i></button>'
          + '  </td>'
          + '</tr>';
      });
    }

    pageBody.innerHTML = ''
      + tabButtonsHtml
      + '<div class="card" style="margin-bottom:1.25rem;">'
      + '  <div style="display:flex;justify-content:space-between;align-items:center;">'
      + '    <div style="font-size:0.95rem;color:var(--muted);">โครงสร้างตำแหน่งประเภท <b>' + esc(curTab) + '</b> มีทั้งหมด <b>' + filtered.length + '</b> ตำแหน่ง</div>'
      + '    <div style="display:flex;gap:0.5rem;">'
      + '      <button type="button" class="btn btn-outline" onclick="PORTAL_ADMIN.openBatchPositionModal(\'' + curTab + '\')"><i class="fa-solid fa-file-circle-plus"></i> ➕ เพิ่มแบบกลุ่ม (Batch Add)</button>'
      + '      <button type="button" class="btn btn-primary" onclick="PORTAL_ADMIN.openSinglePositionModal()"><i class="fa-solid fa-plus"></i> เพิ่มตำแหน่งเดี่ยว</button>'
      + '    </div>'
      + '  </div>'
      + '</div>'
      + '<div class="tbl-wrap">'
      + '  <table class="tbl">'
      + '    <thead>'
      + '      <tr>'
      + '        <th style="width:60px;text-align:center;">ลำดับ</th>'
      + '        <th>สายงาน / ชื่อตำแหน่ง (Position Name)</th>'
      + '        <th style="width:160px;">ระดับตำแหน่ง (Level)</th>'
      + '        <th style="width:100px;text-align:center;">เลื่อนลำดับ</th>'
      + '        <th style="width:95px;text-align:right;">จัดการ</th>'
      + '      </tr>'
      + '    </thead>'
      + '    <tbody>' + rowsHtml + '</tbody>'
      + '  </table>'
      + '</div>';
  }

  function switchPosTab(tabName) {
    ADMIN_STATE.currentPosTab = tabName;
    renderPositionsPage();
  }

  async function movePosition(posId, direction) {
    var app = getApp();
    if (!app) return;
    var curTab = ADMIN_STATE.currentPosTab;

    var list = (app.STATE.positionStructure || []).filter(function (p) {
      return p.position_type === curTab;
    }).sort(function (a, b) {
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

    var idx = list.findIndex(function (x) { return x.pos_id === posId; });
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
      await getApi().savePositionStructure({ pos_id: itemA.pos_id, sort_order: sortB });
      await getApi().savePositionStructure({ pos_id: itemB.pos_id, sort_order: sortA });

      itemA.sort_order = sortB;
      itemB.sort_order = sortA;
      renderPositionsPage();
      toast('ปรับลำดับตำแหน่งเรียบร้อย');
    } catch (e) {
      alertError('ปรับลำดับไม่สำเร็จ: ' + e.message);
    }
  }

  function openSinglePositionModal(posId) {
    var app = getApp();
    if (!app) return;
    var item = null;
    if (posId) {
      item = (app.STATE.positionStructure || []).find(function (x) { return x.pos_id === posId; });
    }

    var isEdit = !!item;
    var p = item || {};
    var curTab = ADMIN_STATE.currentPosTab;
    var selectedType = isEdit ? p.position_type : curTab;

    var posTypeOptions = app.buildOptionsHtml(
      app.getPositionTypes(),
      selectedType,
      '-- เลือกประเภทตำแหน่ง --'
    );

    var title = isEdit ? '<i class="fa-solid fa-pen-to-square"></i> แก้ไขโครงสร้างตำแหน่ง' : '<i class="fa-solid fa-plus"></i> เพิ่มโครงสร้างตำแหน่ง';

    var bodyHtml = ''
      + '<form id="admPosForm" onsubmit="event.preventDefault();">'
      + '  <input type="hidden" id="adm_pos_id" value="' + esc(p.pos_id || '') + '">'
      + '  <div style="display:flex;flex-direction:column;gap:1rem;">'
      + '    <div>'
      + '      <label class="lbl">ประเภทตำแหน่ง (Position Type) <span style="color:var(--red);">*</span></label>'
      + '      <select id="adm_pos_type" class="sel" required>' + posTypeOptions + '</select>'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">สายงาน / ชื่อตำแหน่ง <span style="color:var(--red);">*</span></label>'
      + '      <input type="text" id="adm_pos_name" class="inp" placeholder="เช่น เจ้าพนักงานเทศกิจ" value="' + esc(p.position_name || '') + '" required>'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">ระดับตำแหน่ง</label>'
      + '      <input type="text" id="adm_pos_level" class="inp" placeholder="เช่น ปฏิบัติการ, ชำนาญการ หรือ ไม่มีระดับ" value="' + esc(p.position_level || 'ไม่มีระดับ') + '">'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">ลำดับแสดงผล (Sort Order)</label>'
      + '      <input type="number" id="adm_pos_sort" class="inp" value="' + esc(p.sort_order || 1) + '">'
      + '    </div>'
      + '  </div>'
      + '</form>';

    var footerHtml = ''
      + '<button type="button" class="btn btn-outline" onclick="PORTAL_APP.closeModal()">ยกเลิก</button>'
      + '<button type="button" class="btn btn-primary" onclick="PORTAL_ADMIN.submitSinglePositionModal()"><i class="fa-solid fa-save"></i> บันทึกตำแหน่ง</button>';

    app.openModal(title, bodyHtml, footerHtml, '500px');
  }

  async function submitSinglePositionModal() {
    var pName = (document.getElementById('adm_pos_name').value || '').trim();
    if (!pName) {
      alertError('กรุณากรอกสายงาน/ชื่อตำแหน่ง');
      return;
    }

    var payload = {
      pos_id: (document.getElementById('adm_pos_id').value || '').trim(),
      position_type: document.getElementById('adm_pos_type').value,
      position_name: pName,
      position_level: (document.getElementById('adm_pos_level').value || '').trim() || 'ไม่มีระดับ',
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
      alertError(err.message || 'บันทึกตำแหน่งไม่สำเร็จ');
    }
  }

  function openBatchPositionModal(currentType) {
    var app = getApp();
    if (!app) return;
    var type = currentType || ADMIN_STATE.currentPosTab;

    var title = '<i class="fa-solid fa-file-circle-plus"></i> เพิ่มตำแหน่งแบบกลุ่ม (Batch Add: ' + esc(type) + ')';
    var bodyHtml = ''
      + '<form id="admBatchPosForm" onsubmit="event.preventDefault();">'
      + '  <input type="hidden" id="adm_batch_pos_type" value="' + esc(type) + '">'
      + '  <div style="display:flex;flex-direction:column;gap:1rem;">'
      + '    <div>'
      + '      <label class="lbl">ประเภทตำแหน่ง</label>'
      + '      <input type="text" class="inp" value="' + esc(type) + '" readonly style="background:var(--surface2);font-weight:700;">'
      + '    </div>'
      + '    <div>'
      + '      <label class="lbl">รายการตำแหน่ง (ข้อมูลละ 1 บรรทัด / หรือคั่นด้วยจุลภาค: ชื่อตำแหน่ง, ระดับตำแหน่ง) <span style="color:var(--red);">*</span></label>'
      + '      <textarea id="adm_batch_pos_text" class="inp" rows="9" placeholder="ตัวอย่าง:\nเจ้าพนักงานเทศกิจ, ปฏิบัติงาน\nเจ้าพนักงานเทศกิจ, ชำนาญงาน\nหรือระบุเฉพาะชื่อตำแหน่ง"></textarea>'
      + '    </div>'
      + '  </div>'
      + '</form>';

    var footerHtml = ''
      + '<button type="button" class="btn btn-outline" onclick="PORTAL_APP.closeModal()">ยกเลิก</button>'
      + '<button type="button" class="btn btn-primary" onclick="PORTAL_ADMIN.submitBatchPositionModal()"><i class="fa-solid fa-plus-circle"></i> บันทึกตำแหน่งแบบกลุ่ม</button>';

    app.openModal(title, bodyHtml, footerHtml, '540px');
  }

  async function submitBatchPositionModal() {
    var rawText = (document.getElementById('adm_batch_pos_text').value || '').trim();
    if (!rawText) {
      alertError('กรุณากรอกรายการตำแหน่งอย่างน้อย 1 รายการ');
      return;
    }

    var type = document.getElementById('adm_batch_pos_type').value;
    var lines = rawText.split('\n');
    var items = [];
    lines.forEach(function (ln) {
      var trimmed = ln.trim();
      if (!trimmed) return;
      var pName = trimmed;
      var pLvl = 'ไม่มีระดับ';
      if (trimmed.indexOf(',') !== -1) {
        var parts = trimmed.split(',');
        pName = parts[0].trim();
        pLvl = parts.slice(1).join(',').trim() || 'ไม่มีระดับ';
      }
      items.push({
        position_type: type,
        position_name: pName,
        position_level: pLvl
      });
    });

    if (items.length === 0) {
      alertError('ไม่พบข้อมูลตำแหน่งที่ถูกต้องสำหรับบันทึก');
      return;
    }

    try {
      var res = await getApi().savePositionStructure({ mode: 'BATCH', items: items });
      toast(res.message || 'เพิ่มตำแหน่งแบบกลุ่มสำเร็จ (' + items.length + ' ตำแหน่ง)');
      getApp().closeModal();

      var bootRes = await getApi().checkSystemInit(true);
      if (bootRes && bootRes.position_structure) {
        getApp().STATE.positionStructure = bootRes.position_structure;
      }
      renderPositionsPage();
    } catch (err) {
      alertError(err.message || 'บันทึกตำแหน่งแบบกลุ่มไม่สำเร็จ');
    }
  }

  async function deletePosition(posId, name) {
    if (!posId) return;
    var confirmText = 'คุณต้องการลบตำแหน่ง "' + (name || posId) + '" ออกจากโครงสร้างใช่หรือไม่?';
    if (global.Swal) {
      var r = await global.Swal.fire({
        title: 'ยืนยันการลบตำแหน่ง',
        text: confirmText,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E53935',
        cancelButtonColor: '#64748B',
        confirmButtonText: 'ลบตำแหน่ง',
        cancelButtonText: 'ยกเลิก'
      });
      if (!r.isConfirmed) return;
    } else {
      if (!confirm(confirmText)) return;
    }

    try {
      var res = await getApi().deletePositionStructure(posId);
      toast(res.message || 'ลบตำแหน่งเรียบร้อยแล้ว');

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
  // 6. โมดูลตั้งค่าระบบครบ 13 Keys & Reset Test Data (#settings)
  // ===========================================================================
  function renderSettingsPage() {
    var app = getApp();
    if (!app) return;
    app.setPageHeader(
      'ตั้งค่าระบบ (System Settings & Reset Test Data)',
      'ปรับแต่งค่าคอนฟิกูเรชันระบบแกนกลาง 13 รายการ ทดสอบโฟลเดอร์ Google Drive และเครื่องมือรีเซ็ตข้อมูลสำหรับผู้ดูแลระบบ'
    );

    var pageBody = document.getElementById('pageBody');
    if (!pageBody) return;

    var s = (app.STATE && app.STATE.settings) || {};

    pageBody.innerHTML = ''
      + '<form id="admSettingsForm" onsubmit="event.preventDefault();">'
      + '  <!-- ส่วนที่ 1: อัตลักษณ์องค์กรและชื่อระบบ -->'
      + '  <div class="card" style="margin-bottom:1.5rem;">'
      + '    <div class="card-header">'
      + '      <div class="card-title"><i class="fa-solid fa-building" style="color:var(--g1);"></i> อัตลักษณ์องค์กรและชื่อระบบเว็บพอร์ทัล</div>'
      + '    </div>'
      + '    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.15rem;">'
      + '      <div>'
      + '        <label class="lbl">ชื่อระบบ (App_Name) <span style="color:var(--red);">*</span></label>'
      + '        <input type="text" id="cfg_App_Name" class="inp" value="' + esc(s.App_Name || 'ระบบ Central Portal & SSO (สตบ.สนท.)') + '" required>'
      + '      </div>'
      + '      <div>'
      + '        <label class="lbl">ชื่อหน่วยงาน (Organization_Name) <span style="color:var(--red);">*</span></label>'
      + '        <input type="text" id="cfg_Organization_Name" class="inp" value="' + esc(s.Organization_Name || 'ส่วนตรวจและบังคับการ สำนักเทศกิจ กรุงเทพมหานคร') + '" required>'
      + '      </div>'
      + '      <div style="grid-column:1/-1;">'
      + '        <label class="lbl">URL โลโก้หลัก Portal (Portal_Logo_URL)</label>'
      + '        <div style="display:flex;gap:0.75rem;align-items:center;">'
      + '          <img src="' + esc(resolveDriveImg(s.Portal_Logo_URL || s.Default_Logo_URL)) + '" style="width:42px;height:42px;object-fit:contain;background:var(--surface2);padding:4px;border-radius:0.5rem;border:1px solid var(--border);">'
      + '          <input type="text" id="cfg_Portal_Logo_URL" class="inp" value="' + esc(s.Portal_Logo_URL || '') + '" placeholder="URL หรือ Google Drive ID">'
      + '        </div>'
      + '      </div>'
      + '      <div>'
      + '        <label class="lbl">URL โลโก้แบบกำหนดเอง (Custom_Logo_URL)</label>'
      + '        <input type="text" id="cfg_Custom_Logo_URL" class="inp" value="' + esc(s.Custom_Logo_URL || '') + '" placeholder="URL หรือ Google Drive ID">'
      + '      </div>'
      + '      <div>'
      + '        <label class="lbl">URL โลโก้เริ่มต้น (Default_Logo_URL)</label>'
      + '        <input type="text" id="cfg_Default_Logo_URL" class="inp" value="' + esc(s.Default_Logo_URL || '') + '">'
      + '      </div>'
      + '    </div>'
      + '  </div>'
      + '  <!-- ส่วนที่ 2: Google Apps Script & Cloud Storage Folders -->'
      + '  <div class="card" style="margin-bottom:1.5rem;">'
      + '    <div class="card-header">'
      + '      <div class="card-title"><i class="fa-brands fa-google-drive" style="color:#FFB300;"></i> Google Apps Script & Cloud Storage Drive Folders</div>'
      + '    </div>'
      + '    <div style="display:flex;flex-direction:column;gap:1.15rem;">'
      + '      <div>'
      + '        <label class="lbl">Google Apps Script Exec URL (GAS_Web_App_URL) <span style="color:var(--red);">*</span></label>'
      + '        <input type="text" id="cfg_GAS_Web_App_URL" class="inp" value="' + esc(s.GAS_Web_App_URL || '') + '" placeholder="https://script.google.com/macros/s/.../exec" required>'
      + '      </div>'
      + '      <div>'
      + '        <label class="lbl">Google Drive Folder ID รูปโปรไฟล์ (Profile_Folder_ID)</label>'
      + '        <div style="display:flex;gap:0.6rem;">'
      + '          <input type="text" id="cfg_Profile_Folder_ID" class="inp" value="' + esc(s.Profile_Folder_ID || '') + '" placeholder="Folder ID หรือ ลิงก์ Drive">'
      + '          <button type="button" class="btn btn-outline" onclick="PORTAL_ADMIN.testDriveFolder(\'cfg_Profile_Folder_ID\', \'รูปโปรไฟล์\')"><i class="fa-solid fa-magnifying-glass"></i> ทดสอบโฟลเดอร์</button>'
      + '        </div>'
      + '      </div>'
      + '      <div>'
      + '        <label class="lbl">Google Drive Folder ID รูปลายเซ็น (Signature_Folder_ID)</label>'
      + '        <div style="display:flex;gap:0.6rem;">'
      + '          <input type="text" id="cfg_Signature_Folder_ID" class="inp" value="' + esc(s.Signature_Folder_ID || '') + '" placeholder="Folder ID หรือ ลิงก์ Drive">'
      + '          <button type="button" class="btn btn-outline" onclick="PORTAL_ADMIN.testDriveFolder(\'cfg_Signature_Folder_ID\', \'รูปลายเซ็น\')"><i class="fa-solid fa-magnifying-glass"></i> ทดสอบโฟลเดอร์</button>'
      + '        </div>'
      + '      </div>'
      + '      <div>'
      + '        <label class="lbl">Google Drive Folder ID ไอคอนแอป (App_Icon_Folder_ID)</label>'
      + '        <div style="display:flex;gap:0.6rem;">'
      + '          <input type="text" id="cfg_App_Icon_Folder_ID" class="inp" value="' + esc(s.App_Icon_Folder_ID || '') + '" placeholder="Folder ID หรือ ลิงก์ Drive">'
      + '          <button type="button" class="btn btn-outline" onclick="PORTAL_ADMIN.testDriveFolder(\'cfg_App_Icon_Folder_ID\', \'ไอคอนแอป\')"><i class="fa-solid fa-magnifying-glass"></i> ทดสอบโฟลเดอร์</button>'
      + '        </div>'
      + '      </div>'
      + '    </div>'
      + '  </div>'
      + '  <!-- ส่วนที่ 3: อายุ Session & การรักษาความปลอดภัย -->'
      + '  <div class="card" style="margin-bottom:1.5rem;">'
      + '    <div class="card-header">'
      + '      <div class="card-title"><i class="fa-solid fa-shield-halved" style="color:var(--blue);"></i> อายุ Session และการรักษาความปลอดภัย (Security & Sessions)</div>'
      + '    </div>'
      + '    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:1.15rem;">'
      + '      <div>'
      + '        <label class="lbl">อายุ Session เข้าสู่ระบบ (Session_Hours: ชม.)</label>'
      + '        <input type="number" id="cfg_Session_Hours" class="inp" value="' + esc(s.Session_Hours || 12) + '">'
      + '      </div>'
      + '      <div>'
      + '        <label class="lbl">อายุลิงก์ยืนยันอีเมล (Verify_Email_Hours: ชม.)</label>'
      + '        <input type="number" id="cfg_Verify_Email_Hours" class="inp" value="' + esc(s.Verify_Email_Hours || 24) + '">'
      + '      </div>'
      + '      <div>'
      + '        <label class="lbl">อายุลิงก์รีเซ็ตรหัสผ่าน (Reset_Password_Hours: ชม.)</label>'
      + '        <input type="number" id="cfg_Reset_Password_Hours" class="inp" value="' + esc(s.Reset_Password_Hours || 2) + '">'
      + '      </div>'
      + '      <div>'
      + '        <label class="lbl">อายุบัตรผ่าน SSO (SSO_Token_Lifetime_Minutes: นาที)</label>'
      + '        <input type="number" id="cfg_SSO_Token_Lifetime_Minutes" class="inp" value="' + esc(s.SSO_Token_Lifetime_Minutes || 5) + '">'
      + '      </div>'
      + '    </div>'
      + '  </div>'
      + '  <div style="margin-bottom:2rem;display:flex;justify-content:flex-end;">'
      + '    <button type="button" class="btn btn-primary" style="padding:0.75rem 2rem;font-size:1rem;" onclick="PORTAL_ADMIN.submitSettings()"><i class="fa-solid fa-floppy-disk"></i> บันทึกการตั้งค่าระบบทั้งหมด</button>'
      + '  </div>'
      + '</form>'
      + '<!-- ส่วนที่ 4: Danger Zone รีเซ็ตข้อมูลทดสอบ -->'
      + '<div class="card" style="border:1.5px solid var(--red);background:rgba(229,57,53,0.03);">'
      + '  <div class="card-header" style="border-bottom:1px solid rgba(229,57,53,0.2);">'
      + '    <div class="card-title" style="color:var(--red);"><i class="fa-solid fa-triangle-exclamation"></i> โซนจัดการข้อมูลขั้นสูง (Danger Zone / Reset Test Data)</div>'
      + '    <span class="chip red">Superadmin Only</span>'
      + '  </div>'
      + '  <div style="display:flex;flex-direction:column;gap:1.25rem;">'
      + '    <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem;padding-bottom:1rem;border-bottom:1px dashed var(--border);">'
      + '      <div>'
      + '        <div style="font-weight:700;color:var(--text);">1. ล้างข้อมูลผู้ใช้และบุคลากร (Reset Users & Personnel)</div>'
      + '        <div style="font-size:0.88rem;color:var(--muted);">ลบข้อมูลบัญชีผู้ใช้และทำเนียบบุคลากรทั้งหมด (โครงสร้างตำแหน่งและสังกัดยังคงอยู่) ระบบจะกลับสู่โหมด Setup Mode</div>'
      + '      </div>'
      + '      <button type="button" class="btn btn-amber" onclick="PORTAL_ADMIN.confirmResetTestData(\'USERS_AND_PERSONNEL\')"><i class="fa-solid fa-user-xmark"></i> ล้างข้อมูลผู้ใช้และบุคลากร</button>'
      + '    </div>'
      + '    <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem;">'
      + '      <div>'
      + '        <div style="font-weight:700;color:var(--red);">2. คืนค่าเริ่มต้นจากโรงงานทั้งหมด (Full Factory Reset)</div>'
      + '        <div style="font-size:0.88rem;color:var(--muted);">ล้างข้อมูลผู้ใช้ บุคลากร สิทธิ์ โครงสร้างสังกัด และตำแหน่งทั้งหมด แล้ว Re-seed ข้อมูลเริ่มต้นใหม่ 100%</div>'
      + '      </div>'
      + '      <button type="button" class="btn btn-danger" onclick="PORTAL_ADMIN.confirmResetTestData(\'FULL_FACTORY_RESET\')"><i class="fa-solid fa-fire"></i> คืนค่าเริ่มต้นจากโรงงาน</button>'
      + '    </div>'
      + '  </div>'
      + '</div>';
  }

  async function testDriveFolder(inputId, folderLabel) {
    var el = document.getElementById(inputId);
    var val = el ? el.value.trim() : '';
    if (!val) {
      alertError('กรุณากรอก Folder ID หรือลิงก์ Google Drive ในช่อง "' + folderLabel + '" ก่อนกดทดสอบ');
      return;
    }

    try {
      if (global.LOADER) global.LOADER.busy(Promise.resolve(), 'กำลังทดสอบเชื่อมต่อ Google Drive...');
      var res = await global.STB_DRIVE.checkDriveFolder(val);
      if (res && res.success !== false) {
        var fName = res.folderName || res.name || 'เข้าถึงโฟลเดอร์ได้เรียบร้อย';
        if (global.Swal) {
          global.Swal.fire({
            icon: 'success',
            title: 'ทดสอบการเข้าถึงโฟลเดอร์สำเร็จ',
            text: 'ชื่อโฟลเดอร์ใน Google Drive: "' + fName + '"'
          });
        } else {
          alert('ทดสอบการเข้าถึงโฟลเดอร์สำเร็จ: ' + fName);
        }
      } else {
        alertError((res && res.message) || 'ไม่สามารถเข้าถึงโฟลเดอร์ได้');
      }
    } catch (err) {
      alertError('ทดสอบโฟลเดอร์ไม่สำเร็จ: ' + err.message);
    } finally {
      if (global.LOADER) global.LOADER.hide();
    }
  }

  async function submitSettings() {
    var app = getApp();
    if (!app) return;

    var keys = [
      'App_Name',
      'Organization_Name',
      'Portal_Logo_URL',
      'Custom_Logo_URL',
      'Default_Logo_URL',
      'GAS_Web_App_URL',
      'Profile_Folder_ID',
      'Signature_Folder_ID',
      'App_Icon_Folder_ID',
      'Session_Hours',
      'Verify_Email_Hours',
      'Reset_Password_Hours',
      'SSO_Token_Lifetime_Minutes'
    ];

    var settingsObj = {};
    keys.forEach(function (k) {
      var el = document.getElementById('cfg_' + k);
      if (el) settingsObj[k] = el.value.trim();
    });

    try {
      var res = await getApi().saveSystemSettings(settingsObj);
      toast(res.message || 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');

      // อัปเดต Cache ใน STATE และอัปเดตอัตลักษณ์ทันที
      Object.assign(app.STATE.settings, settingsObj);
      app.applyBranding();
      renderSettingsPage();
    } catch (err) {
      alertError(err.message || 'บันทึกการตั้งค่าระบบไม่สำเร็จ');
    }
  }

  async function confirmResetTestData(mode) {
    var isFull = (mode === 'FULL_FACTORY_RESET');
    var promptTitle = isFull ? 'ยืนยันการคืนค่าเริ่มต้นจากโรงงาน (Full Factory Reset)' : 'ยืนยันการล้างข้อมูลผู้ใช้และบุคลากร';
    var promptText = isFull
      ? 'คำเตือน: ข้อมูลทั้งหมดในระบบจะถูกล้างและรีเซ็ตใหม่ 100% กรุณาพิมพ์คำว่า "FACTORY RESET" เพื่อยืนยัน'
      : 'คำเตือน: บัญชีผู้ใช้งานและทำเนียบบุคลากรทั้งหมดจะถูกลบออก และระบบจะกลับสู่โหมด Setup กรุณาพิมพ์คำว่า "RESET" เพื่อยืนยัน';
    var expectedConfirm = isFull ? 'FACTORY RESET' : 'RESET';

    if (global.Swal) {
      var r = await global.Swal.fire({
        title: promptTitle,
        text: promptText,
        input: 'text',
        inputPlaceholder: expectedConfirm,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E53935',
        cancelButtonColor: '#64748B',
        confirmButtonText: 'ยืนยันการรีเซ็ต',
        cancelButtonText: 'ยกเลิก',
        preConfirm: function (inputVal) {
          if (String(inputVal).trim() !== expectedConfirm) {
            global.Swal.showValidationMessage('กรุณาพิมพ์ "' + expectedConfirm + '" ให้ถูกต้อง');
            return false;
          }
          return true;
        }
      });
      if (!r.isConfirmed) return;
    } else {
      var typed = prompt(promptText);
      if (String(typed).trim() !== expectedConfirm) return;
    }

    try {
      var res = await getApi().resetTestData(mode);
      if (global.Swal) {
        await global.Swal.fire({
          icon: 'success',
          title: 'รีเซ็ตระบบเรียบร้อยแล้ว',
          text: (res && res.message) || 'ระบบกลับสู่โหมดตั้งค่าเริ่มต้นเรียบร้อยแล้ว',
          confirmButtonText: 'ตกลง'
        });
      } else {
        alert('รีเซ็ตระบบเรียบร้อยแล้ว');
      }
      getApp().bootSystem();
    } catch (err) {
      alertError(err.message || 'รีเซ็ตระบบไม่สำเร็จ');
    }
  }

  // ===========================================================================
  // 7. Event Dispatcher & Initialization Hook
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
    confirmResetTestData: confirmResetTestData
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
