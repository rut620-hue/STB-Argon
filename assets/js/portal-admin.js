/**
 * =============================================================================
 * STB APP n2 — Central Portal Admin & Superadmin Module (assets/js/portal-admin.js)
 * =============================================================================
 * หมายเหตุ: ไฟล์นี้เตรียมโครงสร้าง Route สำหรับ 🟣 เฟส 1D (Admin & Superadmin Views):
 * - #personnel : จัดการทำเนียบบุคลากร (20 คอลัมน์ + อัปโหลดรูป/ลายเซ็น)
 * - #users     : จัดการผู้ใช้งาน & ผูกบัญชี SUPERADMIN คนแรก (Auto-Lock Setup Mode) + กำหนดสิทธิ์รายแอป
 * - #webapps   : จัดการเว็บแอปย่อย (SSO Registry)
 * - #reference : จัดการโครงสร้างสังกัด 4 ระดับ & คำนำหน้าชื่อ (เลื่อนลำดับ ▲▼ & Batch Add)
 * - #positions : จัดการโครงสร้างตำแหน่ง 6 ประเภทของ กทม. (เลื่อนลำดับ ▲▼ & Batch Add)
 * - #settings  : ตั้งค่าระบบ 13 Keys + ทดสอบโฟลเดอร์ Google Drive + ล้างข้อมูลทดสอบ (Reset Test Data)
 * =============================================================================
 */
(function (global) {
  'use strict';

  function renderPhase1DPlaceholder(routeTitle, routeCode) {
    var app = global.PORTAL_APP;
    if (!app) return;
    app.setPageHeader(routeTitle, 'โมดูลผู้ดูแลระบบ (เตรียมสร้างในเฟส 1D ถัดไป)');
    var pageBody = document.getElementById('pageBody');
    if (!pageBody) return;
    pageBody.innerHTML = ''
      + '<div class="card">'
      + '  <div class="card-header">'
      + '    <div class="card-title"><i class="fa-solid fa-layer-group" style="color:var(--primary);"></i> ' + app.esc(routeTitle) + ' (<code>#' + app.esc(routeCode) + '</code>)</div>'
      + '    <span class="chip chip-amber">Phase 1D Ready</span>'
      + '  </div>'
      + '  <p style="margin:0;color:var(--text-muted);font-size:0.94rem;">ระบบแกนหลักของ Central Portal (Phase 1C) พร้อมใช้งานแล้ว สามารถสั่ง <b>"เริ่มเฟส 1D"</b> เพื่อเปิดใช้งานหน้าจัดการข้อมูลผู้ดูแลระบบทั้งหมดและแอปย่อยตัวอย่างได้ทันที</p>'
      + '</div>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var app = global.PORTAL_APP;
    if (!app || typeof app.registerAdminRoute !== 'function') return;

    app.registerAdminRoute('personnel', function () {
      renderPhase1DPlaceholder('ทำเนียบบุคลากร (Personnel Management)', 'personnel');
    });
    app.registerAdminRoute('users', function () {
      renderPhase1DPlaceholder('จัดการบัญชีผู้ใช้งานและสิทธิ์ (Users & Permissions)', 'users');
    });
    app.registerAdminRoute('webapps', function () {
      renderPhase1DPlaceholder('จัดการเว็บแอปพลิเคชันย่อย (SSO WebApps)', 'webapps');
    });
    app.registerAdminRoute('reference', function () {
      renderPhase1DPlaceholder('จัดการโครงสร้างสังกัด 4 ระดับ & คำนำหน้าชื่อ', 'reference');
    });
    app.registerAdminRoute('positions', function () {
      renderPhase1DPlaceholder('จัดการโครงสร้างสายงานและตำแหน่ง 6 ประเภท กทม.', 'positions');
    });
    app.registerAdminRoute('settings', function () {
      renderPhase1DPlaceholder('ตั้งค่าระบบ (System Settings & Reset Test Data)', 'settings');
    });
  });
})(window);
