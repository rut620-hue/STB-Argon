/**
 * =============================================================================
 * STB APP n2 — Google Apps Script Microservice (Google Drive Upload & Email Bridge)
 * Script ID: 1V-dsBkgFv9zJ-7v5mHP4I73MYVxlomXhG-CXfQooCtMjygJHBsG6pSRA
 * =============================================================================
 * หน้าที่หลัก:
 * 1. upload_file: รับไฟล์รูปโปรไฟล์, รูปลายเซ็น, รูปบุคลากร, ไอคอนแอป, หรือเอกสาร PDF (Base64)
 *    จากหน้าเว็บ (GitHub Pages / Cloudflare Pages) บันทึกลง Google Drive Folder ตามลิงก์/ID ที่ตั้งค่าไว้
 *    พร้อมลบไฟล์เก่าในโฟลเดอร์เดียวกัน (ถ้าส่ง oldFileUrl มา) เพื่อประหยัดพื้นที่
 * 2. check_drive_resource: ตรวจสอบลิงก์หรือ ID ของโฟลเดอร์/ไฟล์ใน Google Drive ว่าเข้าถึงได้จริงหรือไม่
 * 3. send_email: ส่งอีเมลยืนยันตัวตน (VERIFY_EMAIL) หรือรีเซ็ตรหัสผ่าน (RESET_PASSWORD) ฟรีผ่าน MailApp
 * =============================================================================
 */

function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var action = params.action || 'health';

  if (action === 'check_folder' && params.folder) {
    return jsonResponse_(checkDriveFolder_(params.folder));
  }

  return jsonResponse_({
    success: true,
    service: 'STB Google Drive & Email Microservice',
    status: 'ONLINE',
    timestamp: new Date().toISOString(),
    remainingMailQuota: getSafeMailQuota_()
  });
}

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var body = JSON.parse(raw);
    var action = String(body.action || '').trim();
    var payload = body.payload || body;

    switch (action) {
      case 'upload_file':
        return jsonResponse_(handleUploadFile_(payload));
      case 'check_folder':
        return jsonResponse_(checkDriveFolder_(payload.folderId || payload.folderUrl || ''));
      case 'send_email':
        return jsonResponse_(handleSendEmail_(payload));
      case 'health':
        return jsonResponse_({
          success: true,
          status: 'ONLINE',
          timestamp: new Date().toISOString(),
          remainingMailQuota: getSafeMailQuota_()
        });
      default:
        return jsonResponse_({
          success: false,
          message: 'ไม่รู้จักคำสั่ง (Unknown action): ' + action
        });
    }
  } catch (err) {
    return jsonResponse_({
      success: false,
      message: 'GAS Microservice Error: ' + (err && err.message ? err.message : String(err))
    });
  }
}

/**
 * สกัด Google Drive ID จาก URL เต็ม หรือคืนค่า ID เดิมหากเป็น ID อยู่แล้ว
 */
function extractDriveId_(input) {
  if (!input) return '';
  var s = String(input).trim();
  if (!s) return '';

  // กรณีลิงก์โฟลเดอร์: https://drive.google.com/drive/folders/1abc...
  var mFolder = s.match(/\/folders\/([a-zA-Z0-9_-]{15,})/);
  if (mFolder) return mFolder[1];

  // กรณีลิงก์ไฟล์: https://drive.google.com/file/d/1abc... หรือ lh3.googleusercontent.com/d/1abc...
  var mFile = s.match(/\/d\/([a-zA-Z0-9_-]{15,})/);
  if (mFile) return mFile[1];

  // กรณีพารามิเตอร์ ?id=1abc...
  var mId = s.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
  if (mId) return mId[1];

  // กรณีเป็นรหัส ID ล้วน
  if (/^[a-zA-Z0-9_-]{15,}$/.test(s)) return s;

  return '';
}

/**
 * ตรวจสอบว่าโฟลเดอร์ใน Google Drive มีอยู่จริงและเข้าถึงได้หรือไม่
 */
function checkDriveFolder_(folderInput) {
  var folderId = extractDriveId_(folderInput);
  if (!folderId) {
    return { success: false, message: 'รูปแบบลิงก์หรือรหัสโฟลเดอร์ Google Drive ไม่ถูกต้อง' };
  }
  try {
    var folder = DriveApp.getFolderById(folderId);
    return {
      success: true,
      folderId: folder.getId(),
      folderName: folder.getName(),
      folderUrl: folder.getUrl(),
      message: 'เชื่อมต่อโฟลเดอร์ "' + folder.getName() + '" สำเร็จ'
    };
  } catch (err) {
    return {
      success: false,
      folderId: folderId,
      message: 'ไม่สามารถเข้าถึงโฟลเดอร์นี้ได้ กรุณาตรวจสอบสิทธิ์หรือรหัสโฟลเดอร์ (' + err.message + ')'
    };
  }
}

/**
 * อัปโหลดไฟล์ (รูปภาพ / ลายเซ็น / PDF) เข้า Google Drive Folder
 */
function handleUploadFile_(payload) {
  var base64Data = String(payload.base64Data || payload.dataUrl || '').trim();
  var fileName = String(payload.fileName || payload.filename || ('stb_upload_' + new Date().getTime())).trim();
  var mimeType = String(payload.mimeType || '').trim();
  var folderInput = String(payload.folderId || payload.folderUrl || '').trim();
  var oldFileUrl = String(payload.oldFileUrl || '').trim();

  if (!base64Data) {
    return { success: false, message: 'ไม่พบข้อมูลไฟล์ (base64Data is empty)' };
  }

  // แยก Header Data URL เช่น "data:image/png;base64,iVBOR..."
  if (base64Data.indexOf('base64,') !== -1) {
    var parts = base64Data.split('base64,');
    if (!mimeType) {
      var mMime = parts[0].match(/data:([^;]+);/);
      if (mMime) mimeType = mMime[1];
    }
    base64Data = parts[1];
  }
  if (!mimeType) mimeType = 'image/png';

  var decoded = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decoded, mimeType, fileName);

  var folder = null;
  var folderId = extractDriveId_(folderInput);
  if (folderId) {
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (e) {
      return {
        success: false,
        message: 'ไม่พบโฟลเดอร์ Google Drive ปลายทาง (ID: ' + folderId + ') กรุณาตรวจสอบค่าในหน้าตั้งค่าระบบ'
      };
    }
  } else {
    folder = DriveApp.getRootFolder();
  }

  var file = folder.createFile(blob);
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (shareErr) {
    // กรณี Workspace บล็อก ANYONE_WITH_LINK ให้ข้ามโดยไม่ล้มเหลว
  }

  var fileId = file.getId();
  var isImage = mimeType.indexOf('image/') === 0;
  var directUrl = isImage
    ? ('https://lh3.googleusercontent.com/d/' + fileId)
    : ('https://drive.google.com/file/d/' + fileId + '/view?usp=sharing');

  // ลบไฟล์เก่าในโฟลเดอร์เดียวกันอัตโนมัติ (ถ้ามีส่ง oldFileUrl มา)
  var deletedOld = false;
  if (oldFileUrl) {
    var oldId = extractDriveId_(oldFileUrl);
    if (oldId && oldId !== fileId) {
      try {
        DriveApp.getFileById(oldId).setTrashed(true);
        deletedOld = true;
      } catch (delErr) {}
    }
  }

  return {
    success: true,
    message: 'อัปโหลดไฟล์สำเร็จ',
    fileId: fileId,
    fileName: file.getName(),
    mimeType: mimeType,
    url: directUrl,
    viewUrl: 'https://drive.google.com/file/d/' + fileId + '/view?usp=sharing',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400',
    deletedOldFile: deletedOld
  };
}

/**
 * ส่งอีเมลยืนยันตัวตน (VERIFY_EMAIL) หรือรีเซ็ตรหัสผ่าน (RESET_PASSWORD)
 */
function handleSendEmail_(payload) {
  var to = String(payload.to || payload.email || '').trim();
  var type = String(payload.type || 'CUSTOM').toUpperCase();
  var appName = String(payload.appName || 'ระบบ Central Portal & SSO (สตบ.สนท.)').trim();
  var actionUrl = String(payload.actionUrl || '').trim();
  var fullName = String(payload.fullName || 'ผู้ใช้งาน').trim();
  var subject = String(payload.subject || '').trim();
  var htmlBody = String(payload.htmlBody || '').trim();

  if (!to) {
    return { success: false, message: 'กรุณาระบุอีเมลผู้รับ (to)' };
  }

  if (type === 'VERIFY_EMAIL') {
    subject = subject || ('[' + appName + '] ยืนยันที่อยู่อีเมลสำหรับการลงทะเบียนเข้าใช้งานระบบ');
    htmlBody = buildEmailTemplate_({
      appName: appName,
      title: 'ยืนยันที่อยู่อีเมลของท่าน',
      greeting: 'เรียน คุณ' + fullName,
      message: 'ขอบคุณสำหรับการลงทะเบียนเข้าใช้งาน <b>' + appName + '</b> กรุณาคลิกปุ่มด้านล่างเพื่อยืนยันที่อยู่อีเมลของท่าน เมื่อยืนยันแล้วบัญชีของท่านจะถูกส่งให้ผู้ดูแลระบบอนุมัติต่อไป',
      buttonText: 'ยืนยันที่อยู่อีเมล',
      actionUrl: actionUrl,
      footerNote: 'ลิงก์นี้มีอายุการใช้งานตามที่ระบบกำหนด หากท่านไม่ได้เป็นผู้ทำรายการ กรุณาเพิกเฉยต่ออีเมลฉบับนี้'
    });
  } else if (type === 'RESET_PASSWORD') {
    subject = subject || ('[' + appName + '] คำขอตั้งรหัสผ่านใหม่ (Reset Password)');
    htmlBody = buildEmailTemplate_({
      appName: appName,
      title: 'ตั้งรหัสผ่านใหม่สำหรับบัญชีของท่าน',
      greeting: 'เรียน คุณ' + fullName,
      message: 'ระบบได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของท่านใน <b>' + appName + '</b> กรุณาคลิกปุ่มด้านล่างเพื่อกำหนดรหัสผ่านใหม่',
      buttonText: 'ตั้งรหัสผ่านใหม่',
      actionUrl: actionUrl,
      footerNote: 'ลิงก์นี้มีอายุ 15 นาทีเพื่อความปลอดภัย หากท่านไม่ได้เป็นผู้ทำรายการ กรุณาเพิกเฉยต่ออีเมลฉบับนี้'
    });
  }

  MailApp.sendEmail({
    to: to,
    subject: subject || ('แจ้งเตือนจาก ' + appName),
    htmlBody: htmlBody || '<p>แจ้งเตือนจากระบบ</p>',
    name: appName
  });

  return {
    success: true,
    message: 'ส่งอีเมลไปยัง ' + to + ' เรียบร้อยแล้ว',
    remainingQuota: getSafeMailQuota_()
  };
}

function buildEmailTemplate_(opts) {
  return [
    '<div style="font-family:\'Sarabun\',Tahoma,sans-serif;max-width:580px;margin:0 auto;border:1px solid #e6efe9;border-radius:16px;overflow:hidden;background:#ffffff;">',
      '<div style="background:linear-gradient(135deg,#00351B,#007B3E);color:#ffffff;padding:24px 28px;text-align:center;">',
        '<h2 style="margin:0;font-size:20px;font-weight:700;">' + opts.appName + '</h2>',
        '<div style="margin-top:6px;font-size:14px;opacity:0.9;">' + opts.title + '</div>',
      '</div>',
      '<div style="padding:28px;color:#1e293b;line-height:1.65;font-size:15px;">',
        '<p style="margin-top:0;font-weight:600;">' + opts.greeting + '</p>',
        '<p>' + opts.message + '</p>',
        (opts.actionUrl ? (
          '<div style="text-align:center;margin:28px 0;">' +
            '<a href="' + opts.actionUrl + '" style="display:inline-block;background:linear-gradient(135deg,#007B3E,#4EBA6F);color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:15px;">' + opts.buttonText + '</a>' +
          '</div>' +
          '<p style="font-size:12px;color:#64748b;word-break:break-all;">หากปุ่มไม่ทำงาน สามารถคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:<br>' + opts.actionUrl + '</p>'
        ) : ''),
        '<hr style="border:none;border-top:1px solid #e6efe9;margin:24px 0;">',
        '<p style="font-size:12px;color:#64748b;margin-bottom:0;">' + opts.footerNote + '</p>',
      '</div>',
    '</div>'
  ].join('');
}

function getSafeMailQuota_() {
  try {
    return MailApp.getRemainingDailyQuota();
  } catch (e) {
    return -1;
  }
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
