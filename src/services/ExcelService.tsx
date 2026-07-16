import ExcelJS from "exceljs";
import LarkBaseService from "./LarkBaseService";

type LarkBaseData = Awaited<ReturnType<typeof LarkBaseService>>;

type RichTextCell = {
  type: string;
  text: string;
};

const ExcelService = async (data: LarkBaseData) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet 1");

  sheet.columns = data.fieldList.map((field) => ({
    header: field.name,
    key: field.id,
    width: 20,
  }));

  const rows = data.fields.records.map((record) => {
    const row: Record<string, string> = {};

    data.fieldList.forEach((field) => {
      const cell = record.fields[field.id] as RichTextCell[] | null;

      row[field.id] = cell?.[0]?.text ?? "";
    });

    return row;
  });

  sheet.addRows(rows);

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  return URL.createObjectURL(blob);
};

export default ExcelService;