/**
 * =============================================================================
 * STB Shared Module: Google Drive Upload & Image Compression Utility
 * File: shared/stb-drive-upload.js
 * =============================================================================
 * หน้าที่หลัก:
 * 1. บีบอัดรูปภาพฝั่ง Client (Canvas Resize & Compress) ก่อนส่งขึ้น Google Drive
 * 2. แปลงลิงก์ Google Drive ทุกชนิดให้เป็น Direct Image / Thumbnail URL สำหรับแสดงผลบนเว็บ
 * 3. ส่งไฟล์รูปโปรไฟล์, รูปลายเซ็น, ไอคอนแอป, หรือเอกสาร PDF ไปเก็บใน Google Drive Folder
 *    ผ่าน GAS Microservice (doPost)
 * =============================================================================
 */
(function (global) {
  'use strict';

  /**
   * สกัด Google Drive ID จากลิงก์เต็มหรือคืนค่า ID เดิม
   */
  function extractDriveId(urlOrId) {
    if (!urlOrId) return '';
    var s = String(urlOrId).trim();
    if (!s) return '';

    var mFolder = s.match(/\/folders\/([a-zA-Z0-9_-]{15,})/);
    if (mFolder) return mFolder[1];

    var mFile = s.match(/\/d\/([a-zA-Z0-9_-]{15,})/);
    if (mFile) return mFile[1];

    var mId = s.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
    if (mId) return mId[1];

    if (/^[a-zA-Z0-9_-]{15,}$/.test(s)) return s;
    return '';
  }

  /**
   * แปลง URL รูปภาพจาก Google Drive หรือ URL ปกติ ให้แสดงผลใน <img> ได้確実に
   */
  function resolveDriveImageUrl(urlOrId, size) {
    if (!urlOrId) return '';
    var s = String(urlOrId).trim();
    if (!s) return '';
    if (s.indexOf('data:image/') === 0) return s;

    var id = extractDriveId(s);
    if (id && (s.indexOf('drive.google.com') !== -1 || s.indexOf('googleusercontent.com') !== -1 || /^[a-zA-Z0-9_-]{20,}$/.test(s))) {
      var sz = size || 'w600';
      return 'https://drive.google.com/thumbnail?id=' + id + '&sz=' + sz;
    }
    return s;
  }

  /**
   * ย่อและบีบอัดรูปภาพฝั่ง Client ด้วย HTML5 Canvas
   */
  function compressImageFile(file, options) {
    options = options || {};
    var maxWidth = options.maxWidth || 900;
    var maxHeight = options.maxHeight || 900;
    var quality = options.quality || 0.85;
    var outputType = options.outputType || (file.type === 'image/png' ? 'image/png' : 'image/jpeg');

    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error('ไม่พบไฟล์รูปภาพ'));
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้')); };
      reader.onload = function (ev) {
        var img = new Image();
        img.onerror = function () { reject(new Error('ไฟล์รูปภาพไม่ถูกต้อง')); };
        img.onload = function () {
          var w = img.width;
          var h = img.height;
          if (w > maxWidth || h > maxHeight) {
            var ratio = Math.min(maxWidth / w, maxHeight / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          var dataUrl = canvas.toDataURL(outputType, quality);
          resolve({
            dataUrl: dataUrl,
            base64Data: dataUrl.split('base64,')[1],
            mimeType: outputType,
            width: w,
            height: h,
            fileName: file.name
          });
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * อ่านไฟล์ทั่วไป (เช่น PDF หรือเอกสาร) เป็น Base64
   */
  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error('ไม่พบไฟล์'));
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('ไม่สามารถอ่านไฟล์ได้')); };
      reader.onload = function (ev) {
        var dataUrl = String(ev.target.result || '');
        resolve({
          dataUrl: dataUrl,
          base64Data: dataUrl.indexOf('base64,') !== -1 ? dataUrl.split('base64,')[1] : dataUrl,
          mimeType: file.type || 'application/octet-stream',
          fileName: file.name
        });
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * ส่งคำขอ POST ไปยัง GAS Microservice (ใช้ text/plain เพื่อเลี่ยง CORS Preflight ของ Google Apps Script)
   */
  async function callGasService(gasEndpointUrl, action, payload) {
    var endpoint = gasEndpointUrl || (global.STB_CONFIG && global.STB_CONFIG.GAS_WEBAPP_URL) || '';
    if (!endpoint) {
      throw new Error('ยังไม่ได้ตั้งค่า GAS_WEBAPP_URL สำหรับเชื่อมต่อ Google Drive / Email');
    }

    var response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: action,
        payload: payload || {}
      })
    });

    if (!response.ok) {
      throw new Error('GAS HTTP Error: ' + response.status);
    }

    var res = await response.json();
    if (!res || res.success === false) {
      throw new Error((res && res.message) ? res.message : 'การเชื่อมต่อ GAS Microservice ล้มเหลว');
    }
    return res;
  }

  /**
   * อัปโหลดไฟล์ (File Object หรือ DataURL/Base64) เข้า Google Drive Folder ที่กำหนด
   */
  async function uploadToDrive(opts) {
    opts = opts || {};
    var gasUrl = opts.gasUrl || (global.STB_CONFIG && global.STB_CONFIG.GAS_WEBAPP_URL) || '';
    var folderId = opts.folderId || opts.folderUrl || '';
    var oldFileUrl = opts.oldFileUrl || '';
    var fileName = opts.fileName || ('stb_file_' + Date.now());
    var mimeType = opts.mimeType || '';
    var base64Data = opts.base64Data || opts.dataUrl || '';

    if (opts.file) {
      var f = opts.file;
      if (f.type && f.type.indexOf('image/') === 0 && opts.compress !== false) {
        var compressed = await compressImageFile(f, {
          maxWidth: opts.maxWidth || 900,
          maxHeight: opts.maxHeight || 900,
          quality: opts.quality || 0.86,
          outputType: opts.preservePng && f.type === 'image/png' ? 'image/png' : undefined
        });
        base64Data = compressed.base64Data;
        mimeType = compressed.mimeType;
        fileName = opts.fileName || f.name;
      } else {
        var rawFile = await fileToBase64(f);
        base64Data = rawFile.base64Data;
        mimeType = rawFile.mimeType;
        fileName = opts.fileName || f.name;
      }
    }

    return await callGasService(gasUrl, 'upload_file', {
      base64Data: base64Data,
      fileName: fileName,
      mimeType: mimeType,
      folderId: folderId,
      oldFileUrl: oldFileUrl
    });
  }

  /**
   * ตรวจสอบการเข้าถึงโฟลเดอร์ Google Drive จากลิงก์หรือ Folder ID
   */
  async function checkDriveFolder(folderUrlOrId, gasUrl) {
    return await callGasService(gasUrl, 'check_folder', {
      folderId: folderUrlOrId
    });
  }

  /**
   * ส่งอีเมลยืนยันตัวตนหรือรีเซ็ตรหัสผ่านผ่าน GAS MailApp
   */
  async function sendPortalEmail(emailPayload, gasUrl) {
    return await callGasService(gasUrl, 'send_email', emailPayload);
  }

  global.STB_DRIVE = {
    extractDriveId: extractDriveId,
    resolveDriveImageUrl: resolveDriveImageUrl,
    compressImageFile: compressImageFile,
    fileToBase64: fileToBase64,
    uploadToDrive: uploadToDrive,
    checkDriveFolder: checkDriveFolder,
    sendPortalEmail: sendPortalEmail
  };
})(window);

