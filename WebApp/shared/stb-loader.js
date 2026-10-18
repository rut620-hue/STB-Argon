/**
 * =============================================================================
 * STB Shared Module: BMA 3D Logo Flip Loader (shared/stb-loader.js)
 * ถอดแบบ 100% จาก Loader.html ต้นฉบับ (ref_122wc/Loader.html)
 * =============================================================================
 * โหมดการทำงาน:
 * 1. Splash Screen (#splash): หน้าจอโหลดเข้าสู่ระบบครั้งแรก + LOADER.brandBoot()
 * 2. Overlay Mask (.ld-mask / LOADER.show): การ์ดโหลดโปร่งแสงทับหน้าจอ + Watchdog 60s
 * 3. Page Loader (LOADER.page / skeleton): โหลดเฉพาะพื้นที่เนื้อหา (.ld-page)
 * 4. Inline Loader (LOADER.into / loadInto): โหลดในการ์ดหรือกล่องย่อย (.ld-inline)
 * =============================================================================
 */
(function (global) {
  'use strict';

  var BRAND_KEY = 'stb_brand';
  var DEFAULT_BMA = "url('https://pr-bangkok.com/wp-content/uploads/2025/06/231116_BMA-Emblem_Edited_Green-600x600.png')";
  var DEFAULT_DEPT = "url('https://upload.wikimedia.org/wikipedia/commons/3/35/Patch_of_Bangkok_City_Law_Enforcement_Department.png')";
  var maskEl = null;
  var depth = 0;
  var hideTimer = null;
  var wdTimer = null;
  var WD_MS = 60000; /* กันค้างเกิน 60 วินาที */

  /* ---------- Helpers ---------- */
  function q(id) {
    return document.getElementById(id);
  }

  function safe(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /** แปลงลิงก์รูปทุกรูปแบบให้ใช้กับ CSS background ได้ */
  function imgUrl(u) {
    u = String(u || '').replace(/^\s+|\s+$/g, '');
    if (!u) return '';
    var m = u.match(/(?:\/d\/|[?&]id=|\/file\/d\/)([-\w]{25,})/);
    if (m) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w400';
    if (/^https?:\/\/drive\.google\.com\/thumbnail/i.test(u)) return u;
    if (/^[-\w]{25,}$/.test(u)) return 'https://drive.google.com/thumbnail?id=' + u + '&sz=w400';
    return u;
  }

  /* ---------- โลโก้ในตัว Loader ---------- */
  function setLogos(deptUrl, bmaUrl) {
    var root = document.documentElement;
    var d = imgUrl(deptUrl);
    if (d) root.style.setProperty('--logo-dept', "url('" + d + "')");
    var b = imgUrl(bmaUrl);
    root.style.setProperty('--logo-bma', b ? "url('" + b + "')" : DEFAULT_BMA);
  }

  /* ---------- Markup Generator ---------- */
  function unit(size) {
    return '<div class="loader" style="--ld-size:' + (size || 80) + 'px"></div>';
  }

  function ensureMask() {
    if (maskEl) return maskEl;
    maskEl = document.createElement('div');
    maskEl.className = 'ld-mask';
    maskEl.innerHTML = '<div class="ld-card">' + unit(74)
      + '<p class="ld-text" id="ldMaskTx">กำลังดำเนินการ...</p>'
      + '<div class="ld-bar"><span></span></div></div>';
    document.body.appendChild(maskEl);
    return maskEl;
  }

  /* ---------- Watchdog Timer ---------- */
  function clearWd() {
    if (wdTimer) {
      clearTimeout(wdTimer);
      wdTimer = null;
    }
  }

  function armWd() {
    clearWd();
    wdTimer = setTimeout(function () {
      if (maskEl && maskEl.classList.contains('on')) {
        forceHide();
        try {
          if (global.Swal) {
            global.Swal.fire({
              icon: 'warning',
              title: 'การทำงานใช้เวลานานผิดปกติ',
              html: '<div style="font-size:13.5px;line-height:1.8">ระบบปิดหน้าจอรอโดยอัตโนมัติ<br>'
                + 'หากข้อมูลยังไม่อัปเดต กรุณากดรีเฟรชหรือลองใหม่อีกครั้ง</div>',
              confirmButtonColor: '#007B3E'
            });
          }
        } catch (e) {}
      }
    }, WD_MS);
  }

  function forceHide() {
    depth = 0;
    clearWd();
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    if (maskEl) maskEl.classList.remove('on');
  }

  /** V7 : ไม่สะสม depth — เรียกซ้ำได้เท่าที่ต้องการ เป็นการเปลี่ยนข้อความแทน */
  function show(text) {
    var m = ensureMask();
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    var t = q('ldMaskTx');
    if (t) t.textContent = text || 'กำลังดำเนินการ...';
    m.classList.add('on');
    depth = 1;
    armWd();
  }

  /** ปิดเสมอ */
  function hide() {
    depth = 0;
    clearWd();
    if (!maskEl) return;
    hideTimer = setTimeout(function () {
      if (maskEl) maskEl.classList.remove('on');
    }, 60);
  }

  /** เปลี่ยนเฉพาะข้อความ โดยไม่แตะสถานะเปิด/ปิด */
  function text(msg) {
    var t = q('ldMaskTx');
    if (t && msg) t.textContent = msg;
  }

  /* ---------- API : พื้นที่เนื้อหา (แทน skeleton) ---------- */
  function page(textOrContainer, subOrIsPage, textIfThree) {
    var textVal = (typeof textOrContainer === 'string' && subOrIsPage !== true) ? textOrContainer : (textIfThree || 'กำลังโหลดข้อมูล...');
    var subVal = (typeof subOrIsPage === 'string') ? subOrIsPage : 'โปรดรอสักครู่';

    var html = '<div class="ld-page">' + unit(96)
      + '<p class="ld-text font-bold text-slate-700 dark:text-slate-200 mt-2">' + safe(textVal) + '</p>'
      + (subVal ? '<span class="ld-chip"><i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i>' + safe(subVal) + '</span>' : '')
      + '<div class="ld-bar mt-2"><span></span></div></div>';

    // ถ้าส่ง ID ของ container มา เช่น LOADER.page('content', 'ข้อความ') หรือ LOADER.page('content', true, 'ข้อความ')
    var targetEl = null;
    if (typeof textOrContainer === 'string' && (subOrIsPage === true || q(textOrContainer))) {
      targetEl = q(textOrContainer);
    } else if (textOrContainer && textOrContainer.nodeType) {
      targetEl = textOrContainer;
    } else {
      targetEl = q('content') || q('pageBody');
    }

    if (targetEl) {
      targetEl.innerHTML = html;
      try {
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
      } catch (e) {}
    }
    return html;
  }

  /** เรนเดอร์ loader ลงกล่องใดก็ได้ */
  function into(elOrId, textVal, size) {
    var n = (typeof elOrId === 'string') ? q(elOrId) : elOrId;
    if (!n) return '';
    var html = '<div class="ld-inline">' + unit(size || 56)
      + '<p class="ld-text text-xs font-semibold muted">' + safe(textVal || 'กำลังโหลด...') + '</p></div>';
    n.innerHTML = html;
    return html;
  }

  /** ห่อ Promise ให้แสดง/ซ่อน overlay อัตโนมัติ */
  function busy(p, textVal) {
    show(textVal);
    return Promise.resolve(p).finally(function () {
      hide();
    });
  }

  /* ---------- Branding Cache (แก้ splash ช้า) ---------- */
  function readBrand() {
    try {
      return JSON.parse(localStorage.getItem(BRAND_KEY) || 'null');
    } catch (e) {
      return null;
    }
  }

  function saveBrand(o) {
    if (!o) return;
    try {
      localStorage.setItem(BRAND_KEY, JSON.stringify({
        systemName: o.systemName || o.App_Display_Name || o.App_Name || '',
        systemDesc: o.systemDesc || o.App_Description || '',
        orgName: o.orgName || o.Organization_Name || '',
        orgSub: o.orgSub || o.Organization_Sub || '',
        logoUrl: o.logoUrl || o.Login_Logo_URL || o.Portal_Logo_URL || '',
        logoBma: o.logoBma || o.Dashboard_Logo_URL || ''
      }));
    } catch (e) {}
    setLogos(o.logoUrl || o.Login_Logo_URL, o.logoBma || o.Dashboard_Logo_URL);
  }

  /** วาด branding จากแคชทันที — ทำงานก่อน checkSystemInit จะตอบกลับ */
  function brandBoot() {
    var b = readBrand();
    if (!b) return false;
    var map = [
      ['spSys', b.systemName], ['loginSys', b.systemName], ['ftSys', b.systemName], ['sbTitle', b.systemName],
      ['spOrg', b.orgName], ['loginOrg', b.orgName], ['ftOrg', b.orgName], ['sbOrg', b.orgName],
      ['spSub', b.orgSub], ['loginSub', b.orgSub],
      ['spDesc', b.systemDesc], ['loginDesc', b.systemDesc]
    ];
    map.forEach(function (p) {
      var n = q(p[0]);
      if (n && p[1]) n.textContent = p[1];
    });
    if (b.systemName && b.orgName) document.title = b.systemName + ' · ' + b.orgName;
    if (b.logoUrl) {
      [['spLogo', 'spLogoFb'], ['loginLogo', 'loginLogoFallback'], ['sbLogo', 'sbLogoFb']].forEach(function (p) {
        var a = q(p[0]), c = q(p[1]);
        if (a) {
          a.src = imgUrl(b.logoUrl);
          a.classList.remove('hidden');
        }
        if (c) c.classList.add('hidden');
      });
    }
    setLogos(b.logoUrl, b.logoBma);
    return true;
  }

  /* ---------- Splash ---------- */
  function closeSplash() {
    var s = q('splash');
    if (!s) return;
    s.classList.add('sp-fade');
    s.style.opacity = '0';
    setTimeout(function () {
      if (s && s.parentNode) s.parentNode.removeChild(s);
    }, 460);
  }

  var LOADER = {
    show: show,
    hide: hide,
    text: text,
    forceHide: forceHide,
    page: page,
    showPage: function (container, textVal) {
      return page(container, true, textVal);
    },
    into: into,
    busy: busy,
    unit: unit,
    inline: function (textVal) {
      return '<div class="ld-inline">' + unit(56) + '<p class="ld-text text-xs font-semibold muted">' + safe(textVal || 'กำลังโหลด...') + '</p></div>';
    },
    setLogos: setLogos,
    imgUrl: imgUrl,
    saveBrand: saveBrand,
    setBrand: saveBrand,
    readBrand: readBrand,
    brandBoot: brandBoot,
    hideBoot: closeSplash,
    setLogo: function (u) {
      setLogos(null, u);
    },
    closeSplash: closeSplash
  };

  global.LOADER = LOADER;
  global.STB_LOADER = LOADER;

  // Global helper functions according to Loader.html
  global.showLoad = function (textVal) {
    LOADER.show(textVal);
  };
  global.hideLoad = function () {
    LOADER.hide();
  };
  global.loadText = function (msg) {
    LOADER.text(msg);
  };
  global.skeleton = function () {
    LOADER.page('กำลังโหลดข้อมูล...', 'โปรดรอสักครู่');
  };
  global.loadInto = function (id, textVal) {
    LOADER.into(id, textVal);
  };

  // Run initial brandBoot from cached localStorage immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', brandBoot);
  } else {
    brandBoot();
  }
})(window);
