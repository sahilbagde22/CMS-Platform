/**
 * Converts an Excel serial date number to an ISO 8601 date string (YYYY-MM-DD).
 *
 * Excel stores dates as days since 1900-01-01 (with a Lotus 1-2-3 leap year bug
 * that treats 1900 as a leap year — we account for this).
 *
 * This is a fallback for columns where cellDates:true didn't catch the serial.
 */
export function excelSerialToISO(serial: number): string {
  // Excel incorrectly treats 1900 as a leap year (day 60 = Feb 29, 1900 — doesn't exist)
  // Adjust for this bug: subtract 1 for dates after Feb 28, 1900
  const adjusted = serial > 60 ? serial - 1 : serial;
  const msPerDay = 24 * 60 * 60 * 1000;
  // Excel epoch: December 31, 1899
  const excelEpoch = new Date(Date.UTC(1899, 11, 31));
  const date = new Date(excelEpoch.getTime() + adjusted * msPerDay);
  return date.toISOString().split('T')[0];
}

/**
 * Heuristic: is this number likely an Excel serial date?
 * Serial range 1 (1900-01-01) to ~50000 (2036-11-21) is reasonable.
 * Avoid flagging legitimate small integers or large IDs.
 */
export function isLikelyExcelSerial(value: unknown): value is number {
  if (typeof value !== 'number') return false;
  return Number.isInteger(value) && value >= 25569 && value <= 60000;
  // 25569 = 1970-01-01 in Excel serial (reasonable lower bound for modern data)
}
