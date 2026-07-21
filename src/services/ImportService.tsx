import LarkBaseService, { type LarkRecord } from "./LarkBaseService";

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
  skippedCount: number; // rows that already exist in the table, left untouched
  errorCount: number;
  errorRows: ImportErrorRow[];
}

// Larkbase field values come back in different shapes depending on field
// type (rich text is an array of {type, text} segments, some fields are
// {text: ...} objects, others are plain strings/numbers). Normalize
// anything to a comparable string so we can compare an existing cell
// against the plain string we parsed out of the Excel file.
function cellToText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === "object" && "text" in (item as object)) {
          return String((item as { text: unknown }).text ?? "");
        }
        return String(item ?? "");
      })
      .join("");
  }
  if (typeof value === "object") {
    if ("text" in (value as Record<string, unknown>)) {
      return String((value as { text: unknown }).text ?? "");
    }
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Pushes parsed Excel rows into the currently active Larkbase table,
 * using `mapping` to decide which Larkbase field each Excel column feeds.
 *
 * Reuses LarkBaseService for both the live table handle to write to and
 * the full set of existing records to check for duplicates, rather than
 * re-implementing table/record fetching here.
 *
 * Before inserting, every incoming row is checked cell-by-cell (across the
 * mapped fields only) against every existing record already in the table.
 * If an existing record matches on all of those fields, the row is skipped
 * instead of inserted, so re-running an import (or importing overlapping
 * data) doesn't create duplicates.
 *
 * Only mappings with `include: true` and a chosen `excelColumn` are used.
 * Inserts happen in small chunks; if a chunk fails it's retried row-by-row
 * so we can report exactly which rows failed (without duplicating rows
 * that succeeded in an earlier chunk).
 */
const ImportService = async (
  rows: Record<string, string>[],
  mapping: ColumnMapping[]
): Promise<ImportResult> => {
  const activeMappings = mapping.filter((m) => m.include && m.excelColumn);

  const result: ImportResult = {
    total: rows.length,
    successCount: 0,
    skippedCount: 0,
    errorCount: 0,
    errorRows: [],
  };

  if (rows.length === 0 || activeMappings.length === 0) {
    return result;
  }

  // Fetch fresh each time (not the snapshot TabButton loaded on mount) so
  // duplicate-checking sees records added by any import earlier in the
  // session too.
  const { table, fields } = await LarkBaseService();
  const existingRecords = fields.records ?? [];

  const mappedFieldIds = activeMappings.map((m) => m.larkFieldId).sort();

  const buildSignature = (fieldValues: Record<string, string>): string =>
    mappedFieldIds.map((id) => (fieldValues[id] ?? "").trim()).join("\u0001");

  const buildFieldsFromRow = (row: Record<string, string>) => {
    const fieldValues: Record<string, string> = {};
    activeMappings.forEach((m) => {
      const excelColumn = m.excelColumn as string;
      fieldValues[m.larkFieldId] = row[excelColumn] ?? "";
    });
    return fieldValues;
  };

  const existingSignatures = new Set<string>();
  existingRecords.forEach((rec: LarkRecord) => {
    const fieldValues: Record<string, string> = {};
    mappedFieldIds.forEach((id) => {
      fieldValues[id] = cellToText(rec.fields[id]);
    });
    existingSignatures.add(buildSignature(fieldValues));
  });

  const toInsert: { fields: Record<string, string>; rowIndex: number }[] = [];
  rows.forEach((row, idx) => {
    const fieldValues = buildFieldsFromRow(row);
    const signature = buildSignature(fieldValues);
    if (existingSignatures.has(signature)) {
      result.skippedCount += 1;
      return;
    }
    toInsert.push({ fields: fieldValues, rowIndex: idx + 1 });
  });

  if (toInsert.length === 0) {
    return result;
  }

  // Insert in small chunks rather than one giant batch call. If a whole
  // file were sent as a single batch and that batch threw after partially
  // inserting, retrying by re-sending everything one-by-one would
  // duplicate rows that already went through. Chunking keeps the
  // "retry individually on failure" fallback scoped to a small slice.
  const CHUNK_SIZE = 100;

  for (let start = 0; start < toInsert.length; start += CHUNK_SIZE) {
    const chunk = toInsert.slice(start, start + CHUNK_SIZE);
    try {
      await table.addRecords(chunk.map((c) => ({ fields: c.fields })));
      result.successCount += chunk.length;
    } catch {
      for (const item of chunk) {
        try {
          await table.addRecords([{ fields: item.fields }]);
          result.successCount += 1;
        } catch (err) {
          result.errorCount += 1;
          result.errorRows.push({
            rowIndex: item.rowIndex,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }
  }

  return result;
};

export default ImportService;