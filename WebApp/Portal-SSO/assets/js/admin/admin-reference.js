/**
 * =============================================================================
 * STB APP n2 — Admin Reference Module (assets/js/admin/admin-reference.js)
 * =============================================================================
 * 4-Level BMA Organization Structure (Bureau, Office, Dept, Div), Parent Filter,
 * Dynamic Up/Down Reordering (▲▼), Single & Multi-Row Batch Modal Addition.
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
  function getState() {
    return (getShared().ADMIN_STATE) || {};
  }

  var AdminReference = {
    renderReferencePage: function () {
      var app = getApp();
      if (!app) return;
      app.setPageHeader('โครงสร้างสังกัด 4 ระดับ', 'จัดการข้อมูลอ้างอิง โครงสร้างสังกัด 4 ระดับ (สำนัก, สำนักงาน/กอง, ส่วน/ฝ่าย, กลุ่มงาน) เลื่อนลำดับ และเพิ่มแบบหลายแถว', 'network');

      var pageBody = getShared().getPageBody ? getShared().getPageBody() : document.getElementById('content');
      if (!pageBody) return;

      var admState = getState();
      var curTab = admState.currentRefTab || 'BUREAU';
      var tabs = [
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
      var parentVal = admState.currentRefParentFilter;
      var refList = (app.STATE && app.STATE.referenceData) || admState.referenceData || [];

      if (curTab === 'OFFICE') {
        var bureaus = refList.filter(function (x) { return x.type === 'BUREAU'; });
        parentFilterHtml = '<div class="flex items-center gap-2"><span class="text-xs font-bold muted">กรองตามสำนัก:</span>'
          + '<select class="inp !py-1 !text-xs !w-auto" onchange="PORTAL_ADMIN.setRefParentFilter(this.value)">'
          + '<option value="">-- แสดงทุกสำนัก --</option>'
          + bureaus.map(function (b) { return '<option value="' + esc(b.value) + '"' + (parentVal === b.value ? ' selected' : '') + '>' + esc(b.value) + '</option>'; }).join('')
          + '</select></div>';
      } else if (curTab === 'DEPARTMENT') {
        var offices = refList.filter(function (x) { return x.type === 'OFFICE'; });
        parentFilterHtml = '<div class="flex items-center gap-2"><span class="text-xs font-bold muted">กรองตามสำนักงาน:</span>'
          + '<select class="inp !py-1 !text-xs !w-auto" onchange="PORTAL_ADMIN.setRefParentFilter(this.value)">'
          + '<option value="">-- แสดงทุกสำนักงาน --</option>'
          + offices.map(function (o) { return '<option value="' + esc(o.value) + '"' + (parentVal === o.value ? ' selected' : '') + '>' + esc(o.value) + '</option>'; }).join('')
          + '</select></div>';
      } else if (curTab === 'DIVISION') {
        var depts = refList.filter(function (x) { return x.type === 'DEPARTMENT'; });
        parentFilterHtml = '<div class="flex items-center gap-2"><span class="text-xs font-bold muted">กรองตามส่วน/ฝ่าย:</span>'
          + '<select class="inp !py-1 !text-xs !w-auto" onchange="PORTAL_ADMIN.setRefParentFilter(this.value)">'
          + '<option value="">-- แสดงทุกส่วน/ฝ่าย --</option>'
          + depts.map(function (d) { return '<option value="' + esc(d.value) + '"' + (parentVal === d.value ? ' selected' : '') + '>' + esc(d.value) + '</option>'; }).join('')
          + '</select></div>';
      }

      var items = refList.filter(function (r) {
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
        + '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.openAddReferenceModal(\'' + curTab + '\')"><i data-lucide="plus" class="w-4 h-4"></i> เพิ่มข้อมูล (' + esc(curTab) + ')</button>';

      var sectionHeader = app.sectionBar('โครงสร้างสังกัด 4 ระดับ (BMA Organization Structure)', toolsHtml, 'network');

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
    },

    switchRefTab: function (tabId) {
      var admState = getState();
      admState.currentRefTab = tabId;
      admState.currentRefParentFilter = '';
      AdminReference.renderReferencePage();
    },

    setRefParentFilter: function (val) {
      var admState = getState();
      admState.currentRefParentFilter = val;
      AdminReference.renderReferencePage();
    },

    moveReference: async function (referenceId, direction) {
      var app = getApp();
      if (!app) return;
      var admState = getState();
      var isPosRef = (admState.currentPosTab === 'PREFIX' || admState.currentPosTab === 'STATUS');
      var curTab = isPosRef ? admState.currentPosTab : admState.currentRefTab;
      var parentVal = isPosRef ? '' : admState.currentRefParentFilter;
      var refList = (app.STATE && app.STATE.referenceData) || admState.referenceData || [];

      var list = refList.filter(function (r) {
        if (r.type !== curTab) return false;
        if (parentVal && r.parent_value !== parentVal) return false;
        return true;
      }).sort(function (a, b) {
        return (a.sort_order || 0) - (b.sort_order || 0);
      });

      var idx = list.findIndex(function (x) { return x.reference_id === referenceId; });
      if (idx === -1) return;
      var targetIdx = (direction === 'UP' || direction === 'up') ? idx - 1 : idx + 1;
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
        if (isPosRef) {
          if (global.AdminPositions) global.AdminPositions.renderPositionsPage();
        } else {
          AdminReference.renderReferencePage();
        }
        toast('ปรับลำดับเรียบร้อย');
      } catch (e) {
        alertError('ปรับลำดับไม่สำเร็จ: ' + e.message);
      }
    },

    openSingleReferenceModal: function (referenceId) {
      var app = getApp();
      if (!app) return;
      var admState = getState();
      var curTab = admState.currentRefTab;
      var refList = (app.STATE && app.STATE.referenceData) || admState.referenceData || [];
      var item = null;
      if (referenceId) {
        item = refList.find(function (x) { return x.reference_id === referenceId; });
      }

      var isEdit = !!item;
      var r = item || {};
      var type = isEdit ? r.type : curTab;

      var parentType = '';
      var parentOptionsHtml = '<input type="text" id="adm_ref_parent_val" class="inp" placeholder="สังกัดแม่ (ถ้ามี)" value="' + esc(r.parent_value || '') + '">';

      if (type === 'OFFICE') {
        parentType = 'BUREAU';
        var bureaus = refList.filter(function (x) { return x.type === 'BUREAU'; });
        parentOptionsHtml = '<select id="adm_ref_parent_val" class="inp">' + bureaus.map(function (b) { return '<option value="' + esc(b.value) + '"' + (r.parent_value === b.value ? ' selected' : '') + '>' + esc(b.value) + '</option>'; }).join('') + '</select>';
      } else if (type === 'DEPARTMENT') {
        parentType = 'OFFICE';
        var offices = refList.filter(function (x) { return x.type === 'OFFICE'; });
        parentOptionsHtml = '<select id="adm_ref_parent_val" class="inp">' + offices.map(function (o) { return '<option value="' + esc(o.value) + '"' + (r.parent_value === o.value ? ' selected' : '') + '>' + esc(o.value) + '</option>'; }).join('') + '</select>';
      } else if (type === 'DIVISION') {
        parentType = 'DEPARTMENT';
        var depts = refList.filter(function (x) { return x.type === 'DEPARTMENT'; });
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
    },

    submitSingleReferenceModal: async function () {
      var val = (document.getElementById('adm_ref_val').value || '').trim();
      if (!val) {
        alertError('กรุณาระบุค่าข้อมูล');
        return;
      }

      var parentValEl = document.getElementById('adm_ref_parent_val');
      var type = document.getElementById('adm_ref_type').value;
      var payload = {
        reference_id: (document.getElementById('adm_ref_id').value || '').trim(),
        type: type,
        value: val,
        short_name: (document.getElementById('adm_ref_short').value || '').trim(),
        parent_type: document.getElementById('adm_ref_parent_type').value,
        parent_value: parentValEl ? parentValEl.value.trim() : '',
        sort_order: parseInt(document.getElementById('adm_ref_sort').value, 10) || 1
      };

      try {
        var res = await global.LOADER.busy(
          getApi().saveReferenceData(payload),
          'กำลังบันทึกข้อมูลอ้างอิง...'
        );
        toast(res.message || 'บันทึกข้อมูลอ้างอิงสำเร็จ');
        getApp().closeModal();

        var bootRes = await getApi().checkSystemInit(true);
        if (bootRes && bootRes.reference_data) {
          getApp().STATE.referenceData = bootRes.reference_data;
          getState().referenceData = bootRes.reference_data;
        }
        if (type === 'PREFIX' || type === 'STATUS') {
          if (global.AdminPositions) global.AdminPositions.renderPositionsPage();
        } else {
          AdminReference.renderReferencePage();
        }
      } catch (err) {
        alertError(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
      }
    },

    openAddReferenceModal: function (currentType) {
      var app = getApp();
      if (!app) return;
      var admState = getState();
      var type = currentType || admState.currentRefTab || 'BUREAU';
      var refList = (app.STATE && app.STATE.referenceData) || admState.referenceData || [];

      var parentType = '';
      var parentOptionsHtml = '';
      var parentVal = admState.currentRefParentFilter || '';

      if (type === 'OFFICE') {
        parentType = 'BUREAU';
        var bureaus = refList.filter(function (x) { return x.type === 'BUREAU'; });
        parentOptionsHtml = '<div class="mb-3"><label class="lbl">สังกัดสำนักแม่ (BUREAU) *</label><select id="adm_add_ref_parent" class="inp" required>'
          + bureaus.map(function (b) { return '<option value="' + esc(b.value) + '"' + (parentVal === b.value ? ' selected' : '') + '>' + esc(b.value) + '</option>'; }).join('')
          + '</select></div>';
      } else if (type === 'DEPARTMENT') {
        parentType = 'OFFICE';
        var offices = refList.filter(function (x) { return x.type === 'OFFICE'; });
        parentOptionsHtml = '<div class="mb-3"><label class="lbl">สังกัดสำนักงานแม่ (OFFICE) *</label><select id="adm_add_ref_parent" class="inp" required>'
          + offices.map(function (o) { return '<option value="' + esc(o.value) + '"' + (parentVal === o.value ? ' selected' : '') + '>' + esc(o.value) + '</option>'; }).join('')
          + '</select></div>';
      } else if (type === 'DIVISION') {
        parentType = 'DEPARTMENT';
        var depts = refList.filter(function (x) { return x.type === 'DEPARTMENT'; });
        parentOptionsHtml = '<div class="mb-3"><label class="lbl">สังกัดฝ่ายแม่ (DEPARTMENT) *</label><select id="adm_add_ref_parent" class="inp" required>'
          + depts.map(function (d) { return '<option value="' + esc(d.value) + '"' + (parentVal === d.value ? ' selected' : '') + '>' + esc(d.value) + '</option>'; }).join('')
          + '</select></div>';
      }

      var typeLabels = {
        'BUREAU': 'สำนัก (BUREAU)',
        'OFFICE': 'สำนักงาน / กอง (OFFICE)',
        'DEPARTMENT': 'ส่วน / ฝ่าย (DEPARTMENT)',
        'DIVISION': 'กลุ่มงาน (DIVISION)',
        'PREFIX': 'คำนำหน้าชื่อ (PREFIX)',
        'STATUS': 'สถานะการทำงาน (STATUS)'
      };
      var labelText = typeLabels[type] || type;
      var title = 'เพิ่มข้อมูลโครงสร้างสังกัด / อ้างอิง (' + esc(labelText) + ')';

      var bodyHtml = ''
        + '<form id="admAddRefForm" onsubmit="event.preventDefault();" class="space-y-4">'
        + '  <input type="hidden" id="adm_add_ref_type" value="' + esc(type) + '">'
        + '  <input type="hidden" id="adm_add_ref_parent_type" value="' + esc(parentType) + '">'
        + (parentOptionsHtml || '')
        + '  <div>'
        + '    <div class="flex items-center justify-between mb-2">'
        + '      <label class="lbl !mb-0 font-bold">รายการข้อมูลที่ต้องการเพิ่ม (เพิ่มได้หลายแถวพร้อมกัน)</label>'
        + '      <button type="button" class="btn-ghost !py-1 !px-2.5 text-xs text-[#007B3E] font-bold" onclick="PORTAL_ADMIN.addReferenceInputRow()">'
        + '        <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i> + เพิ่มแถว'
        + '      </button>'
        + '    </div>'
        + '    <div class="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl max-h-[340px] overflow-y-auto">'
        + '      <table class="tbl w-full text-xs">'
        + '        <thead>'
        + '          <tr>'
        + '            <th style="width:36px;" class="text-center">#</th>'
        + '            <th>ค่าข้อมูล (ชื่อเต็ม) *</th>'
        + '            <th style="width:150px;">ชื่อย่อ (Short Name)</th>'
        + '            <th style="width:40px;" class="text-center">ลบ</th>'
        + '          </tr>'
        + '        </thead>'
        + '        <tbody id="adm_ref_rows_body">'
        + '        </tbody>'
        + '      </table>'
        + '    </div>'
        + '  </div>'
        + '</form>';

      var footerHtml = ''
        + '<button type="button" class="btn-ghost" onclick="PORTAL_APP.closeModal()">ยกเลิก</button>'
        + '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.submitAddReferenceModal()"><i data-lucide="save" class="w-4 h-4"></i> บันทึกข้อมูลทั้งหมด</button>';

      app.openModal(title, bodyHtml, footerHtml, '650px', 'plus-circle');
      AdminReference.addReferenceInputRow();
      AdminReference.addReferenceInputRow();
      AdminReference.addReferenceInputRow();
      triggerIcons();
    },

    addReferenceInputRow: function (val, short) {
      var tbody = document.getElementById('adm_ref_rows_body');
      if (!tbody) return;
      var rowCount = tbody.querySelectorAll('tr').length + 1;
      var tr = document.createElement('tr');
      tr.className = 'ref-input-row';
      tr.innerHTML = ''
        + '<td class="text-center font-bold muted row-idx">' + rowCount + '</td>'
        + '<td><input type="text" class="inp !py-1 !text-xs ref-row-val" placeholder="ระบุชื่อข้อมูล..." value="' + esc(val || '') + '"></td>'
        + '<td><input type="text" class="inp !py-1 !text-xs ref-row-short" placeholder="ชื่อย่อ (ถ้ามี)" value="' + esc(short || '') + '"></td>'
        + '<td class="text-center"><button type="button" class="btn-ghost !p-1 text-red-500 hover:text-red-700" onclick="PORTAL_ADMIN.removeReferenceInputRow(this)" title="ลบแถวนี้"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button></td>';
      tbody.appendChild(tr);
      triggerIcons();
    },

    removeReferenceInputRow: function (btn) {
      var tbody = document.getElementById('adm_ref_rows_body');
      if (!tbody) return;
      var tr = btn.closest('tr');
      if (tr) tr.remove();
      var rows = tbody.querySelectorAll('tr');
      rows.forEach(function (r, idx) {
        var idxCell = r.querySelector('.row-idx');
        if (idxCell) idxCell.textContent = String(idx + 1);
      });
      if (rows.length === 0) {
        AdminReference.addReferenceInputRow();
      }
    },

    submitAddReferenceModal: async function () {
      var tbody = document.getElementById('adm_ref_rows_body');
      if (!tbody) return;

      var type = document.getElementById('adm_add_ref_type').value;
      var parentType = document.getElementById('adm_add_ref_parent_type').value;
      var parentEl = document.getElementById('adm_add_ref_parent');
      var parentVal = parentEl ? parentEl.value.trim() : '';

      if (parentType && !parentVal) {
        alertError('กรุณาเลือกสังกัดแม่ (' + parentType + ')');
        return;
      }

      var rows = tbody.querySelectorAll('.ref-input-row');
      var items = [];
      rows.forEach(function (r) {
        var valInp = r.querySelector('.ref-row-val');
        var shortInp = r.querySelector('.ref-row-short');
        var val = (valInp && valInp.value) ? valInp.value.trim() : '';
        var short = (shortInp && shortInp.value) ? shortInp.value.trim() : '';
        if (val) {
          items.push({ value: val, short_name: short });
        }
      });

      if (items.length === 0) {
        alertError('กรุณาระบุค่าข้อมูลอย่างน้อย 1 แถว');
        return;
      }

      try {
        var res = await global.LOADER.busy(
          getApi().batchAddReference({
            type: type,
            parent_type: parentType,
            parent_value: parentVal,
            items: items
          }),
          'กำลังบันทึกข้อมูลโครงสร้างสังกัด...'
        );
        toast(res.message || 'บันทึกข้อมูลเรียบร้อยแล้ว');
        getApp().closeModal();

        var bootRes = await getApi().checkSystemInit(true);
        if (bootRes && bootRes.reference_data) {
          getApp().STATE.referenceData = bootRes.reference_data;
          getState().referenceData = bootRes.reference_data;
        }

        if (type === 'PREFIX' || type === 'STATUS') {
          if (global.AdminPositions) global.AdminPositions.renderPositionsPage();
        } else {
          AdminReference.renderReferencePage();
        }
      } catch (err) {
        alertError(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
      }
    },

    openBatchReferenceModal: function (currentType) {
      AdminReference.openAddReferenceModal(currentType);
    },

    deleteReference: async function (referenceId, value) {
      var confirmed = await getApp().confirmAction({
        title: 'ยืนยันการลบรายการอ้างอิง?',
        text: 'ต้องการลบ "' + value + '" หรือไม่?',
        confirmText: 'ลบข้อมูล',
        cancelText: 'ยกเลิก',
        confirmColor: '#E53935'
      });
      if (!confirmed) return;

      try {
        var res = await global.LOADER.busy(
          getApi().deleteReferenceData(referenceId),
          'กำลังลบข้อมูลอ้างอิง...'
        );
        toast(res.message || 'ลบข้อมูลสำเร็จ');
        var bootRes = await getApi().checkSystemInit(true);
        if (bootRes && bootRes.reference_data) {
          getApp().STATE.referenceData = bootRes.reference_data;
          getState().referenceData = bootRes.reference_data;
        }
        var admState = getState();
        if (admState.currentPosTab === 'PREFIX' || admState.currentPosTab === 'STATUS') {
          if (global.AdminPositions) global.AdminPositions.renderPositionsPage();
        } else {
          AdminReference.renderReferencePage();
        }
      } catch (err) {
        alertError(err.message || 'ไม่สามารถลบข้อมูลได้');
      }
    }
  };

  global.AdminReference = AdminReference;
})(window);

