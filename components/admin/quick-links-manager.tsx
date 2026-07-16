"use client"

import { useState, useTransition } from "react"
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, Link2 } from "lucide-react"
import { toast } from "sonner"
import { SupabaseImageUpload } from "@/components/admin/supabase-image-upload"
import {
  createQuickLink,
  updateQuickLink,
  deleteQuickLink,
  toggleQuickLinkActive,
  type QuickLink,
  type QuickLinkFormData,
} from "@/app/actions/admin-quick-links"

const EMPTY_FORM: QuickLinkFormData = {
  label: "",
  icon_url: "",
  bg_color: "#e8f4fd",
  href: "/",
  sort_order: 99,
  is_active: true,
}

// Swatch palette for bg_color picker
const COLOR_SWATCHES = [
  "#e8f0fe", "#e8f5e9", "#fff3e0", "#fce4ec",
  "#f3e5f5", "#e0f2f1", "#fff8e1", "#fbe9e7",
  "#e3f2fd", "#f9fbe7", "#ede7f6", "#e0f7fa",
]

function QuickLinkPreview({ link }: { link: QuickLinkFormData }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-black/[0.06] shadow-sm"
        style={{ backgroundColor: link.bg_color }}
      >
        {link.icon_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={link.icon_url} alt={link.label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xl font-bold text-foreground/60">
            {link.label ? link.label.charAt(0).toUpperCase() : "?"}
          </span>
        )}
      </div>
      <span className="max-w-[3.6rem] truncate text-center text-[11px] font-medium text-foreground">
        {link.label || "Label"}
      </span>
    </div>
  )
}

function QuickLinkFormModal({
  link,
  onClose,
  onSaved,
}: {
  link: QuickLink | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!link
  const [form, setForm] = useState<QuickLinkFormData>(
    isEdit
      ? {
          label: link.label,
          icon_url: link.icon_url ?? "",
          bg_color: link.bg_color,
          href: link.href,
          sort_order: link.sort_order,
          is_active: link.is_active,
        }
      : EMPTY_FORM,
  )
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const set = <K extends keyof QuickLinkFormData>(k: K, v: QuickLinkFormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.label.trim()) { setError("Label is required."); return }
    if (!form.href.trim()) { setError("Link URL is required."); return }
    setError("")
    startTransition(async () => {
      const res = isEdit
        ? await updateQuickLink(link.id, form)
        : await createQuickLink(form)
      if (!res.ok) { setError(res.error ?? "Something went wrong."); toast.error(res.error ?? "Something went wrong."); return }
      toast.success(isEdit ? "Quick link updated" : "Quick link created")
      onSaved()
    })
  }

  const inputCls =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">
            {isEdit ? "Edit Quick Link" : "Add Quick Link"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex flex-col gap-5 p-6">

            {/* Live preview */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview</p>
              <QuickLinkPreview link={form} />
            </div>

            {/* Label */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Label <span className="text-destructive">*</span></label>
              <input
                value={form.label}
                onChange={(e) => set("label", e.target.value)}
                placeholder="e.g. Pay, Fresh, Bazaar"
                maxLength={20}
                className={inputCls}
              />
            </div>

            {/* Icon image upload */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Icon Image</label>
              <SupabaseImageUpload
                value={form.icon_url ?? ""}
                onChange={(url) => set("icon_url", url)}
                bucket="quick-links"
                aspectClass="aspect-square"
                placeholder="Click or drag icon here"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Leave empty to show the first letter of the label as a fallback.
              </p>
            </div>

            {/* Background color */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Background Color</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("bg_color", c)}
                    className="h-8 w-8 rounded-full border-2 transition"
                    style={{
                      backgroundColor: c,
                      borderColor: form.bg_color === c ? "#1b2341" : "transparent",
                      boxShadow: form.bg_color === c ? "0 0 0 2px white, 0 0 0 4px #1b2341" : undefined,
                    }}
                    aria-label={c}
                  />
                ))}
                {/* Custom hex input */}
                <div className="flex items-center gap-1.5">
                  <div className="h-8 w-8 rounded-full border border-border" style={{ backgroundColor: form.bg_color }} />
                  <input
                    type="text"
                    value={form.bg_color}
                    onChange={(e) => set("bg_color", e.target.value)}
                    className="w-24 rounded-md border border-border bg-background px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            {/* Link URL */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Link URL <span className="text-destructive">*</span></label>
              <input
                value={form.href}
                onChange={(e) => set("href", e.target.value)}
                placeholder="/category/electronics"
                className={inputCls}
              />
            </div>

            {/* Sort order + Active */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Sort Order</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => set("sort_order", Number(e.target.value))}
                  min={1}
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col justify-end">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-2.5">
                  <span className="text-sm font-medium text-foreground">Active</span>
                  <div className="relative ml-auto">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={form.is_active}
                      onChange={(e) => set("is_active", e.target.checked)}
                    />
                    <div className={`h-6 w-10 rounded-full transition ${form.is_active ? "bg-brand" : "bg-muted-foreground/30"}`} />
                    <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.is_active ? "left-[1.375rem]" : "left-0.5"}`} />
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-brand px-6 py-2 text-sm font-bold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Saving…" : isEdit ? "Save Changes" : "Add Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function QuickLinksManager({ initialLinks }: { initialLinks: QuickLink[] }) {
  const [links, setLinks] = useState<QuickLink[]>(initialLinks)
  const [editing, setEditing] = useState<QuickLink | null | "new">(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleDelete(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      await deleteQuickLink(id)
      setDeletingId(null)
      setLinks((l) => l.filter((x) => x.id !== id))
      toast.success("Quick link deleted")
    })
  }

  function handleToggle(id: string, current: boolean) {
    setLinks((l) => l.map((x) => (x.id === id ? { ...x, is_active: !current } : x)))
    startTransition(async () => {
      await toggleQuickLinkActive(id, !current)
      toast.success(!current ? "Link activated" : "Link deactivated")
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Mobile Quick Links</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Horizontal icon strip shown on mobile only, below the header. Max 8–10 links recommended.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-brand-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Link
        </button>
      </div>

      {/* Live strip preview */}
      {links.filter((l) => l.is_active).length > 0 && (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Mobile preview (active links)
          </p>
          <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {links.filter((l) => l.is_active).map((l) => (
              <QuickLinkPreview
                key={l.id}
                link={{
                  label: l.label,
                  icon_url: l.icon_url ?? "",
                  bg_color: l.bg_color,
                  href: l.href,
                  sort_order: l.sort_order,
                  is_active: l.is_active,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Link list */}
      {links.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border py-16 text-center">
          <Link2 className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No quick links yet</p>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="rounded-lg bg-brand px-5 py-2 text-sm font-bold text-brand-foreground hover:opacity-90"
          >
            Add your first link
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {links.map((link, idx) => (
            <div
              key={link.id}
              className={`flex items-center gap-3 overflow-hidden rounded-xl border transition ${
                link.is_active ? "border-border bg-card" : "border-dashed border-border bg-muted/40 opacity-60"
              }`}
            >
              {/* Color bar */}
              <div className="w-2 self-stretch shrink-0 rounded-l-xl" style={{ backgroundColor: link.bg_color }} />

              {/* Drag handle */}
              <div className="flex items-center text-muted-foreground/40 pl-1">
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Order */}
              <span className="w-6 shrink-0 text-center text-sm font-bold text-muted-foreground">{idx + 1}</span>

              {/* Icon preview */}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/[0.06]"
                style={{ backgroundColor: link.bg_color }}
              >
                {link.icon_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={link.icon_url} alt={link.label} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-foreground/60">{link.label.charAt(0).toUpperCase()}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex min-w-0 flex-1 flex-col py-3 pr-2">
                <p className="truncate text-sm font-semibold text-foreground">{link.label}</p>
                <p className="truncate text-xs text-muted-foreground">{link.href}</p>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1 px-3">
                <button
                  type="button"
                  onClick={() => handleToggle(link.id, link.is_active)}
                  title={link.is_active ? "Deactivate" : "Activate"}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  {link.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(link)}
                  title="Edit"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(link.id)}
                  disabled={deletingId === link.id}
                  title="Delete"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {editing !== null && (
        <QuickLinkFormModal
          link={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); window.location.reload() }}
        />
      )}
    </div>
  )
}
