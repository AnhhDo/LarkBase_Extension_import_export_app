import { bitable } from "@lark-base-open/js-sdk";

const LarkBaseService = async () => {
  const table = await bitable.base.getActiveTable(); //active table
  const currentTableName = await table.getName(); //current table name
  const currentView = await table.getActiveView();
  const view = await table.getViewById(currentView.id);
  const fieldList = await view.getFieldMetaList(); //field header
  const tableList = await bitable.base.getTableMetaList(); //table list
  const fields = await table.getRecordsByPage({
    pageSize: 100,
  });

  const returnObj = {
    tableId: table.id,
    tableList: tableList,
    currentTableName: currentTableName,
    fields: fields,
    fieldList: fieldList,
    view: view,
    currentView: currentView,
  };
  return returnObj;
};
//test commit
export default LarkBaseService;
