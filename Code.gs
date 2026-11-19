/**
 * Ms.Cookiza Spin & Win — win logger (Google Apps Script)
 * Every win from the website is appended as a row to the "Wins" sheet.
 *
 * Setup: see "Win log" in the README. Paste this into Extensions > Apps Script
 * of the Google Sheet that should hold the log, then deploy as a Web app.
 */
const SHEET_NAME   = "Wins";
const TZ           = "Africa/Cairo";
const NOTIFY_EMAIL = "";   // optional: your email to get a message on every win (leave "" for none)
const HEADERS      = ["Time (Cairo)", "Code", "Prize", "Prize ID", "Status", "Notes"];

function doGet() {            // open the web app URL in a browser to check it is alive
  return json_({ ok: true, service: "Ms.Cookiza win log" });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const d = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const code    = String(d.code || "").trim();
    const prize   = String(d.prize || "").trim().slice(0, 100);
    const prizeId = String(d.prizeId || "").trim().slice(0, 30);

    // reject anything that doesn't look like a code made by the website
    if (!/^CKZ-[A-Z0-9]+-[A-Z2-9]{5}$/.test(code) || !prize) return json_({ ok: false });

    const sh = getSheet_();
    const last = sh.getLastRow();
    if (last > 1) {           // ignore a code that is already logged
      const codes = sh.getRange(2, 2, last - 1, 1).getValues().map(r => r[0]);
      if (codes.indexOf(code) !== -1) return json_({ ok: true, duplicate: true });
    }

    sh.appendRow([new Date(), code, prize, prizeId, "Unredeemed", ""]);

    if (NOTIFY_EMAIL) {
      const when = Utilities.formatDate(new Date(), TZ, "dd/MM/yyyy HH:mm:ss");
      MailApp.sendEmail(NOTIFY_EMAIL, "Ms.Cookiza win: " + prize,
        "Prize: " + prize + "\nCode: " + code + "\nTime (Cairo): " + when);
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false });
  } finally {
    lock.releaseLock();
  }
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(TZ);
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#DB161B").setFontColor("#FFFFFF");
    sh.getRange("A:A").setNumberFormat("dd/mm/yyyy hh:mm:ss");
    sh.setColumnWidths(1, 1, 150); sh.setColumnWidths(2, 1, 190); sh.setColumnWidths(3, 1, 220);
    sh.getRange("E2:E").setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(["Unredeemed", "Redeemed"], true).build());
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
