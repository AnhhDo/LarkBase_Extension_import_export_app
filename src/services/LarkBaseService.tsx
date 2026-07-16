import { bitable } from "@lark-base-open/js-sdk";

const LarkBaseService = async () => {
  const table = await bitable.base.getActiveTable(); //active table
  const currentTableName = await table.getName(); //current table name
  const currentView = await table.getActiveView();
  const view = await table.getViewById(currentView.id);
  const fieldList = await view.getFieldMetaList(); //field header
  const tableList = await bitable.base.getTableMetaList(); //table list
  const fields = [];
  let hasMore = true;
  let nextToken: number | undefined = undefined;

  while (hasMore) {
    const response = await table.getRecordsByPage({
      pageSize: 500,
      pageToken: nextToken,
    });

    fields.push(...response.records);
    hasMore = response.hasMore;
    nextToken = response.pageToken;
  }

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
