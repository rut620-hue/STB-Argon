/**
 * =============================================================================
 * STB APP n2 — Portal Dynamic Cascade Engine (assets/js/core/portal-cascade.js)
 * =============================================================================
 * 4-Level BMA Organization Structure (Bureau -> Office -> Dept -> Div)
 * Position Classification Cascade (Type -> Position -> Level)
 * 100% In-Memory Deduplication & Parent-Constraint Integrity Engine
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

  var PortalCascade = {
    /**
     * Get active reference items by type with optional parent value filter and deduplication
     */
    getReferenceItems: function (type, parentValue) {
      var state = getState();
      var targetType = String(type || '').toUpperCase();
      var hasParentConstraint = (parentValue !== undefined && parentValue !== null);

      if (hasParentConstraint && String(parentValue).trim() === '') {
        return [];
      }

      var list = (state.referenceData || []).filter(function (item) {
        if (item.is_active === false) return false;
        if (String(item.type || '').toUpperCase() !== targetType) return false;
        if (hasParentConstraint) {
          return String(item.parent_value || '').trim() === String(parentValue).trim();
        }
        return true;
      });

      list.sort(function (a, b) { return (a.sort_order || 999) - (b.sort_order || 999); });

      var seen = {};
      var uniqueList = [];
      list.forEach(function (it) {
        var k = String(it.value || '').trim();
        if (k && !seen[k]) {
          seen[k] = true;
          uniqueList.push(it);
        }
      });
      return uniqueList;
    },

    /**
     * Get list of unique active position types
     */
    getPositionTypes: function () {
      var state = getState();
      var seen = {};
      var result = [];
      (state.positionStructure || []).forEach(function (p) {
        var t = String(p.position_type || '').trim();
        if (t && !seen[t] && p.is_active !== false) {
          seen[t] = true;
          result.push(t);
        }
      });
      return result;
    },

    /**
     * Get list of positions filtered by position type
     */
    getPositionsByType: function (posType) {
      var state = getState();
      var seen = {};
      var out = [];
      var rows = (state.positionStructure || []).filter(function (p) {
        return p.is_active !== false && (!posType || String(p.position_type || '').trim() === String(posType).trim());
      });
      rows.sort(function (a, b) { return (a.sort_order || 999) - (b.sort_order || 999); });
      rows.forEach(function (r) {
        var name = String(r.position_name || '').trim();
        if (name && !seen[name]) {
          seen[name] = true;
          out.push(name);
        }
      });
      return out;
    },

    /**
     * Get levels for a given position
     */
    getLevelsByPosition: function (posType, posName) {
      var state = getState();
      if (posName === undefined && posType) {
        posName = posType;
        posType = null;
      }
      var seen = {};
      var out = [];
      var rows = (state.positionStructure || []).filter(function (p) {
        if (p.is_active === false) return false;
        if (posType && String(p.position_type || '').trim() !== String(posType).trim()) return false;
        if (posName && String(p.position_name || '').trim() !== String(posName).trim()) return false;
        return !!p.position_level;
      });
      rows.sort(function (a, b) { return (a.sort_order || 999) - (b.sort_order || 999); });
      rows.forEach(function (r) {
        var lvl = String(r.position_level || '').trim();
        if (lvl && !seen[lvl]) {
          seen[lvl] = true;
          out.push(lvl);
        }
      });
      return out;
    },

    /**
     * Build <option> elements HTML string
     */
    buildOptionsHtml: function (items, selectedVal, placeholder, valueProp, labelProp) {
      var html = '<option value="">' + esc(placeholder || '-- เลือก --') + '</option>';
      var seen = {};
      (items || []).forEach(function (it) {
        if (it === null || it === undefined) return;
        var val = typeof it === 'object' ? it[valueProp || 'value'] : it;
        var lbl = typeof it === 'object' ? it[labelProp || 'value'] : it;
        val = String(val !== undefined && val !== null ? val : '').trim();
        lbl = String(lbl !== undefined && lbl !== null ? lbl : '').trim();
        if (!val) return;
        if (seen[val]) return;
        seen[val] = true;
        var sel = String(val) === String(selectedVal || '').trim() ? ' selected' : '';
        html += '<option value="' + esc(val) + '"' + sel + '>' + esc(lbl || val) + '</option>';
      });
      return html;
    },

    /**
     * Bind cascading dropdown logic between Bureau -> Office -> Dept -> Div
     * and PosType -> PosName -> PosLevel
     */
    bindOrgAndPositionCascade: function (prefixId, initialValues) {
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
        var names = PortalCascade.getPositionsByType(pType);
        if (curPos && names.indexOf(curPos) === -1) names.unshift(curPos);
        elPosName.innerHTML = PortalCascade.buildOptionsHtml(names, curPos, '-- เลือกสายงาน/ตำแหน่ง --');
        refreshPosLevel(keepSelected);
      }

      function refreshPosLevel(keepSelected) {
        if (!elPosLevel) return;
        var pType = elPosType ? elPosType.value : '';
        var pName = elPosName ? elPosName.value : '';
        var curLvl = keepSelected ? (elPosLevel.value || initialValues.position_level || '') : '';
        var levels = PortalCascade.getLevelsByPosition(pType, pName);
        if (curLvl && levels.indexOf(curLvl) === -1) levels.unshift(curLvl);
        if (levels.length === 0) {
          elPosLevel.innerHTML = '<option value="">-- ไม่มีระดับตำแหน่ง --</option>';
        } else {
          elPosLevel.innerHTML = PortalCascade.buildOptionsHtml(levels, curLvl, '-- เลือกระดับตำแหน่ง --');
        }
      }

      function refreshOffice(keepSelected) {
        if (!elOffice) return;
        var bVal = elBureau ? elBureau.value : '';
        var curOff = keepSelected ? (elOffice.value || initialValues.office || '') : '';
        var items = PortalCascade.getReferenceItems('OFFICE', bVal).map(function (x) { return x.value; });
        if (curOff && items.indexOf(curOff) === -1) items.unshift(curOff);
        elOffice.innerHTML = PortalCascade.buildOptionsHtml(items, curOff, bVal ? '-- เลือกสำนักงาน/กอง --' : '-- กรุณาเลือกสำนักก่อน --');
        refreshDept(keepSelected);
      }

      function refreshDept(keepSelected) {
        if (!elDept) return;
        var oVal = elOffice ? elOffice.value : '';
        var curDept = keepSelected ? (elDept.value || initialValues.department || '') : '';
        var items = PortalCascade.getReferenceItems('DEPARTMENT', oVal).map(function (x) { return x.value; });
        if (curDept && items.indexOf(curDept) === -1) items.unshift(curDept);
        elDept.innerHTML = PortalCascade.buildOptionsHtml(items, curDept, oVal ? '-- เลือกฝ่าย/ส่วน --' : '-- กรุณาเลือกสำนักงาน/กองก่อน --');
        refreshDiv(keepSelected);
      }

      function refreshDiv(keepSelected) {
        if (!elDiv) return;
        var dVal = elDept ? elDept.value : '';
        var curDiv = keepSelected ? (elDiv.value || initialValues.division || '') : '';
        var items = PortalCascade.getReferenceItems('DIVISION', dVal).map(function (x) { return x.value; });
        if (curDiv && items.indexOf(curDiv) === -1) items.unshift(curDiv);
        elDiv.innerHTML = PortalCascade.buildOptionsHtml(items, curDiv, dVal ? '-- เลือกกลุ่มงาน (ถ้ามี) --' : '-- กรุณาเลือกฝ่าย/ส่วนก่อน --');
      }

      if (elPosType) elPosType.addEventListener('change', function () { refreshPosName(false); });
      if (elPosName) elPosName.addEventListener('change', function () { refreshPosLevel(false); });
      if (elBureau) elBureau.addEventListener('change', function () { refreshOffice(false); });
      if (elOffice) elOffice.addEventListener('change', function () { refreshDept(false); });
      if (elDept) elDept.addEventListener('change', function () { refreshDiv(false); });

      refreshPosName(true);
      refreshOffice(true);
    }
  };

  global.PortalCascade = PortalCascade;
})(window);

