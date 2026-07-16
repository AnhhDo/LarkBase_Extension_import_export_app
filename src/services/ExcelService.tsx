import ExcelJS from "exceljs";
import LarkBaseService from "./LarkBaseService";

type LarkBaseData = Awaited<ReturnType<typeof LarkBaseService>>;

type LarkFieldValue = {
  type: string;
  text: string;
};

type LarkRecord = {
  fields: Record<string, LarkFieldValue[] | null | undefined>;
  recordId: string;
};

const ExcelService = async (data: LarkBaseData) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet 1");

  sheet.columns = (data?.fieldList ?? []).map((field) => ({
    header: field.name,
    id: field.id,
    width: 20,
  }));

  const records = (data?.fields?.records ?? []) as LarkRecord[];

  const rows = records.map((record: LarkRecord) => {
    const rowObj: Record<string, string> = {};

    data.fieldList.forEach((field) => {
      const value = record.fields?.[field.id];

      if (Array.isArray(value)) {
        rowObj[field.id] = value
          .map((item: LarkFieldValue) => item.text ?? "")
          .join("");
      } else {
        rowObj[field.id] = "";
      }
    });

    return rowObj;
  });

  sheet.addRows(rows);

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.currentTableName}.xlsx`;
  URL.revokeObjectURL(url);
};

export default ExcelService;
