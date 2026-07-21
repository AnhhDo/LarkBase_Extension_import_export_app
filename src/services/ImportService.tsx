import { FieldType } from "@lark-base-open/js-sdk";
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
  successCount: number; // brand-new records inserted
  updatedCount: number; // existing records patched with new-column data
  skippedCount: number; // rows that already exist and had nothing new to add
  errorCount: number;
  errorRows: ImportErrorRow[];
  createdColumns: string[]; // Excel headers that became new Larkbase fields
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
 * using `mapping` to decide which Larkbase field each Excel column feeds,
 * and `newColumnSelections` to decide which unmatched Excel headers should
 * become brand-new Larkbase fields.
 *
 * Reuses LarkBaseService for both the live table handle to write to and
 * the full set of existing records to check for duplicates, rather than
 * re-implementing table/record fetching here.
 *
 * Duplicate/identity checking only ever looks at the *mapped* fields
 * (`mapping`, i.e. the columns that already exist in Larkbase) — those are
 * what decide whether an incoming row "is" an existing record. New columns
 * never participate in that check, since by definition they hold data no
 * existing record has yet.
 *
 * - If a row's identity fields don't match any existing record, it's
 *   inserted as a new record (with both mapped and new-column values).
 * - If a row's identity fields DO match an existing record, that row is
 *   never re-inserted (its mapped fields already match, exactly). But if
 *   the row carries data for a selected new column, the existing record is
 *   patched with just that data instead of being skipped outright — this
 *   is how "the row exists but a column/cell is missing" gets backfilled.
 * - If a row matches and has no new-column data to add, it's skipped as
 *   a true duplicate.
 *
 * Inserts/updates happen in small chunks; if a chunk fails it's retried
 * row-by-row so we can report exactly which rows failed (without
 * duplicating/re-patching rows that already succeeded in an earlier chunk).
 */
const ImportService = async (
  rows: Record<string, string>[],
  mapping: ColumnMapping[],
  newColumnSelections: Record<string, boolean> = {}
): Promise<ImportResult> => {
  const activeMappings = mapping.filter((m) => m.include && m.excelColumn);
  const newColumnHeaders = Object.keys(newColumnSelections).filter(
    (h) => newColumnSelections[h]
  );

  const result: ImportResult = {
    total: rows.length,
    successCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    errorRows: [],
    createdColumns: [],
  };

  if (
    rows.length === 0 ||
    (activeMappings.length === 0 && newColumnHeaders.length === 0)
  ) {
    return result;
  }

  // Fetch fresh each time (not the snapshot TabButton loaded on mount) so
  // duplicate-checking sees records added by any import earlier in the
  // session too.
  const { table, fields } = await LarkBaseService();
  const existingRecords = fields.records ?? [];

  // Create a Larkbase field for each newly-selected Excel column. If a
  // field with that name already exists (e.g. created by a previous import
  // run this session, or the user unticked an auto-matched row so it shows
  // up as "new" here) reuse it instead of failing. A column we truly can't
  // create or find is logged and simply left out of the import, rather than
  // aborting the whole run.
  const newColumnFieldIds: { excelColumn: string; larkFieldId: string }[] = [];
  for (const header of newColumnHeaders) {
    try {
      const fieldId = await table.addField({
        type: FieldType.Text,
        name: header,
      });
      newColumnFieldIds.push({ excelColumn: header, larkFieldId: fieldId });
    } catch {
      try {
        const existingField = await table.getFieldByName(header);
        newColumnFieldIds.push({
          excelColumn: header,
          larkFieldId: existingField.id,
        });
      } catch (err) {
        console.error(`Không thể tạo cột "${header}" trong Larkbase:`, err);
      }
    }
  }

  result.createdColumns = newColumnFieldIds.map((f) => f.excelColumn);

  const identityMappings = activeMappings.map((m) => ({
    excelColumn: m.excelColumn as string,
    larkFieldId: m.larkFieldId,
  }));
  const writeMappings = [...identityMappings, ...newColumnFieldIds];

  if (writeMappings.length === 0) {
    return result;
  }

  const mappedFieldIds = identityMappings.map((m) => m.larkFieldId).sort();

  const buildSignature = (fieldValues: Record<string, string>): string =>
    mappedFieldIds.map((id) => (fieldValues[id] ?? "").trim()).join("\u0001");

  const buildFieldsFromRow = (
    row: Record<string, string>,
    entries: { excelColumn: string; larkFieldId: string }[]
  ) => {
    const fieldValues: Record<string, string> = {};
    entries.forEach((m) => {
      fieldValues[m.larkFieldId] = row[m.excelColumn] ?? "";
    });
    return fieldValues;
  };

  // Map each existing record's identity signature to the record itself
  // (rather than just a Set of signatures) so a matching incoming row can
  // be used to patch that record, not just be flagged as a duplicate.
  const existingBySignature = new Map<string, LarkRecord>();
  if (mappedFieldIds.length > 0) {
    existingRecords.forEach((rec: LarkRecord) => {
      const fieldValues: Record<string, string> = {};
      mappedFieldIds.forEach((id) => {
        fieldValues[id] = cellToText(rec.fields[id]);
      });
      const signature = buildSignature(fieldValues);
      if (!existingBySignature.has(signature)) {
        existingBySignature.set(signature, rec);
      }
    });
  }

  const toInsert: { fields: Record<string, string>; rowIndex: number }[] = [];
  const toUpdate: {
    recordId: string;
    fields: Record<string, string>;
    rowIndex: number;
  }[] = [];

  rows.forEach((row, idx) => {
    const signature =
      mappedFieldIds.length > 0
        ? buildSignature(buildFieldsFromRow(row, identityMappings))
        : null;
    const existing =
      signature !== null ? existingBySignature.get(signature) : undefined;

    if (existing && existing.recordId) {
      // The row's identity fields already match this record exactly, so
      // there's nothing to update there. Only newly-added columns can be
      // missing data on it.
      if (newColumnFieldIds.length > 0) {
        const newValues = buildFieldsFromRow(row, newColumnFieldIds);
        const hasData = Object.values(newValues).some((v) => v.trim() !== "");
        if (hasData) {
          toUpdate.push({
            recordId: existing.recordId,
            fields: newValues,
            rowIndex: idx + 1,
          });
          return;
        }
      }
      result.skippedCount += 1;
      return;
    }

    toInsert.push({
      fields: buildFieldsFromRow(row, writeMappings),
      rowIndex: idx + 1,
    });
  });

  // Insert/update in small chunks rather than one giant batch call. If a
  // whole file were sent as a single batch and that batch threw after
  // partially going through, retrying by re-sending everything one-by-one
  // would duplicate/re-patch rows that already succeeded. Chunking keeps
  // the "retry individually on failure" fallback scoped to a small slice.
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

  for (let start = 0; start < toUpdate.length; start += CHUNK_SIZE) {
    const chunk = toUpdate.slice(start, start + CHUNK_SIZE);
    try {
      await table.setRecords(
        chunk.map((c) => ({ recordId: c.recordId, fields: c.fields }))
      );
      result.updatedCount += chunk.length;
    } catch {
      for (const item of chunk) {
        try {
          await table.setRecord(item.recordId, { fields: item.fields });
          result.updatedCount += 1;
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