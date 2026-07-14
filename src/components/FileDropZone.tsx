import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { UploadCloud, X, FileIcon } from "lucide-react"

export function FileDropzone() {
  const [files, setFiles] = useState<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return
    setFiles((prev) => [...prev, ...Array.from(fileList)])
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        handleFiles(e.dataTransfer.files)
      }}
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center hover:bg-muted/50 transition-colors"
    >
      <UploadCloud className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Drag & drop files here, or
      </p>
      <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
        Browse files
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {files.length > 0 && (
        <ul className="mt-4 w-full text-left">
          {files.map((file, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm mt-1"
            >
              <span className="flex items-center gap-2 truncate">
                <FileIcon className="h-4 w-4" /> {file.name}
              </span>
              <button onClick={() => setFiles((f) => f.filter((_, idx) => idx !== i))}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}