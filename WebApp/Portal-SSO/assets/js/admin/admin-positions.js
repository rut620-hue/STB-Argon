/**
 * =============================================================================
 * STB APP n2 — Admin Positions Module (assets/js/admin/admin-positions.js)
 * =============================================================================
 * Position Classifications, Levels, PREFIX/STATUS Tabs, Dynamic Position Types,
 * Up/Down Reordering (▲▼), Single & Multi-Row Batch Modal Addition.
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

  var AdminPositions = {
    renderPositionsPage: function () {
      var app = getApp();
      if (!app) return;
      app.setPageHeader('โครงสร้างสายงานและตำแหน่ง', 'กำหนดประเภทตำแหน่ง สายงาน ระดับตำแหน่ง และคำนำหน้าชื่อ/สถานะการทำงาน', 'layers');

      var pageBody = getShared().getPageBody ? getShared().getPageBody() : document.getElementById('content');
      if (!pageBody) return;

      var admState = getState();
      var curType = admState.currentPosTab || 'ผู้บริหาร';
      var posTypes = app.getPositionTypes();
      var tabs = [
        { id: 'PREFIX', label: 'คำนำหน้าชื่อ', isRef: true },
        { id: 'STATUS', label: 'สถานะการทำงาน', isRef: true }
      ].concat(posTypes.map(function (t) { return { id: t, label: t, isRef: false }; }));

      // Ensure valid active tab
      var hasTab = tabs.some(function (t) { return t.id === curType; });
      if (!hasTab && tabs.length > 0) {
        curType = tabs[0].id;
        admState.currentPosTab = curType;
      }

      var tabButtonsHtml = '<div class="flex gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4 max-w-fit overflow-x-auto">';
      tabs.forEach(function (t) {
        var isActive = t.id === curType;
        tabButtonsHtml += '<button type="button" onclick="PORTAL_ADMIN.switchPosTab(\'' + esc(t.id) + '\')" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ' + (isActive ? 'bg-[#007B3E] text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900') + '">' + esc(t.label) + '</button>';
      });
      tabButtonsHtml += '</div>';

      var rowsHtml = '';
      var tableHeadersHtml = '';
      var toolsHtml = '';
      var sectionBarTitle = '';
      var refList = (app.STATE && app.STATE.referenceData) || admState.referenceData || [];
      var posList = (app.STATE && app.STATE.positionStructure) || admState.positionStructure || [];

      if (curType === 'PREFIX' || curType === 'STATUS') {
        var isPrefix = (curType === 'PREFIX');
        var refLabel = isPrefix ? 'คำนำหน้าชื่อ' : 'สถานะการทำงาน';
        sectionBarTitle = 'ข้อมูลอ้างอิง: ' + refLabel + ' (' + curType + ')';

        var refItems = refList.filter(function (r) {
          return r.type === curType;
        }).sort(function (a, b) {
          return (a.sort_order || 0) - (b.sort_order || 0);
        });

        if (refItems.length === 0) {
          rowsHtml = '<tr><td colspan="5" class="text-center py-10 muted"><i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i><div class="text-sm">ไม่มีข้อมูลในหมวดนี้</div></td></tr>';
        } else {
          refItems.forEach(function (r, idx) {
            rowsHtml += ''
              + '<tr>'
              + '  <td class="text-center font-bold muted">' + (idx + 1) + '</td>'
              + '  <td><span class="font-bold text-slate-800 dark:text-slate-100">' + esc(r.value) + '</span></td>'
              + '  <td class="text-xs muted">' + esc(r.short_name || '-') + '</td>'
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

        tableHeadersHtml = ''
          + '<tr>'
          + app.th('ลำดับ', 'no')
          + app.th(isPrefix ? 'คำนำหน้าชื่อ' : 'สถานะการทำงาน', 'name')
          + app.th('ชื่อย่อ (Short Name)', 'action')
          + app.th('เลื่อนลำดับ', 'action')
          + app.th('จัดการ', 'action')
          + '</tr>';

        toolsHtml = '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.openAddReferenceModal(\'' + curType + '\')"><i data-lucide="plus" class="w-4 h-4"></i> เพิ่ม' + refLabel + '</button>';

      } else {
        sectionBarTitle = 'โครงสร้างสายงานและระดับตำแหน่ง (' + esc(curType) + ')';

        var posItems = posList.filter(function (p) {
          return p.position_type === curType;
        }).sort(function (a, b) {
          return (a.sort_order || 0) - (b.sort_order || 0);
        });

        if (posItems.length === 0) {
          rowsHtml = '<tr><td colspan="5" class="text-center py-10 muted"><i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i><div class="text-sm">ไม่มีข้อมูลตำแหน่งในประเภทนี้</div></td></tr>';
        } else {
          posItems.forEach(function (p, idx) {
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

        tableHeadersHtml = ''
          + '<tr>'
          + app.th('ลำดับ', 'no')
          + app.th('ชื่อสายงาน / ตำแหน่ง', 'name')
          + app.th('ระดับตำแหน่ง', 'position')
          + app.th('เลื่อนลำดับ', 'action')
          + app.th('จัดการ', 'action')
          + '</tr>';

        toolsHtml = ''
          + '<button type="button" class="btn-ghost" onclick="PORTAL_ADMIN.promptAddNewPositionType()"><i data-lucide="folder-plus" class="w-4 h-4"></i> เพิ่มประเภทตำแหน่งใหม่</button>'
          + '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.openAddPositionModal(\'' + esc(curType) + '\')"><i data-lucide="plus" class="w-4 h-4"></i> เพิ่มตำแหน่ง (' + esc(curType) + ')</button>';
      }

      var sectionHeader = app.sectionBar(sectionBarTitle, toolsHtml, 'layers');

      var tableHtml = ''
        + '<div class="card overflow-hidden">'
        + '  <div class="overflow-x-auto">'
        + '    <table class="tbl min-w-[700px]">'
        + '      <thead>' + tableHeadersHtml + '</thead>'
        + '      <tbody>' + rowsHtml + '</tbody>'
        + '    </table>'
        + '  </div>'
        + '</div>';

      pageBody.innerHTML = sectionHeader + tabButtonsHtml + tableHtml;
      triggerIcons();
    },

    switchPosTab: function (tabType) {
      var admState = getState();
      admState.currentPosTab = tabType;
      AdminPositions.renderPositionsPage();
    },

    promptAddNewPositionType: async function () {
      var app = getApp();
      if (!app) return;
      var newType = '';
      if (global.Swal) {
        var res = await global.Swal.fire({
          title: 'เพิ่มประเภทตำแหน่งใหม่',
          input: 'text',
          inputLabel: 'ระบุชื่อประเภทตำแหน่งใหม่ (เช่น พนักงานจ้างเหมา, พนักงานราชการ)',
          inputPlaceholder: 'ชื่อประเภทตำแหน่ง',
          showCancelButton: true,
          confirmButtonText: 'ถัดไป',
          cancelButtonText: 'ยกเลิก',
          confirmButtonColor: '#007B3E',
          inputValidator: function (value) {
            if (!value || !value.trim()) return 'กรุณาระบุชื่อประเภทตำแหน่ง!';
          }
        });
        if (res.isConfirmed && res.value) {
          newType = res.value.trim();
        }
      } else {
        newType = (prompt('ระบุชื่อประเภทตำแหน่งใหม่:') || '').trim();
      }
      if (newType) {
        getState().currentPosTab = newType;
        AdminPositions.openAddPositionModal(newType);
      }
    },

    movePosition: async function (positionId, direction) {
      var app = getApp();
      if (!app) return;
      var curType = getState().currentPosTab;
      var posList = (app.STATE && app.STATE.positionStructure) || getState().positionStructure || [];

      var list = posList.filter(function (p) {
        return p.position_type === curType;
      }).sort(function (a, b) {
        return (a.sort_order || 0) - (b.sort_order || 0);
      });

      var idx = list.findIndex(function (x) { return x.position_id === positionId; });
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
        await getApi().savePositionStructure({ position_id: itemA.position_id, sort_order: sortB });
        await getApi().savePositionStructure({ position_id: itemB.position_id, sort_order: sortA });

        itemA.sort_order = sortB;
        itemB.sort_order = sortA;
        AdminPositions.renderPositionsPage();
        toast('ปรับลำดับเรียบร้อย');
      } catch (e) {
        alertError('ปรับลำดับไม่สำเร็จ: ' + e.message);
      }
    },

    openSinglePositionModal: function (positionId) {
      var app = getApp();
      if (!app) return;
      var curType = getState().currentPosTab;
      var posList = (app.STATE && app.STATE.positionStructure) || getState().positionStructure || [];
      var item = null;
      if (positionId) {
        item = posList.find(function (p) { return p.position_id === positionId; });
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
    },

    submitSinglePositionModal: async function () {
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
        var res = await global.LOADER.busy(
          getApi().savePositionStructure(payload),
          'กำลังบันทึกข้อมูลตำแหน่ง...'
        );
        toast(res.message || 'บันทึกโครงสร้างตำแหน่งสำเร็จ');
        getApp().closeModal();

        var bootRes = await getApi().checkSystemInit(true);
        if (bootRes && bootRes.position_structure) {
          getApp().STATE.positionStructure = bootRes.position_structure;
          getState().positionStructure = bootRes.position_structure;
        }
        AdminPositions.renderPositionsPage();
      } catch (err) {
        alertError(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
      }
    },

    openAddPositionModal: function (currentType) {
      var app = getApp();
      if (!app) return;
      var type = currentType || getState().currentPosTab || 'ผู้บริหาร';
      var posTypes = app.getPositionTypes();
      if (type && posTypes.indexOf(type) === -1) {
        posTypes = [type].concat(posTypes);
      }

      var title = 'เพิ่มสายงาน/ตำแหน่ง (' + esc(type) + ')';

      var bodyHtml = ''
        + '<form id="admAddPosForm" onsubmit="event.preventDefault();" class="space-y-4">'
        + '  <div>'
        + '    <label class="lbl">ประเภทตำแหน่ง *</label>'
        + '    <input type="text" id="adm_add_pos_type" class="inp" value="' + esc(type) + '" required>'
        + '  </div>'
        + '  <div>'
        + '    <div class="flex items-center justify-between mb-2">'
        + '      <label class="lbl !mb-0 font-bold">รายการตำแหน่งที่ต้องการเพิ่ม (เพิ่มได้หลายแถวพร้อมกัน)</label>'
        + '      <button type="button" class="btn-ghost !py-1 !px-2.5 text-xs text-[#007B3E] font-bold" onclick="PORTAL_ADMIN.addPositionInputRow()">'
        + '        <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i> + เพิ่มแถว'
        + '      </button>'
        + '    </div>'
        + '    <div class="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl max-h-[340px] overflow-y-auto">'
        + '      <table class="tbl w-full text-xs">'
        + '        <thead>'
        + '          <tr>'
        + '            <th style="width:36px;" class="text-center">#</th>'
        + '            <th>ชื่อสายงาน / ตำแหน่ง *</th>'
        + '            <th style="width:160px;">ระดับตำแหน่ง (ถ้ามี)</th>'
        + '            <th style="width:40px;" class="text-center">ลบ</th>'
        + '          </tr>'
        + '        </thead>'
        + '        <tbody id="adm_pos_rows_body">'
        + '        </tbody>'
        + '      </table>'
        + '    </div>'
        + '  </div>'
        + '</form>';

      var footerHtml = ''
        + '<button type="button" class="btn-ghost" onclick="PORTAL_APP.closeModal()">ยกเลิก</button>'
        + '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.submitAddPositionModal()"><i data-lucide="save" class="w-4 h-4"></i> บันทึกตำแหน่งทั้งหมด</button>';

      app.openModal(title, bodyHtml, footerHtml, '650px', 'plus-circle');
      AdminPositions.addPositionInputRow();
      AdminPositions.addPositionInputRow();
      AdminPositions.addPositionInputRow();
      triggerIcons();
    },

    addPositionInputRow: function (pName, pLevel) {
      var tbody = document.getElementById('adm_pos_rows_body');
      if (!tbody) return;
      var rowCount = tbody.querySelectorAll('tr').length + 1;
      var tr = document.createElement('tr');
      tr.className = 'pos-input-row';
      tr.innerHTML = ''
        + '<td class="text-center font-bold muted row-idx">' + rowCount + '</td>'
        + '<td><input type="text" class="inp !py-1 !text-xs pos-row-name" placeholder="เช่น เจ้าพนักงานเทศกิจ, นิติกร" value="' + esc(pName || '') + '"></td>'
        + '<td><input type="text" class="inp !py-1 !text-xs pos-row-level" placeholder="เช่น ปฏิบัติงาน, ชำนาญการ" value="' + esc(pLevel || '') + '"></td>'
        + '<td class="text-center"><button type="button" class="btn-ghost !p-1 text-red-500 hover:text-red-700" onclick="PORTAL_ADMIN.removePositionInputRow(this)" title="ลบแถวนี้"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button></td>';
      tbody.appendChild(tr);
      triggerIcons();
    },

    removePositionInputRow: function (btn) {
      var tbody = document.getElementById('adm_pos_rows_body');
      if (!tbody) return;
      var tr = btn.closest('tr');
      if (tr) tr.remove();
      var rows = tbody.querySelectorAll('tr');
      rows.forEach(function (r, idx) {
        var idxCell = r.querySelector('.row-idx');
        if (idxCell) idxCell.textContent = String(idx + 1);
      });
      if (rows.length === 0) {
        AdminPositions.addPositionInputRow();
      }
    },

    submitAddPositionModal: async function () {
      var tbody = document.getElementById('adm_pos_rows_body');
      if (!tbody) return;

      var type = (document.getElementById('adm_add_pos_type').value || '').trim();
      if (!type) {
        alertError('กรุณาระบุประเภทตำแหน่ง');
        return;
      }

      var rows = tbody.querySelectorAll('.pos-input-row');
      var items = [];
      rows.forEach(function (r) {
        var nameInp = r.querySelector('.pos-row-name');
        var levelInp = r.querySelector('.pos-row-level');
        var pName = (nameInp && nameInp.value) ? nameInp.value.trim() : '';
        var pLevel = (levelInp && levelInp.value) ? levelInp.value.trim() : '';
        if (pName) {
          items.push({ position_name: pName, position_level: pLevel });
        }
      });

      if (items.length === 0) {
        alertError('กรุณาระบุชื่อตำแหน่งอย่างน้อย 1 แถว');
        return;
      }

      try {
        var res = await global.LOADER.busy(
          getApi().batchAddPosition({
            position_type: type,
            items: items
          }),
          'กำลังบันทึกตำแหน่งแบบหลายรายการ...'
        );
        toast(res.message || 'เพิ่มตำแหน่งเรียบร้อยแล้ว');
        getApp().closeModal();

        var bootRes = await getApi().checkSystemInit(true);
        if (bootRes && bootRes.position_structure) {
          getApp().STATE.positionStructure = bootRes.position_structure;
          getState().positionStructure = bootRes.position_structure;
        }
        getState().currentPosTab = type;
        AdminPositions.renderPositionsPage();
      } catch (err) {
        alertError(err.message || 'ไม่สามารถเพิ่มตำแหน่งได้');
      }
    },

    openBatchPositionModal: function (currentType) {
      AdminPositions.openAddPositionModal(currentType);
    },

    deletePosition: async function (positionId, name) {
      var confirmed = await getApp().confirmAction({
        title: 'ยืนยันการลบโครงสร้างตำแหน่ง?',
        text: 'ต้องการลบ "' + name + '" หรือไม่?',
        confirmText: 'ลบตำแหน่ง',
        cancelText: 'ยกเลิก',
        confirmColor: '#E53935'
      });
      if (!confirmed) return;

      try {
        var res = await global.LOADER.busy(
          getApi().deletePositionStructure(positionId),
          'กำลังลบตำแหน่ง...'
        );
        toast(res.message || 'ลบตำแหน่งสำเร็จ');
        var bootRes = await getApi().checkSystemInit(true);
        if (bootRes && bootRes.position_structure) {
          getApp().STATE.positionStructure = bootRes.position_structure;
          getState().positionStructure = bootRes.position_structure;
        }
        AdminPositions.renderPositionsPage();
      } catch (err) {
        alertError(err.message || 'ไม่สามารถลบตำแหน่งได้');
      }
    }
  };

  global.AdminPositions = AdminPositions;
})(window);

