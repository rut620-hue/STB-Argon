/**
 * =============================================================================
 * STB APP n2 — Portal Dashboard & SSO Launchpad (assets/js/modules/portal-dashboard.js)
 * =============================================================================
 * 4 Stat Cards, SSO WebApp Launchpad Grid, Dynamic Maintenance Handshake,
 * and 2 Chart.js Responsive Visualizations.
 * =============================================================================
 */
(function (global) {
  'use strict';

  var DASH_PERSONNEL_CACHE = [];

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

  var PortalDashboard = {
    renderDashboardPage: async function () {
      var content = (global.PortalState && global.PortalState.getContentEl)
        ? global.PortalState.getContentEl()
        : document.getElementById('content');
      if (!content) return;

      if (global.LOADER && typeof global.LOADER.into === 'function') {
        global.LOADER.into(content, 'กำลังโหลดข้อมูล Dashboard...');
      } else {
        content.innerHTML = '<div class="card p-10 text-center muted"><div class="spinner mx-auto mb-3"></div>กำลังโหลดข้อมูล Dashboard...</div>';
      }

      var appsPromise = global.PORTAL_API.getDashboardApps(true).catch(function () { return { apps: [] }; });
      var psnPromise = global.PORTAL_API.listPersonnel(true).catch(function () { return []; });

      var results = await Promise.all([appsPromise, psnPromise]);
      var state = getState();
      state.dashboardApps = (results[0] && results[0].apps) || [];
      DASH_PERSONNEL_CACHE = Array.isArray(results[1]) ? results[1] : ((results[1] && results[1].personnel) || []);

      var apps = state.dashboardApps;
      var activeCount = apps.filter(function (a) { return a.status === 'เปิดใช้งาน'; }).length;
      var u = state.user || {};
      var role = state.isSetupMode ? 'SUPERADMIN (Setup)' : (u.Role || u.role || 'USER');
      var totalPsn = DASH_PERSONNEL_CACHE.length || 0;

      // 4 Stat Cards
      var statFn = (global.PortalState && global.PortalState.statCard) ? global.PortalState.statCard : function (t, v) { return '<div>' + t + ': ' + v + '</div>'; };
      var statsHtml = ''
        + '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">'
        + statFn('เว็บแอปพลิเคชันทั้งหมด', apps.length, 'grid', 0, 'ระบบงาน')
        + statFn('ระบบที่เปิดให้บริการ', activeCount, 'check-circle-2', 1, 'พร้อมใช้งาน')
        + statFn('บุคลากรทั้งหมดในทำเนียบ', totalPsn, 'users', 2, 'คน')
        + statFn('ระดับสิทธิ์ผู้ใช้งาน', role, 'shield-check', 3, 'สิทธิ์ในระบบ')
        + '</div>';

      // SSO Subapp Launchpad Cards
      var cardsHtml = '';
      if (apps.length === 0) {
        cardsHtml = ''
          + '<div class="card p-10 text-center muted col-span-full">'
          + '  <i data-lucide="layers" class="w-10 h-10 mx-auto mb-3 opacity-60"></i>'
          + '  <h3 class="font-bold text-base mb-1">ยังไม่มีเว็บแอปพลิเคชันที่เปิดสิทธิ์ให้เข้าใช้งาน</h3>'
          + '  <p class="text-xs">ผู้ดูแลระบบสามารถเพิ่มเว็บแอปย่อยและกำหนดสิทธิ์ได้ที่เมนูจัดการเว็บแอปย่อย</p>'
          + '</div>';
      } else {
        apps.forEach(function (app) {
          var isMaint = app.status === 'ปิดปรับปรุง' || app.status === 'MAINTENANCE';
          var iconImg = (global.PortalState && global.PortalState.resolveDriveImg) ? global.PortalState.resolveDriveImg(app.icon_url, '') : (app.icon_url || '');
          var iconBoxHtml = iconImg
            ? '<img src="' + esc(iconImg) + '" alt="Icon" class="w-full h-full object-cover" loading="lazy">'
            : '<i data-lucide="layers" class="w-6 h-6"></i>';

          cardsHtml += ''
            + '<div class="app-card' + (isMaint ? ' opacity-90' : '') + '" onclick="PORTAL_APP.launchSubApp(\'' + esc(app.webapp_id) + '\')">'
            + '  <div class="flex items-start justify-between gap-3">'
            + '    <div class="app-icon-box">' + iconBoxHtml + '</div>'
            + '    <div class="flex gap-1.5 flex-wrap justify-end">'
            + (isMaint
              ? '<span class="chip" style="background:rgba(255,179,0,0.15);color:var(--amber);"><i data-lucide="wrench" class="w-3 h-3"></i> ปิดปรับปรุง</span>'
              : '<span class="chip"><i data-lucide="zap" class="w-3 h-3"></i> พร้อมใช้งาน</span>')
            + '      <span class="badge soft">' + esc(app.access_level || 'USER') + '</span>'
            + '    </div>'
            + '  </div>'
            + '  <div class="mt-2">'
            + '    <h3 class="font-bold text-base text-slate-800 dark:text-slate-100">' + esc(app.name) + '</h3>'
            + '    <p class="text-xs muted mt-1 leading-relaxed">' + esc(app.description || 'คลิกเพื่อเข้าสู่ระบบอัตโนมัติผ่าน Single Sign-On (SSO)') + '</p>'
            + '  </div>'
            + '  <div class="mt-auto pt-3 border-t border-dashed border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs font-semibold accent">'
            + '    <span>รหัสระบบ: ' + esc(app.webapp_id) + '</span>'
            + '    <span class="inline-flex items-center gap-1">' + (isMaint ? 'ทดสอบระบบ' : 'เข้าใช้งาน') + ' <i data-lucide="external-link" class="w-3.5 h-3.5"></i></span>'
            + '  </div>'
            + '</div>';
        });
      }

      var adminPillsHtml = '';
      if (state.isSetupMode || role === 'SUPERADMIN' || role === 'ADMIN') {
        adminPillsHtml = ''
          + '<button type="button" class="btn-ghost !py-1 !text-xs" onclick="PORTAL_APP.navigate(\'webapps\')"><i data-lucide="grid" class="w-3.5 h-3.5"></i> จัดการเว็บแอป</button>'
          + '<button type="button" class="btn-ghost !py-1 !text-xs" onclick="PORTAL_APP.navigate(\'users\')"><i data-lucide="shield-check" class="w-3.5 h-3.5"></i> กำหนดสิทธิ์</button>';
      }

      var appSectionHtml = ''
        + '<div class="card p-5 mb-6">'
        + '  <div class="flex flex-wrap items-center justify-between gap-3 mb-4">'
        + '    <div class="flex items-center gap-2">'
        + '      <div class="w-9 h-9 rounded-xl chip flex items-center justify-center shrink-0"><i data-lucide="rocket" class="w-4 h-4"></i></div>'
        + '      <div><h2 class="font-bold text-base">ระบบงานย่อยที่เชื่อมต่อ Single Sign-On (SSO)</h2>'
        + '      <p class="text-[11px] muted">คลิกเพื่อเข้าสู่ระบบย่อยโดยไม่ต้องล็อกอินซ้ำ</p></div>'
        + '    </div>'
        + '    <div class="flex items-center gap-2 flex-wrap">'
        + adminPillsHtml
        + '      <button type="button" class="btn-ghost !py-1 !text-xs" onclick="PORTAL_APP.renderDashboardPage()"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> รีเฟรช</button>'
        + '    </div>'
        + '  </div>'
        + '  <div class="app-grid">' + cardsHtml + '</div>'
        + '</div>';

      // Chart.js Visualizations (Personnel by Position Type & Personnel by Department)
      var chartsHtml = ''
        + '<div class="grid md:grid-cols-2 gap-4">'
        + '  <div class="card p-5">'
        + '    <div class="flex items-center gap-2 mb-1"><i data-lucide="pie-chart" class="w-4 h-4 accent"></i><h3 class="font-bold text-sm">สัดส่วนบุคลากรแยกตามประเภทตำแหน่ง</h3></div>'
        + '    <p class="text-[11px] muted mb-3">จำแนกตามประเภทบุคลากรในทำเนียบ</p>'
        + '    <div class="relative h-64"><canvas id="chPosType"></canvas></div>'
        + '  </div>'
        + '  <div class="card p-5">'
        + '    <div class="flex items-center gap-2 mb-1"><i data-lucide="bar-chart-2" class="w-4 h-4 accent"></i><h3 class="font-bold text-sm">จำนวนบุคลากรแยกตามส่วน/ฝ่าย</h3></div>'
        + '    <p class="text-[11px] muted mb-3">จำแนกตามโครงสร้างส่วนราชการ</p>'
        + '    <div class="relative h-64"><canvas id="chDept"></canvas></div>'
        + '  </div>'
        + '</div>';

      content.innerHTML = statsHtml + appSectionHtml + chartsHtml;
      icons();
      PortalDashboard.renderDashboardCharts();
    },

    renderDashboardCharts: function () {
      if (global.PortalState && typeof global.PortalState.destroyCharts === 'function') {
        global.PortalState.destroyCharts();
      }
      if (typeof Chart === 'undefined') return;

      var psn = DASH_PERSONNEL_CACHE || [];
      var posTypeCounts = {};
      var deptCounts = {};

      psn.forEach(function (p) {
        var pt = p.position_type || 'ไม่ระบุ';
        posTypeCounts[pt] = (posTypeCounts[pt] || 0) + 1;
        var dp = p.department || p.office || 'สำนักเทศกิจ';
        deptCounts[dp] = (deptCounts[dp] || 0) + 1;
      });

      var ptLabels = Object.keys(posTypeCounts);
      var ptData = ptLabels.map(function (k) { return posTypeCounts[k]; });

      var dpLabels = Object.keys(deptCounts);
      var dpData = dpLabels.map(function (k) { return deptCounts[k]; });

      var state = getState();
      var grid = state.theme === 'dark' ? '#30363D' : '#eef4f0';
      var tick = state.theme === 'dark' ? '#8B949E' : '#64748b';
      var colors = (global.PortalState && global.PortalState.THEMEC) ? global.PortalState.THEMEC() : ['#007B3E', '#4EBA6F'];
      var charts = (global.PortalState && global.PortalState.DASH_CHARTS) || {};

      var c1 = document.getElementById('chPosType');
      if (c1 && ptLabels.length > 0) {
        charts.chPosType = new Chart(c1, {
          type: 'bar',
          data: {
            labels: ptLabels,
            datasets: [{
              label: 'จำนวนบุคลากร (คน)',
              data: ptData,
              backgroundColor: ptLabels.map(function (_, i) { return colors[i % colors.length]; }),
              borderRadius: 8,
              maxBarThickness: 44
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, ticks: { precision: 0, color: tick }, grid: { color: grid } },
              x: { grid: { display: false }, ticks: { font: { size: 11 }, color: tick, autoSkip: false } }
            }
          }
        });
      }

      var c2 = document.getElementById('chDept');
      if (c2 && dpLabels.length > 0) {
        charts.chDept = new Chart(c2, {
          type: 'bar',
          data: {
            labels: dpLabels,
            datasets: [{
              label: 'จำนวนบุคลากร (คน)',
              data: dpData,
              backgroundColor: dpLabels.map(function (_, i) { return colors[(i + 3) % colors.length]; }),
              borderRadius: 8,
              maxBarThickness: 28
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { beginAtZero: true, ticks: { precision: 0, color: tick }, grid: { color: grid } },
              y: { grid: { display: false }, ticks: { font: { size: 11 }, color: tick } }
            }
          }
        });
      }
    },

    launchSubApp: async function (webappId) {
      var state = getState();
      if (state.isSetupMode) {
        global.PortalUI.alertError('กรุณาเพิ่มข้อมูลบุคลากรและสร้างบัญชี SUPERADMIN คนแรกให้เสร็จสิ้นก่อนทดสอบเปิดเว็บแอปย่อยผ่าน SSO');
        return;
      }

      var appObj = (state.dashboardApps || []).find(function (a) { return a.webapp_id === webappId; });
      var u = state.user || {};
      var role = u.Role || u.role || 'USER';
      var isSuper = state.isSetupMode || role === 'SUPERADMIN';
      var isAppAdmin = appObj && appObj.access_level === 'ADMIN';

      if (appObj && (appObj.status === 'ปิดปรับปรุง' || appObj.status === 'MAINTENANCE')) {
        if (!isSuper && !isAppAdmin) {
          global.PortalUI.alertError('แอปพลิเคชัน "' + (appObj.name || webappId) + '" อยู่ระหว่างปิดปรับปรุงชั่วคราว\n(อนุญาตเฉพาะผู้ดูแลระบบของแอปเข้าทดสอบ)', 'ระบบปิดปรับปรุง');
          return;
        }
      }

      var popup = window.open('about:blank', '_blank');
      if (popup && popup.document) {
        popup.document.write('<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>กำลังเชื่อมต่อ SSO...</title></head><body style="font-family:sans-serif;background:#00351B;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;"><h2>กำลังออกบัตรผ่าน Single Sign-On (SSO)...</h2><p>โปรดรอสักครู่ ระบบกำลังส่งข้อมูลยืนยันตัวตนไปยังระบบงานย่อย</p></div></body></html>');
      }

      try {
        var res = await global.PORTAL_API.generateSsoToken(webappId);
        var targetUrl = (global.PortalState && global.PortalState.resolveWebappTargetUrl)
          ? global.PortalState.resolveWebappTargetUrl(res.webapp && res.webapp.url ? res.webapp.url : '', res.sso_token)
          : (res.webapp && res.webapp.url ? res.webapp.url : '');

        if (popup) {
          popup.location.href = targetUrl;
        } else {
          window.location.href = targetUrl;
        }
      } catch (err) {
        if (popup) popup.close();
        global.PortalUI.alertError(err.message || 'ไม่สามารถเปิดเว็บแอปพลิเคชันได้');
      }
    }
  };

  global.PortalDashboard = PortalDashboard;
})(window);

