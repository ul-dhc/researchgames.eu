// Replacement for getGamesSheet_ in the existing bound receiver project.
// Validate the game-owned columns only; preserve any extra spreadsheet columns.
function getGamesSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  } else {
    const existingWidth = sheet.getLastColumn();
    const currentHeaders = sheet.getRange(1, 1, 1, Math.min(existingWidth, HEADERS.length)).getDisplayValues()[0];
    const invalidHeader = currentHeaders.some((header, index) => header !== HEADERS[index]);
    if (invalidHeader) throw new Error('The header row in the "Games" sheet does not match HEADERS.');
    if (existingWidth < HEADERS.length) {
      sheet.getRange(1, existingWidth + 1, 1, HEADERS.length - existingWidth).setValues([HEADERS.slice(existingWidth)]);
    }
  }
  return sheet;
}
