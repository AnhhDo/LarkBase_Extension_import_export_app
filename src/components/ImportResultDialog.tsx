import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, SkipForward, PlusCircle } from "lucide-react";
import type { ImportResult } from "@/services/ImportService";

interface ImportResultDialogProps {
  open: boolean;
  result: ImportResult | null;
  onOpenChange: (open: boolean) => void;
}

export function ImportResultDialog({
  open,
  result,
  onOpenChange,
}: ImportResultDialogProps) {
  if (!result) return null;

  const hasNewColumns = result.createdColumns.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kết quả import</DialogTitle>
          <DialogDescription>
            Đã xử lý {result.total} dòng dữ liệu từ file Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <div className="flex items-center gap-2 rounded-md border p-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm">
              <strong>{result.successCount}</strong> dòng import thành công
            </span>
          </div>

          {hasNewColumns && (
            <div className="flex items-start gap-2 rounded-md border p-3">
              <PlusCircle className="h-5 w-5 shrink-0 text-blue-600" />
              <span className="text-sm">
                Đã thêm <strong>{result.createdColumns.length}</strong> cột
                mới ({result.createdColumns.join(", ")}) và bổ sung dữ liệu
                cho <strong>{result.updatedCount}</strong> dòng đã tồn tại
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-md border p-3">
            <SkipForward className="h-5 w-5 text-amber-600" />
            <span className="text-sm">
              <strong>{result.skippedCount}</strong> dòng bị bỏ qua vì đã tồn
              tại trong bảng
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-md border p-3">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm">
              <strong>{result.errorCount}</strong> dòng lỗi
            </span>
          </div>

          {result.errorRows.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-md border p-2 text-xs text-muted-foreground">
              {result.errorRows.map((r) => (
                <div key={r.rowIndex} className="border-b py-1 last:border-b-0">
                  Dòng {r.rowIndex}: {r.error}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}