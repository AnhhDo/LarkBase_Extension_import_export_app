import { bitable } from "@lark-base-open/js-sdk";

const LarkBase = async () => {
  const table = await bitable.base.getActiveTable(); //active table
  const currentTableName = await table.getName(); //table name
  const fieldList = await table.getFieldMetaList();  //field header

  const tableList= await bitable.base.getTableMetaList(); //table list

  const fields = await table.getRecordsByPage({
    pageSize: 100,
  }); //all data record
  //   const attachmentFields = await table.getFieldListByType<IAttachmentField>(
  //     FieldType.Attachment,
  //   );
  const returnObj = {
    tableId: table.id,
    tableList: tableList,
    currentTableName: currentTableName,
    fields: fields,
    fieldList : fieldList,
  };
  return returnObj;
};

export default LarkBase;