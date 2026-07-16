import { bitable } from "@lark-base-open/js-sdk";

const LarkBaseService = async () => {
  const table = await bitable.base.getActiveTable(); //active table
  const currentTableName = await table.getName(); //current table name
  const fieldList = await table.getFieldMetaList();  //field header
  const tableList= await bitable.base.getTableMetaList(); //table list

  const fields = await table.getRecordsByPage({
    pageSize: 100,
  }); //all data record

  const returnObj = {
    tableId: table.id,
    tableList: tableList,
    currentTableName: currentTableName,
    fields: fields,
    fieldList : fieldList,
  };
  return returnObj;
};
//test commit
export default LarkBaseService;