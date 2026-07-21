import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ColumnMapping } from "@/services/ImportService";

interface ColumnMapperProps {
  mapping: ColumnMapping[];
  excelHeaders: string[];
  onChange: (mapping: ColumnMapping[]) => void;
}

// Below the FileDropzone: one row per Larkbase field, a checkbox to include
// it in the import, and a select to pick which Excel column feeds it.
// Columns are pre-matched by name where possible (see TabButton).
export function ColumnMapper({ mapping, excelHeaders, onChange }: ColumnMapperProps) {
  if (mapping.length === 0) return null;

  const toggleInclude = (larkFieldId: string, checked: boolean) => {
    onChange(
      mapping.map((m) =>
        m.larkFieldId === larkFieldId ? { ...m, include: checked } : m
      )
    );
  };

  const setExcelColumn = (larkFieldId: string, excelColumn: string | null) => {
    onChange(
      mapping.map((m) =>
        m.larkFieldId === larkFieldId ? { ...m, excelColumn } : m
      )
    );
  };

  return (
    <div className="mt-4 flex flex-col gap-2">
      <p className="text-sm font-medium">Chọn cột để khớp dữ liệu</p>
      <div className="rounded-md border">
        <div className="grid grid-cols-[auto_1fr_1fr] gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
          <span />
          <span>Cột Larkbase</span>
          <span>Cột Excel tương ứng</span>
        </div>
        {mapping.map((m) => (
          <div
            key={m.larkFieldId}
            className="grid grid-cols-[auto_1fr_1fr] items-center gap-2 border-b px-3 py-2 last:border-b-0"
          >
            <Checkbox
              checked={m.include}
              onCheckedChange={(checked) =>
                toggleInclude(m.larkFieldId, checked === true)
              }
            />
            <span className="truncate text-sm" title={m.larkFieldName}>
              {m.larkFieldName}
            </span>
            <Select
              value={m.excelColumn ?? undefined}
              disabled={!m.include}
              onValueChange={(value) => setExcelColumn(m.larkFieldId, value)}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Chọn cột excel" />
              </SelectTrigger>
              <SelectContent>
                {excelHeaders.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}