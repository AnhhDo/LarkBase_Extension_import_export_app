import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import SelectTable from "./SelectTable";
import GroupCheckbox from "./GroupCheckbox";
import RadioGroupFilter from "./RadioGroupFilter";
import { FileDropzone, type ParsedExcelData } from "./FileDropZone";
import { ColumnMapper } from "./ColumnMapper";
import { ImportResultDialog } from "./ImportResultDialog";
import LarkBaseService from "@/services/LarkBaseService";
import ExcelService from "@/services/ExcelService";
import ImportService, { type ColumnMapping, type ImportResult } from "@/services/ImportService";

const TabButton = () => {
  type LarkBaseData = Awaited<ReturnType<typeof LarkBaseService>>;
  const [data, setData] = useState<LarkBaseData | null>(null);

  // Import tab state
  const [excelData, setExcelData] = useState<ParsedExcelData | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping[]>([]);
  // Tracks which unmatched Excel columns the user wants created as new
  // Larkbase fields and imported. Keyed by Excel header.
  const [newColumnSelections, setNewColumnSelections] = useState<
    Record<string, boolean>
  >({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  // setImporting is async, so a fast double-click could slip through before
  // the button visually disables. This ref blocks a second call immediately.
  const importingRef = useRef(false);
  // FileDropzone keeps its own "files shown" state internally. Bumping this
  // key remounts it after a successful import so the old file visibly
  // disappears too, instead of just the mapping/Import button vanishing.
  const [dropzoneKey, setDropzoneKey] = useState(0);

  useEffect(() => {
    async function load() {
      const BaseData = await LarkBaseService();
      setData(BaseData);
    }

    load();
  }, []);

  // The mapping's starting point (auto-matched columns) is *derived* from
  // data + excelData, not an external system, so we don't compute it in a
  // useEffect (which would set state after an extra render and can cascade).
  // Instead we follow React's recommended pattern for state derived from
  // props/other state: compute it during render and call setState only when
  // the inputs actually changed, guarded by a ref of the last inputs seen.
  // See https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const mappingKey =
    data && excelData ? `${data.tableId}::${excelData.headers.join("|")}` : null;
  const [lastMappingKey, setLastMappingKey] = useState<string | null>(null);

  if (mappingKey !== lastMappingKey) {
    setLastMappingKey(mappingKey);

    if (!data || !excelData) {
      setMapping([]);
    } else {
      const initialMapping: ColumnMapping[] = data.fieldList.map((field) => {
        const match = excelData.headers.find(
          (h) => h.trim().toLowerCase() === field.name.trim().toLowerCase()
        );
        return {
          larkFieldId: field.id,
          larkFieldName: field.name,
          excelColumn: match ?? null,
          include: Boolean(match),
        };
      });
      setMapping(initialMapping);
    }
    // A fresh file (or table) means any previous "create as new column"
    // choices no longer apply to the current header set.
    setNewColumnSelections({});
  }

  const handleNewColumnToggle = (header: string, checked: boolean) => {
    setNewColumnSelections((prev) => ({ ...prev, [header]: checked }));
  };

  const handleExport = async () => {
    if (!data) return;
    const downloadURL = await ExcelService(data);
    const a = document.createElement("a");
    a.href = downloadURL;
    a.download = `${data.currentTableName}.xlsx`;
    a.click();
    URL.revokeObjectURL(downloadURL);
  };

  const handleImport = async () => {
    if (!excelData || excelData.rows.length === 0) return;
    if (importingRef.current) return; // already running, ignore extra clicks
    importingRef.current = true;
    setImporting(true);
    try {
      const res = await ImportService(excelData.rows, mapping);
      setResult(res);
      setResultOpen(true);
      // Clear the parsed file + mapping once it's gone through. Leaving
      // them in place invited an accidental second click on "Import" to
      // push the exact same rows again.
      setExcelData(null);
      setMapping([]);
      setNewColumnSelections({});
      setDropzoneKey((k) => k + 1);
    } catch (err) {
      setResult({
        total: excelData.rows.length,
        successCount: 0,
        skippedCount: 0,
        errorCount: excelData.rows.length,
        errorRows: [
          {
            rowIndex: 0,
            error: err instanceof Error ? err.message : String(err),
          },
        ],
      });
      setResultOpen(true);
    } finally {
      setImporting(false);
      importingRef.current = false;
    }
  };

  const hasSelectedMapping = mapping.some((m) => m.include && m.excelColumn);

  return (
    <Tabs defaultValue="import">
      <TabsList>
        <TabsTrigger value="import">Import</TabsTrigger>
        <TabsTrigger value="export">Export</TabsTrigger>
      </TabsList>
      <TabsContent value="import">
        <p>1. Export file to make changes</p>
        <Button variant="outline" onClick={handleExport}>
          Export
        </Button>

        <p className="mt-4">2. Import file to apply changes</p>
        <FileDropzone key={dropzoneKey} onParsed={setExcelData} />

        <ColumnMapper
          mapping={mapping}
          excelHeaders={excelData?.headers ?? []}
          onChange={setMapping}
          newColumnSelections={newColumnSelections}
          onNewColumnToggle={handleNewColumnToggle}
        />

        {excelData && (
          <Button
            className="mt-4"
            size="lg"
            variant="outline"
            disabled={!hasSelectedMapping || importing}
            onClick={handleImport}
          >
            {importing ? "Đang import..." : "Import"}
          </Button>
        )}

        <ImportResultDialog
          open={resultOpen}
          result={result}
          onOpenChange={setResultOpen}
        />
      </TabsContent>
      <TabsContent value="export">
        <p>Chọn table bạn muốn export</p>

        <SelectTable tableList={data?.tableList ?? []} />
        <GroupCheckbox fieldList={data?.fieldList ?? []} />

        <RadioGroupFilter />

        <Button size="lg" variant="outline" onClick={handleExport}>
          Export
        </Button>
      </TabsContent>
    </Tabs>
  );
};

export default TabButton;