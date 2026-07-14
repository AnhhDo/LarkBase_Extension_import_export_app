import ExcelJS from "exceljs";
import LarkBaseService from "./LarkBaseService";

type LarkBaseData = Awaited<ReturnType<typeof LarkBaseService>>;

const ExcelService = (data: LarkBaseData) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet 1");
  sheet.columns = (data?.fieldList ?? []).map((field) => ({
    header: field.name,
    id: field.id,
    width: 20
  }));
  sheet.addRows([])

  // const returnObj = {
  //     sheet: sheet,
  //     sheetData: workbook.getWorksheet('Sheet1')
  // }
  return workbook;
};

export default ExcelService;
