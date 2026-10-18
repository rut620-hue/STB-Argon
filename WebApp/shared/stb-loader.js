/**
 * =============================================================================
 * STB Shared Module: BMA 3D Logo Flip Loader (shared/stb-loader.js)
 * ถอดแบบ 100% จาก Loader.html ต้นฉบับ (รองรับทั้ง Central Portal และเว็บแอปย่อยทุกตัว)
 * =============================================================================
 * โหมดการทำงาน:
 * 1. Splash Screen (#splash): หน้าจอโหลดเข้าสู่ระบบครั้งแรก + LOADER.brandBoot()
 * 2. Overlay Mask (#ldMask / LOADER.show): การ์ดโหลดโปร่งแสงทับหน้าจอ + Watchdog 60s
 * 3. Page Loader (LOADER.page): โหลดเฉพาะพื้นที่เนื้อหา (.ld-page)
 * 4. Inline Loader (LOADER.inline / LOADER.into): โหลดในการ์ดหรือกล่องย่อย (.ld-inline)
 * =============================================================================
 */
(function (global) {
  'use strict';

  var DEFAULT_LOGO_BMA = 'https://pr-bangkok.com/wp-content/uploads/2025/06/231116_BMA-Emblem_Edited_Green-600x600.png';
  var DEFAULT_LOGO_DEPT = 'https://upload.wikimedia.org/wikipedia/commons/3/35/Patch_of_Bangkok_City_Law_Enforcement_Department.png';
  var BRAND_STORAGE_KEY = 'stb_portal_brand_v2';
  var WD_MS = 60000; // Watchdog 60 วินาทีป้องกันหน้าจอค้าง

  var _count = 0;
  var _wdTimer = null;
  var _styleInjected = false;

  function injectLoaderStyles_() {
    if (_styleInjected || document.getElementById('stb-loader-styles')) {
      _styleInjected = true;
      return;
    }
    var css = [
      ':root {',
      '  --logo-bma: url("' + DEFAULT_LOGO_BMA + '");',
      '  --logo-dept: url("' + DEFAULT_LOGO_DEPT + '");',
      '}',
      '/* BMA 3D Coin Flip Animation */',
      '.logo-flip {',
      '  --ld-size: 80px;',
      '  width: var(--ld-size);',
      '  height: var(--ld-size);',
      '  position: relative;',
      '  display: inline-block;',
      '  background-image: var(--logo-bma);',
      '  background-size: contain;',
      '  background-position: center;',
      '  background-repeat: no-repeat;',
      '  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.18));',
      '  flex-shrink: 0;',
      '}',
      '.logo-flip::before, .logo-flip::after {',
      '  content: "";',
      '  position: absolute;',
      '  inset: 0;',
      '  background-image: var(--logo-dept);',
      '  background-size: contain;',
      '  background-position: center;',
      '  background-repeat: no-repeat;',
      '  animation: stb-logo-flip 2s infinite linear;',
      '}',
      '.logo-flip::after {',
      '  animation-name: stb-logo-flip-r;',
      '}',
      '@keyframes stb-logo-flip {',
      '  0%, 100%   { clip-path: inset(0 0 50% 0); transform: perspective(200px) rotateX(0deg); }',
      '  12.5%      { clip-path: inset(0 0 50% 0); transform: perspective(200px) rotateX(90deg); }',
      '  12.51%, 37.5% { clip-path: inset(0 0 0 50%); transform: perspective(200px) rotateY(90deg); }',
      '  25%        { clip-path: inset(0 0 0 50%); transform: perspective(200px) rotateY(0deg); }',
      '  37.51%, 62.5% { clip-path: inset(50% 0 0 0); transform: perspective(200px) rotateX(90deg); }',
      '  50%        { clip-path: inset(50% 0 0 0); transform: perspective(200px) rotateX(0deg); }',
      '  62.51%, 87.5% { clip-path: inset(0 50% 0 0); transform: perspective(200px) rotateY(90deg); }',
      '  75%        { clip-path: inset(0 50% 0 0); transform: perspective(200px) rotateY(0deg); }',
      '  87.51%     { clip-path: inset(0 0 50% 0); transform: perspective(200px) rotateX(90deg); }',
      '}',
      '@keyframes stb-logo-flip-r {',
      '  0%, 100%   { clip-path: inset(50% 0 0 0); transform: perspective(200px) rotateX(0deg); }',
      '  12.5%      { clip-path: inset(50% 0 0 0); transform: perspective(200px) rotateX(-90deg); }',
      '  12.51%, 37.5% { clip-path: inset(0 50% 0 0); transform: perspective(200px) rotateY(-90deg); }',
      '  25%        { clip-path: inset(0 50% 0 0); transform: perspective(200px) rotateY(0deg); }',
      '  37.51%, 62.5% { clip-path: inset(0 0 50% 0); transform: perspective(200px) rotateX(-90deg); }',
      '  50%        { clip-path: inset(0 0 50% 0); transform: perspective(200px) rotateX(0deg); }',
      '  62.51%, 87.5% { clip-path: inset(0 0 0 50%); transform: perspective(200px) rotateY(-90deg); }',
      '  75%        { clip-path: inset(0 0 0 50%); transform: perspective(200px) rotateY(0deg); }',
      '  87.51%     { clip-path: inset(50% 0 0 0); transform: perspective(200px) rotateX(-90deg); }',
      '}',
      '/* 1. Overlay Mask */',
      '.ld-mask {',
      '  position: fixed; inset: 0; z-index: 9998;',
      '  background: rgba(8, 20, 14, 0.44);',
      '  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);',
      '  display: flex; align-items: center; justify-content: center;',
      '  opacity: 0; pointer-events: none; transition: opacity 0.2s ease;',
      '}',
      '.ld-mask.show { opacity: 1; pointer-events: auto; }',
      '.ld-card {',
      '  background: var(--surface, #ffffff); color: var(--text, #1e293b);',
      '  border: 1px solid var(--border, #e6efe9); border-radius: 1.25rem;',
      '  padding: 1.5rem 2rem; min-width: 265px; max-width: 90vw;',
      '  box-shadow: 0 22px 50px rgba(0, 0, 0, 0.28);',
      '  display: flex; flex-direction: column; align-items: center; gap: 0.75rem;',
      '  text-align: center; font-family: "Sarabun", sans-serif;',
      '}',
      '.ld-card .logo-flip { --ld-size: 74px; }',
      '.ld-text { font-size: 0.96rem; font-weight: 700; color: var(--text, #1e293b); }',
      '.ld-sub { font-size: 0.78rem; color: var(--muted, #64748b); margin-top: -0.35rem; }',
      '.ld-bar {',
      '  width: 148px; height: 4px; border-radius: 99px;',
      '  background: var(--border, #e6efe9); overflow: hidden; position: relative;',
      '}',
      '.ld-bar::after {',
      '  content: ""; position: absolute; inset: 0; width: 45%; border-radius: 99px;',
      '  background: linear-gradient(90deg, var(--g1, #007B3E), var(--g2, #4EBA6F));',
      '  animation: stb-ld-slide 1.15s infinite ease-in-out;',
      '}',
      '@keyframes stb-ld-slide { 0% { transform: translateX(-110%); } 100% { transform: translateX(250%); } }',
      '/* 2. Page Loader */',
      '.ld-page {',
      '  min-height: 54vh; display: flex; flex-direction: column;',
      '  align-items: center; justify-content: center; gap: 0.85rem;',
      '  padding: 2.5rem 1rem; text-align: center; font-family: "Sarabun", sans-serif;',
      '}',
      '.ld-page .logo-flip { --ld-size: 86px; }',
      '.ld-chip {',
      '  display: inline-flex; align-items: center; gap: 0.45rem;',
      '  padding: 0.35rem 0.9rem; border-radius: 99px; font-size: 0.82rem; font-weight: 700;',
      '  background: var(--chip, #e8f5ec); color: var(--chip-tx, #007B3E);',
      '}',
      '.ld-chip .dot {',
      '  width: 7px; height: 7px; border-radius: 50%; background: currentColor;',
      '  animation: stb-ld-pulse 1s infinite alternate;',
      '}',
      '@keyframes stb-ld-pulse { from { opacity: 0.3; transform: scale(0.85); } to { opacity: 1; transform: scale(1.15); } }',
      '/* 3. Inline Loader */',
      '.ld-inline {',
      '  display: flex; flex-direction: column; align-items: center; justify-content: center;',
      '  gap: 0.55rem; padding: 1.5rem 1rem; text-align: center;',
      '}',
      '.ld-inline .logo-flip { --ld-size: 54px; }',
      '/* 4. Splash Screen (#splash) */',
      '#splash {',
      '  position: fixed; inset: 0; z-index: 9999;',
      '  background: radial-gradient(circle at 20% 20%, #007B3E 0%, #00351B 68%, #001F10 100%);',
      '  color: #ffffff; display: flex; flex-direction: column;',
      '  align-items: center; justify-content: center; gap: 1rem;',
      '  font-family: "Sarabun", sans-serif; transition: opacity 0.38s ease, visibility 0.38s ease;',
      '}',
      '#splash.hide { opacity: 0; visibility: hidden; pointer-events: none; }',
      '#splash .logo-flip { --ld-size: 138px; filter: drop-shadow(0 12px 28px rgba(0,0,0,0.38)); }',
      '#splash .sp-title { font-size: 1.45rem; font-weight: 800; letter-spacing: 0.2px; text-align: center; margin-top: 0.35rem; }',
      '#splash .sp-sub { font-size: 0.92rem; opacity: 0.86; text-align: center; }',
      '#splash .sp-bar { width: 190px; height: 5px; border-radius: 99px; background: rgba(255,255,255,0.18); overflow: hidden; position: relative; margin-top: 0.35rem; }',
      '#splash .sp-bar::after { content: ""; position: absolute; inset: 0; width: 45%; border-radius: 99px; background: #FDD835; animation: stb-ld-slide 1.15s infinite ease-in-out; }',
      '#splash .sp-msg { font-size: 0.8rem; opacity: 0.78; }'
    ].join('\n');

    var style = document.createElement('style');
    style.id = 'stb-loader-styles';
    style.textContent = css;
    document.head.appendChild(style);
    _styleInjected = true;
  }

  function ensureMaskElement_() {
    injectLoaderStyles_();
    var mask = document.getElementById('ldMask');
    if (!mask) {
      mask = document.createElement('div');
      mask.id = 'ldMask';
      mask.className = 'ld-mask';
      mask.innerHTML = [
        '<div class="ld-card">',
          '<div class="logo-flip" aria-hidden="true"></div>',
          '<div id="ldText" class="ld-text">กำลังประมวลผล...</div>',
          '<div id="ldSub" class="ld-sub">โปรดรอสักครู่</div>',
          '<div class="ld-bar"></div>',
        '</div>'
      ].join('');
      document.body.appendChild(mask);
    }
    return mask;
  }

  function escHtml_(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  var LOADER = {
    /**
     * ตั้งค่าโลโก้ของ Loader และบันทึก Brand ลง localStorage เพื่อทำ Zero-Lag Boot
     */
    setBrand: function (opts) {
      injectLoaderStyles_();
      opts = opts || {};
      var root = document.documentElement;
      if (opts.logoBma) {
        root.style.setProperty('--logo-bma', 'url("' + opts.logoBma + '")');
      }
      if (opts.logoDept) {
        root.style.setProperty('--logo-dept', 'url("' + opts.logoDept + '")');
      }
      try {
        var current = JSON.parse(localStorage.getItem(BRAND_STORAGE_KEY) || '{}');
        var next = Object.assign({}, current, opts);
        localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
    },

    /**
     * โหลด Brand ที่แคชไว้ใน localStorage ขึ้นมาแสดงทันที 0 ms ตอนเปิดหน้าเว็บ
     * รองรับทั้ง opts แบบ string และแบบ object { title, sub, msg, logoBma, logoDept }
     */
    brandBoot: function (opts) {
      injectLoaderStyles_();
      opts = opts || {};
      if (typeof opts === 'string') {
        opts = { title: opts };
      }
      try {
        var cached = JSON.parse(localStorage.getItem(BRAND_STORAGE_KEY) || '{}');
        var root = document.documentElement;
        var logoBma = opts.logoBma || cached.logoBma;
        var logoDept = opts.logoDept || cached.logoDept;
        if (logoBma) root.style.setProperty('--logo-bma', 'url("' + logoBma + '")');
        if (logoDept) root.style.setProperty('--logo-dept', 'url("' + logoDept + '")');

        var appTitle = opts.title || opts.appName || cached.appName;
        var orgSub = opts.sub || opts.orgName || cached.orgName;
        var splashMsg = opts.msg || opts.message;

        var spTitle = document.getElementById('spTitle');
        if (spTitle && appTitle) spTitle.textContent = appTitle;
        var spSub = document.getElementById('spSub');
        if (spSub && orgSub) spSub.textContent = orgSub;
        var spMsg = document.getElementById('spMsg');
        if (spMsg && splashMsg) spMsg.textContent = splashMsg;

        return Object.assign({}, cached, opts);
      } catch (e) {
        return {};
      }
    },

    /**
     * แสดง Overlay Loader เต็มจอ (พร้อม Reference Counter & Watchdog 60s)
     */
    show: function (text, sub) {
      var mask = ensureMaskElement_();
      _count++;
      var t = document.getElementById('ldText');
      var s = document.getElementById('ldSub');
      if (t) t.textContent = text || 'กำลังประมวลผล...';
      if (s) s.textContent = sub || 'โปรดรอสักครู่';
      mask.classList.add('show');

      clearTimeout(_wdTimer);
      _wdTimer = setTimeout(function () {
        LOADER.forceHide();
        if (global.Swal) {
          global.Swal.fire({
            icon: 'warning',
            title: 'ใช้เวลาประมวลผลนานผิดปกติ',
            text: 'การเชื่อมต่อใช้เวลานานเกิน 60 วินาที กรุณาลองใหม่อีกครั้ง',
            confirmButtonColor: '#007B3E'
          });
        }
      }, WD_MS);
    },

    /**
     * อัปเดตข้อความระหว่างกำลังโหลด (ทั้งบน Overlay และ Splash)
     */
    text: function (msg, sub) {
      var t = document.getElementById('ldText');
      var s = document.getElementById('ldSub');
      var sp = document.getElementById('spMsg');
      if (t && msg) t.textContent = msg;
      if (s && sub !== undefined) s.textContent = sub;
      if (sp && msg) sp.textContent = msg;
    },

    /**
     * ซ่อน Overlay Loader เมื่อ Reference Counter ลงเหลือ 0
     */
    hide: function () {
      _count = Math.max(0, _count - 1);
      if (_count === 0) {
        clearTimeout(_wdTimer);
        var mask = document.getElementById('ldMask');
        if (mask) mask.classList.remove('show');
      }
    },

    /**
     * บังคับปิด Overlay Loader ทันที
     */
    forceHide: function () {
      _count = 0;
      clearTimeout(_wdTimer);
      var mask = document.getElementById('ldMask');
      if (mask) mask.classList.remove('show');
    },

    /**
     * ปิดหน้าจอ Splash Screen (#splash) อย่างนุ่มนวล
     */
    closeSplash: function () {
      var sp = document.getElementById('splash');
      if (!sp || sp.classList.contains('hide')) return;
      sp.classList.add('hide');
      setTimeout(function () {
        if (sp && sp.parentNode) sp.style.display = 'none';
      }, 420);
    },

    /**
     * คืนค่า HTML สำหรับ Page Loader (แสดงกลางพื้นที่เนื้อหา #pageBody)
     * หรือใส่ลงใน container หากส่ง container มา
     */
    page: function (textOrContainer, subOrIsPage, textIfThree) {
      injectLoaderStyles_();
      if (subOrIsPage === true && textIfThree !== undefined) {
        var el = typeof textOrContainer === 'string' ? document.getElementById(textOrContainer) : textOrContainer;
        var html = LOADER.page(textIfThree);
        if (el) el.innerHTML = html;
        return html;
      }
      var text = textOrContainer;
      var sub = subOrIsPage;
      return [
        '<div class="ld-page">',
          '<div class="logo-flip" aria-hidden="true"></div>',
          '<div class="ld-text">' + escHtml_(text || 'กำลังโหลดข้อมูล...') + '</div>',
          (sub ? '<div class="ld-sub">' + escHtml_(sub) + '</div>' : ''),
          '<div class="ld-chip"><span class="dot"></span><span>โปรดรอสักครู่</span></div>',
        '</div>'
      ].join('');
    },

    /**
     * แสดง Page Loader ลงใน Container ที่ระบุ
     */
    showPage: function (container, text) {
      return LOADER.page(container, true, text);
    },

    /**
     * ปิด Splash Boot
     */
    hideBoot: function () {
      LOADER.closeSplash();
    },

    /**
     * ตั้งค่า Logo ทางลัด
     */
    setLogo: function (url) {
      LOADER.setBrand({ logoBma: url });
    },

    /**
     * คืนค่า HTML สำหรับ Inline Loader ขนาดกะทัดรัด
     */
    inline: function (text) {
      injectLoaderStyles_();
      return [
        '<div class="ld-inline">',
          '<div class="logo-flip" aria-hidden="true"></div>',
          '<div class="ld-sub">' + escHtml_(text || 'กำลังโหลด...') + '</div>',
        '</div>'
      ].join('');
    },

    /**
     * ใส่ Inline Loader ลงใน Element ที่ระบุโดยตรง
     */
    into: function (elOrId, text) {
      var el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
      if (el) el.innerHTML = LOADER.inline(text);
    },

    /**
     * ห่อ Promise ด้วย LOADER.show() และปิดให้อัตโนมัติใน finally
     */
    busy: function (promise, text, sub) {
      LOADER.show(text, sub);
      return Promise.resolve(promise).finally(function () {
        LOADER.hide();
      });
    }
  };

  global.LOADER = LOADER;
  global.STB_LOADER = LOADER;
})(window);

