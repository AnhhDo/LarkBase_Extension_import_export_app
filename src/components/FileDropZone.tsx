import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, X, FileIcon } from "lucide-react";
import ExcelJS from "exceljs";

export interface ParsedExcelData {
  headers: string[];
  rows: Record<string, string>[];
}

interface FileDropzoneProps {
  onParsed: (data: ParsedExcelData | null) => void;
}

const ACCEPTED_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

async function parseExcelFile(file: File): Promise<ParsedExcelData> {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return { headers: [], rows: [] };
  }

  const headers: string[] = [];
  worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell) => {
    headers.push(String(cell.value ?? "").trim());
  });

  const rows: Record<string, string>[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header row
    const rowData: Record<string, string> = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header) {
        rowData[header] = cell.text ?? String(cell.value ?? "");
      }
    });
    rows.push(rowData);
  });

  return { headers, rows };
}

export function FileDropzone({ onParsed }: FileDropzoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isXlsx = (file: File) =>
    file.name.toLowerCase().endsWith(".xlsx") || file.type === ACCEPTED_MIME;

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    const valid = incoming.filter(isXlsx);
    const invalid = incoming.filter((f) => !isXlsx(f));

    setError(invalid.length > 0 ? "Chỉ chấp nhận file .xlsx" : null);
    if (valid.length === 0) return;

    setFiles((prev) => [...prev, ...valid]);

    // Mapping only makes sense against one dataset at a time, so we parse
    // the most recently added valid file for the column mapper below.
    const latest = valid[valid.length - 1];
    setParsing(true);
    try {
      const parsed = await parseExcelFile(latest);
      onParsed(parsed);
    } catch {
      setError("Không thể đọc file Excel. Vui lòng kiểm tra lại định dạng.");
      onParsed(null);
    } finally {
      setParsing(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (next.length === 0) onParsed(null);
      return next;
    });
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void handleFiles(e.dataTransfer.files);
      }}
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center hover:bg-muted/50 transition-colors"
    >
      <UploadCloud className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Drag & drop files here, or
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
      >
        Browse files
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      {parsing && (
        <p className="text-xs text-muted-foreground">Đang đọc file...</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {files.length > 0 && (
        <ul className="mt-4 w-full text-left">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm mt-1"
            >
              <span className="flex items-center gap-2 truncate">
                <FileIcon className="h-4 w-4" /> {file.name}
              </span>
              <button onClick={() => removeFile(i)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}