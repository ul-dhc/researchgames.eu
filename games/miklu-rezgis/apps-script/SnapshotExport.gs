// Public aggregate snapshot. Full sheet rows and original identifiers stay in Apps Script.
function researchGamesDashboardSnapshot_() {
  try {
    const spreadsheet = SpreadsheetApp.openById(DASHBOARD_SPREADSHEET_ID);
    const model = RiddleSnapshot.build(
      readSheet_(spreadsheet, DASHBOARD_SESSIONS_SHEET),
      readSheet_(spreadsheet, DASHBOARD_EVALUATIONS_SHEET),
      spreadsheet.getSheetByName(PLAYER_QUESTIONS_SHEET)
        ? readSheet_(spreadsheet, PLAYER_QUESTIONS_SHEET) : []
    );
    return ContentService.createTextOutput(JSON.stringify(model)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error(error);
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:'Snapshot unavailable'})).setMimeType(ContentService.MimeType.JSON);
  }
}
