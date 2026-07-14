import { useState, useEffect } from 'react';
import ExcelJS from 'exceljs'
import LarkBaseService from './LarkBaseService';

const ExcelService = () => {
    type LarkBaseData  =  Awaited<ReturnType<typeof LarkBaseService>>;
  const [data, setData] = useState<LarkBaseData | null>(null);

  useEffect(()=> {
    async function getData() {
        const result = await LarkBaseService();
        setData(result)
    }

    getData()
  },[])

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sheet 1')
    sheet.columns= (data?.fieldList?? []).map(field => ({
        header: field.name,
        id: field.id
    }))

    const returnObj = {
        sheet: sheet,
        sheetData: workbook.getWorksheet('Sheet1')
    }
    return returnObj
}

export default ExcelService;