import { bitable } from "@lark-base-open/js-sdk";

/**
 * One row in the mapping UI: a single Larkbase field, optionally paired
 * with the Excel column that supplies its value.
 */
export interface ColumnMapping {
  larkFieldId: string;
  larkFieldName: string;
  excelColumn: string | null;
  include: boolean;
}

export interface ImportErrorRow {
  rowIndex: number; // 1-based row number from the source Excel file
  error: string;
}

export interface ImportResult {
  total: number;
  successCount: number;
  errorCount: number;
  errorRows: ImportErrorRow[];
}

/**
 * Pushes parsed Excel rows into the currently active Larkbase table,
 * using `mapping` to decide which Larkbase field each Excel column feeds.
 *
 * Only mappings with `include: true` and a chosen `excelColumn` are used.
 * Tries a single batch insert first (fast path); if that fails, falls back
 * to inserting row-by-row so we can report exactly which rows failed.
 */
const ImportService = async (
  rows: Record<string, string>[],
  mapping: ColumnMapping[]
): Promise<ImportResult> => {
  const table = await bitable.base.getActiveTable();
  const activeMappings = mapping.filter((m) => m.include && m.excelColumn);

  const buildFields = (row: Record<string, string>) => {
    const fields: Record<string, string> = {};
    activeMappings.forEach((m) => {
      const excelColumn = m.excelColumn as string;
      fields[m.larkFieldId] = row[excelColumn] ?? "";
    });
    return fields;
  };

  const records = rows.map((row) => ({ fields: buildFields(row) }));

  const result: ImportResult = {
    total: records.length,
    successCount: 0,
    errorCount: 0,
    errorRows: [],
  };

  if (records.length === 0 || activeMappings.length === 0) {
    return result;
  }

  try {
    // Fast path: one batch call for the whole file.
    await table.addRecords(records);
    result.successCount = records.length;
    return result;
  } catch {
    // Fall back to one-by-one so we can pinpoint which rows failed.
    for (let i = 0; i < records.length; i++) {
      try {
        await table.addRecords([records[i]]);
        result.successCount += 1;
      } catch (err) {
        result.errorCount += 1;
        result.errorRows.push({
          rowIndex: i + 1,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return result;
  }
};

export default ImportService;
