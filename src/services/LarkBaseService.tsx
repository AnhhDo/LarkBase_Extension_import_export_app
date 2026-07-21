import { bitable } from "@lark-base-open/js-sdk";

export interface LarkRecord {
  recordId?: string;
  fields: Record<string, unknown>;
}

interface RecordsPageResult {
  records: LarkRecord[];
  hasMore?: boolean;
  pageToken?: number;
}

async function getAllRecords(
  table: Awaited<ReturnType<typeof bitable.base.getActiveTable>>,
  viewId: string
): Promise<LarkRecord[]> {
  const records: LarkRecord[] = [];
  let pageToken: number | undefined = undefined;

  do {
    const page = (await table.getRecordsByPage({
      pageSize: 100,
      viewId,
      ...(pageToken ? { pageToken } : {}),
    })) as unknown as RecordsPageResult;
    records.push(...(page.records ?? []));
    pageToken = page.hasMore ? page.pageToken : undefined;
  } while (pageToken);

  return records;
}

const LarkBaseService = async () => {
  const table = await bitable.base.getActiveTable(); //active table
  const currentTableName = await table.getName(); //current table name
  const currentView = await table.getActiveView();
  const view = await table.getViewById(currentView.id);
  const fieldList = await view.getFieldMetaList(); //field header
  const tableList = await bitable.base.getTableMetaList(); //table list
  const records = await getAllRecords(table, currentView.id); // every record, all pages

  const returnObj = {
    tableId: table.id,
    tableList: tableList,
    currentTableName: currentTableName,
    fields: { records }, // keeps the `data.fields.records` shape callers already use
    fieldList: fieldList,
    view: view,
    currentView: currentView,
    table: table, // live table handle so callers can write to it (e.g. ImportService) without re-fetching
  };
  return returnObj;
};
//test commit
export default LarkBaseService;