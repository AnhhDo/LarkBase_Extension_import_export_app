import { bitable } from "@lark-base-open/js-sdk";

const LarkBase = async () => {
  const table = await bitable.base.getActiveTable(); //active table
  const tableList= await bitable.base.getTableList(); //table list
  const fieldList = await table.getFieldMetaList();  //field header
  const tableName = await table.getName(); //table name
  const fields = await table.getRecordsByPage({
    pageSize: 100,
  }); //all data record
  //   const attachmentFields = await table.getFieldListByType<IAttachmentField>(
  //     FieldType.Attachment,
  //   );
  const returnObj = {
    tableId: table.id,
    tableList: tableList,
    tableName: tableName,
    fields: fields,
    fieldList : fieldList,
  };
  return returnObj;
};

export default LarkBase;
