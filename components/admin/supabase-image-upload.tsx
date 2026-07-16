"use client"

import { useRef, useState } from "react"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Bucket = "products" | "banners" | "quick-links" | "influencers"

interface Props {
  /** Current image URL (controlled) */
  value: string
  /** Called with the new public URL after a successful upload, or "" when cleared */
  onChange: (url: string) => void
  /** Supabase storage bucket to upload into */
  bucket: Bucket
  /** Optional aspect ratio class e.g. "aspect-video" or "aspect-square" */
  aspectClass?: string
  /** Shown as placeholder when no image */
  placeholder?: string
  className?: string
}

export function SupabaseImageUpload({
  value,
  onChange,
  bucket,
  aspectClass = "aspect-video",
  placeholder = "Click or drag & drop an image",
  className,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    setError("")
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    fd.append("bucket", bucket)
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json.error ?? "Upload failed.")
      } else {
        onChange(json.url)
      }
    } catch {
      setError("Network error during upload.")
    } finally {
      setUploading(false)
    }
  }

  function handleFile(file: File | undefined) {
    if (!file) return
    upload(file)
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-xl border-2 border-dashed transition-colors",
          aspectClass,
          dragOver
            ? "border-brand bg-brand/5"
            : value
            ? "border-border"
            : "border-border bg-muted/40 hover:border-brand/60 hover:bg-brand/5",
          !uploading && "cursor-pointer",
        )}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
        aria-label="Image upload area"
      >
        {/* Preview */}
        {value && !uploading && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Uploaded preview"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Uploading spinner */}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80">
            <Loader2 className="h-7 w-7 animate-spin text-brand" />
            <span className="text-xs text-muted-foreground">Uploading…</span>
          </div>
        )}

        {/* Empty state */}
        {!value && !uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{placeholder}</span>
            <span className="text-[10px] text-muted-foreground/60">JPEG, PNG, WebP, GIF — max 5 MB</span>
          </div>
        )}

        {/* Change overlay on hover when image exists */}
        {value && !uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all hover:bg-black/40 hover:opacity-100">
            <div className="flex flex-col items-center gap-1 text-white">
              <ImageIcon className="h-6 w-6" />
              <span className="text-xs font-medium">Change image</span>
            </div>
          </div>
        )}
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          {value ? "Replace" : "Upload"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/10"
          >
            <X className="h-3.5 w-3.5" />
            Remove
          </button>
        )}
        {error && (
          <span className="text-xs text-destructive">{error}</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
