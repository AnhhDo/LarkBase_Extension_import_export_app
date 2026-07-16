import ExcelJS from "exceljs";
import LarkBaseService from "./LarkBaseService";

type LarkBaseData = Awaited<ReturnType<typeof LarkBaseService>>;

const ExcelService = async (data: LarkBaseData) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet 1");
  sheet.columns = (data?.fieldList ?? []).map((field) => ({
    header: field.name,
    id: field.id,
    width: 20,
  }));


  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  // const returnObj = {
  //     sheet: sheet,
  //     sheetData: workbook.getWorksheet('Sheet1')
  // }
  return url;
};

export default ExcelService;
