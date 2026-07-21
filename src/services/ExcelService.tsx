import ExcelJS from "exceljs";
import LarkBaseService from "./LarkBaseService";

type LarkBaseData = Awaited<ReturnType<typeof LarkBaseService>>;
// Define lightweight helper types for cell structures
type TextSegment = { text?: string };
type SelectOption = { id?: string; text?: string };
type LinkValue = { text?: string; recordIds?: string[] };

const parseCellValue = (cellValue: unknown, fieldType: number): string => {
  if (cellValue === null || cellValue === undefined) return "";

  switch (fieldType) {
    case 1: // Text / Rich Text
    case 15: // Multi-line Text
      if (Array.isArray(cellValue)) {
        return (cellValue as TextSegment[])
          .map((segment) => segment.text ?? "")
          .join("");
      }
      return (cellValue as TextSegment)?.text ?? "";

    case 3: // Single Select
      return (cellValue as SelectOption)?.text ?? "";

    case 4: // Multi Select
      if (Array.isArray(cellValue)) {
        return (cellValue as SelectOption[])
          .map((option) => option.text ?? "")
          .join(", ");
      }
      return "";

    case 18: // One-way Link
    case 21: { // Two-way Link — Note the opening brace here
      if (Array.isArray(cellValue)) {
        return (cellValue as LinkValue[])
          .map((link) => link.text ?? "")
          .join(", ");
      }

      const linkObj = cellValue as LinkValue;
      if (linkObj.text) {
        return linkObj.text;
      }
      if (Array.isArray(linkObj.recordIds)) {
        return linkObj.recordIds.join(", ");
      }
      return "";
    } // Closing brace here

    default: // Numbers, Dates, Checkboxes, Strings
      if (
        typeof cellValue === "string" ||
        typeof cellValue === "number" ||
        typeof cellValue === "boolean"
      ) {
        return String(cellValue);
      }
      try {
        return JSON.stringify(cellValue);
      } catch {
        return "";
      }
  }
};

const ExcelService = async (data: LarkBaseData) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet 1");

  // 1. Set up columns
  sheet.columns = data.fieldList.map((field) => ({
    header: field.name,
    key: field.id,
    width: 20,
  }));

  // 2. Parse and add rows
  const rows = data.fields.records.map((record) => {
    const row: Record<string, string> = {};

    data.fieldList.forEach((field) => {
      const rawCellValue = record.fields[field.id];
      // Pass the raw value and the field type to our parser
      row[field.id] = parseCellValue(rawCellValue, field.type);
    });

    return row;
  });

  sheet.addRows(rows);

  // 3. Generate and return the file URL
  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  return URL.createObjectURL(blob);
};

export default ExcelService;