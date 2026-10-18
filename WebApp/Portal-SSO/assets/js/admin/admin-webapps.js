/**
 * =============================================================================
 * STB APP n2 — Admin WebApps Module (assets/js/admin/admin-webapps.js)
 * =============================================================================
 * SSO Registry, Dynamic Up/Down Reordering (▲▼), Status Toggling (Active/
 * Maintenance), Launchpad Preview & Google Drive App Icon Upload.
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
  function resolveDriveImg(url, fallback) {
    return getShared().resolveDriveImg ? getShared().resolveDriveImg(url, fallback) : (url || fallback || '');
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
  function getState() {
    return (getShared().ADMIN_STATE) || {};
  }

  var AdminWebapps = {
    loadWebappsData: async function (silent) {
      try {
        var res = await getApi().listWebapps(silent);
        var list = (res && (res.webapps || res.data)) || [];
        var admState = getState();
        admState.webapps = list;
        return list;
      } catch (err) {
        alertError('ไม่สามารถโหลดรายการเว็บแอปพลิเคชันได้: ' + err.message);
        return [];
      }
    },

    renderWebappsPage: function () {
      var app = getApp();
      if (!app) return;
      app.setPageHeader('จัดการเว็บแอปพลิเคชันย่อย', 'ลงทะเบียนเว็บแอปพลิเคชันในระบบ กำหนด URL ปลายทาง และจัดการไอคอนสำหรับเชื่อมต่อ Single Sign-On (SSO)', 'grid');

      var pageBody = getShared().getPageBody ? getShared().getPageBody() : document.getElementById('content');
      if (!pageBody) return;

      var admState = getState();
      var rowsHtml = '';
      var list = (admState.webapps || []).slice().sort(function (a, b) {
        return (a.sort_order || 0) - (b.sort_order || 0);
      });

      if (list.length === 0) {
        rowsHtml = '<tr><td colspan="8" class="text-center py-10 muted"><i data-lucide="layers" class="w-8 h-8 mx-auto mb-2 opacity-50"></i><div class="text-sm">ยังไม่มีเว็บแอปพลิเคชันในระบบ</div></td></tr>';
      } else {
        list.forEach(function (w, idx) {
          var iconHtml = '';
          if (w.icon_url && w.icon_url.indexOf('fa-') !== -1) {
            iconHtml = '<i data-lucide="layers" class="w-6 h-6 text-green-600 mx-auto"></i>';
          } else if (w.icon_url) {
            iconHtml = '<img src="' + esc(resolveDriveImg(w.icon_url)) + '" alt="Icon" class="w-9 h-9 object-cover rounded-lg mx-auto bg-white border border-slate-200 dark:border-slate-700" loading="lazy">';
          } else {
            iconHtml = '<i data-lucide="layers" class="w-6 h-6 text-green-600 mx-auto"></i>';
          }

          var statusChip = (w.status === 'เปิดใช้งาน' || w.status === 'ACTIVE')
            ? '<span class="badge chip cursor-pointer hover:opacity-80 transition" onclick="PORTAL_ADMIN.toggleWebappStatus(\'' + esc(w.webapp_id) + '\')" title="คลิกเพื่อสลับสถานะ">เปิดใช้งาน</span>'
            : '<span class="badge cursor-pointer hover:opacity-80 transition" style="background:rgba(229,57,53,.15);color:var(--red);" onclick="PORTAL_ADMIN.toggleWebappStatus(\'' + esc(w.webapp_id) + '\')" title="คลิกเพื่อสลับสถานะ">ปิดปรับปรุง</span>';

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
            + '  <td class="text-center">'
            + '    <div class="inline-flex gap-1">'
            + '      <button type="button" class="btn-ghost !p-1" onclick="PORTAL_ADMIN.moveWebapp(\'' + esc(w.webapp_id) + '\', \'up\')" title="เลื่อนขึ้น"><i data-lucide="arrow-up" class="w-3.5 h-3.5"></i></button>'
            + '      <button type="button" class="btn-ghost !p-1" onclick="PORTAL_ADMIN.moveWebapp(\'' + esc(w.webapp_id) + '\', \'down\')" title="เลื่อนลง"><i data-lucide="arrow-down" class="w-3.5 h-3.5"></i></button>'
            + '    </div>'
            + '  </td>'
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
        + '    <table class="tbl min-w-[950px]">'
        + '      <thead>'
        + '        <tr>'
        + app.th('ลำดับ', 'no')
        + app.th('ไอคอน', 'file')
        + app.th('รหัสแอป', 'action')
        + app.th('ชื่อเว็บแอปพลิเคชัน / รายละเอียด', 'name')
        + app.th('URL ปลายทาง', 'unit')
        + app.th('สถานะ', 'status')
        + app.th('เลื่อนลำดับ', 'action')
        + app.th('จัดการ', 'action')
        + '        </tr>'
        + '      </thead>'
        + '      <tbody>' + rowsHtml + '</tbody>'
        + '    </table>'
        + '  </div>'
        + '</div>';

      pageBody.innerHTML = sectionHeader + tableHtml;
      triggerIcons();
    },

    openWebappModal: function (webappId) {
      var app = getApp();
      if (!app) return;
      var admState = getState();
      var item = null;
      if (webappId) {
        item = (admState.webapps || []).find(function (w) { return w.webapp_id === webappId; });
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
    },

    submitWebappModal: async function () {
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
        var res = await global.LOADER.busy(
          getApi().saveWebapp(payload),
          'กำลังบันทึกข้อมูลเว็บแอปพลิเคชัน...'
        );
        toast(res.message || 'บันทึกเว็บแอปพลิเคชันสำเร็จ');
        getApp().closeModal();
        await AdminWebapps.loadWebappsData(true);
        AdminWebapps.renderWebappsPage();
      } catch (err) {
        alertError(err.message || 'ไม่สามารถบันทึกเว็บแอปพลิเคชันได้');
      }
    },

    deleteWebapp: async function (webappId, name) {
      var confirmed = await getApp().confirmAction({
        title: 'ยืนยันการลบเว็บแอปพลิเคชัน?',
        text: 'ต้องการลบ ' + name + ' (' + webappId + ') หรือไม่? ระบบจะไม่สามารถเชื่อมต่อ SSO ไปยังแอปนี้ได้อีก',
        confirmText: 'ลบเว็บแอป',
        cancelText: 'ยกเลิก',
        confirmColor: '#E53935'
      });
      if (!confirmed) return;

      try {
        var res = await global.LOADER.busy(
          getApi().deleteWebapp(webappId),
          'กำลังลบเว็บแอปพลิเคชัน...'
        );
        toast(res.message || 'ลบเว็บแอปพลิเคชันสำเร็จ');
        await AdminWebapps.loadWebappsData(true);
        AdminWebapps.renderWebappsPage();
      } catch (err) {
        alertError(err.message || 'ไม่สามารถลบเว็บแอปได้');
      }
    },

    moveWebapp: async function (webappId, direction) {
      var admState = getState();
      var list = (admState.webapps || []).slice().sort(function (a, b) {
        return (a.sort_order || 0) - (b.sort_order || 0);
      });
      var idx = list.findIndex(function (w) { return w.webapp_id === webappId; });
      if (idx === -1) return;
      var targetIdx = (direction === 'up' || direction === 'UP') ? idx - 1 : idx + 1;
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
        await getApi().saveWebapp({ webapp_id: itemA.webapp_id, sort_order: sortB });
        await getApi().saveWebapp({ webapp_id: itemB.webapp_id, sort_order: sortA });
        itemA.sort_order = sortB;
        itemB.sort_order = sortA;
        await AdminWebapps.loadWebappsData(true);
        AdminWebapps.renderWebappsPage();
        toast('ปรับลำดับเว็บแอปสำเร็จ');
      } catch (e) {
        alertError('ปรับลำดับเว็บแอปไม่สำเร็จ: ' + e.message);
      }
    },

    toggleWebappStatus: async function (webappId) {
      var admState = getState();
      var item = (admState.webapps || []).find(function (w) { return w.webapp_id === webappId; });
      if (!item) return;
      var newStatus = (item.status === 'เปิดใช้งาน' || item.status === 'ACTIVE') ? 'ปิดปรับปรุง' : 'เปิดใช้งาน';
      try {
        await getApi().saveWebapp({ webapp_id: item.webapp_id, status: newStatus });
        item.status = newStatus;
        await AdminWebapps.loadWebappsData(true);
        AdminWebapps.renderWebappsPage();
        toast('เปลี่ยนสถานะเป็น "' + newStatus + '" สำเร็จ');
      } catch (e) {
        alertError('เปลี่ยนสถานะไม่สำเร็จ: ' + e.message);
      }
    },

    refreshWebapps: async function () {
      await AdminWebapps.loadWebappsData(false);
      AdminWebapps.renderWebappsPage();
    }
  };

  global.AdminWebapps = AdminWebapps;
})(window);

