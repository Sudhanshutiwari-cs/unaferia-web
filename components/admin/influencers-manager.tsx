"use client"

import { useState, useTransition } from "react"
import { Plus, Pencil, Trash2, Eye, EyeOff, Users, X as XIcon } from "lucide-react"
import { SupabaseImageUpload } from "@/components/admin/supabase-image-upload"
import { toast } from "sonner"
import {
  createInfluencer,
  updateInfluencer,
  deleteInfluencer,
  toggleInfluencerActive,
  type Influencer,
  type InfluencerFormData,
} from "@/app/actions/admin-influencers"

const EMPTY_FORM: InfluencerFormData = {
  name: "",
  handle: "",
  avatar_url: "",
  href: "/",
  bg_color: "#e0f2fe",
  sort_order: 99,
  is_active: true,
}

// ── Avatar preview bubble ───────────────────────────────────────────────────
function AvatarPreview({ form }: { form: InfluencerFormData }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Tile — matches the storefront strip tile exactly */}
      <div
        className="flex h-[3.2rem] w-[3.2rem] items-center justify-center overflow-hidden rounded-2xl border border-black/[0.06] shadow-sm"
        style={{ backgroundColor: form.bg_color }}
      >
        {form.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.avatar_url} alt={form.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg font-bold" style={{ color: "#333" }}>
            {form.name ? form.name.charAt(0).toUpperCase() : "?"}
          </span>
        )}
      </div>
      <span className="max-w-[3.6rem] truncate text-center text-[10px] font-medium text-foreground">
        {form.name.split(" ")[0] || "Name"}
      </span>
    </div>
  )
}

// ── Add / Edit modal ────────────────────────────────────────────────────────
function InfluencerFormModal({
  influencer,
  onClose,
  onSaved,
}: {
  influencer: Influencer | null
  onClose: () => void
  onSaved: (saved: Influencer) => void
}) {
  const isEdit = !!influencer
  const [form, setForm] = useState<InfluencerFormData>(
    isEdit
      ? {
          name: influencer.name,
          handle: influencer.handle,
          avatar_url: influencer.avatar_url ?? "",
          href: influencer.href,
          bg_color: influencer.bg_color,
          sort_order: influencer.sort_order,
          is_active: influencer.is_active,
        }
      : { ...EMPTY_FORM },
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function set<K extends keyof InfluencerFormData>(k: K, v: InfluencerFormData[K]) {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError("Name is required."); return }
    setError(null)

    startTransition(async () => {
      const res = isEdit
        ? await updateInfluencer(influencer!.id, form)
        : await createInfluencer(form)

      if (!res.ok) { setError(res.error ?? "Something went wrong."); toast.error(res.error ?? "Something went wrong."); return }
      toast.success(isEdit ? "Influencer updated" : "Influencer added")
      onSaved({
        id: influencer?.id ?? `tmp-${Date.now()}`,
        ...form,
        avatar_url: form.avatar_url || null,
        bg_color: form.bg_color,
        created_at: influencer?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">
            {isEdit ? "Edit Influencer" : "Add Influencer"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5">
          {/* Preview + upload row */}
          <div className="flex items-start gap-5">
            <AvatarPreview form={form} />

            <div className="flex flex-1 flex-col gap-3">
              {/* Name */}
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>

              {/* Handle */}
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Handle</label>
                <input
                  value={form.handle}
                  onChange={(e) => set("handle", e.target.value)}
                  placeholder="@username"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
            </div>
          </div>

          {/* Avatar image */}
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Avatar image</label>
            <SupabaseImageUpload
              value={form.avatar_url ?? ""}
              onChange={(url) => set("avatar_url", url)}
              bucket="influencers"
              aspectClass="aspect-square"
              placeholder="Upload avatar image"
            />
          </div>

          {/* Tile background color */}
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Tile background color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.bg_color}
                onChange={(e) => set("bg_color", e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-border bg-background p-0.5"
              />
              <input
                value={form.bg_color}
                onChange={(e) => set("bg_color", e.target.value)}
                placeholder="#e0f2fe"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
          </div>

          {/* Link */}
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Link (href)</label>
            <input
              value={form.href}
              onChange={(e) => set("href", e.target.value)}
              placeholder="/search?influencer=username"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>

          {/* Sort order + Active */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-foreground">Sort order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => set("sort_order", Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => set("is_active", e.target.checked)}
                className="h-4 w-4 rounded border-border accent-brand"
              />
              Active
            </label>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:brightness-95 disabled:opacity-60"
            >
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Add influencer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main manager ────────────────────────────────────────────────────────────
export function InfluencersManager({ initial }: { initial: Influencer[] }) {
  const [influencers, setInfluencers] = useState<Influencer[]>(initial)
  const [editing, setEditing] = useState<Influencer | null | "new">(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleSaved(saved: Influencer) {
    setInfluencers((prev) => {
      const exists = prev.find((x) => x.id === saved.id)
      return exists ? prev.map((x) => (x.id === saved.id ? saved : x)) : [...prev, saved]
    })
    setEditing(null)
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this influencer?")) return
    setDeletingId(id)
    startTransition(async () => {
      await deleteInfluencer(id)
      setDeletingId(null)
      setInfluencers((prev) => prev.filter((x) => x.id !== id))
      toast.success("Influencer deleted")
    })
  }

  function handleToggle(id: string, current: boolean) {
    setInfluencers((prev) => prev.map((x) => (x.id === id ? { ...x, is_active: !current } : x)))
    startTransition(async () => {
      await toggleInfluencerActive(id, !current)
      toast.success(!current ? "Influencer shown" : "Influencer hidden")
    })
  }

  return (
    <>
      {editing !== null && (
        <InfluencerFormModal
          influencer={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      <div className="flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {influencers.length} influencer{influencers.length !== 1 ? "s" : ""}
          </p>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:brightness-95"
          >
            <Plus className="h-4 w-4" /> Add influencer
          </button>
        </div>

        {/* Live preview strip */}
        {influencers.filter((x) => x.is_active).length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-3 text-xs font-medium text-muted-foreground">Storefront preview</p>
            <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {influencers
                .filter((x) => x.is_active)
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((inf) => (
                  <div key={inf.id} className="flex shrink-0 flex-col items-center gap-1.5">
                    <div className="rounded-full p-[2.5px] ring-2 ring-brand/50 ring-offset-2">
                      <div className="h-12 w-12 overflow-hidden rounded-full bg-muted">
                        {inf.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={inf.avatar_url} alt={inf.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-brand/10 text-base font-bold text-brand">
                            {inf.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="max-w-[4rem] truncate text-center text-[10px] font-semibold text-foreground">
                      {inf.name}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Table */}
        {influencers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No influencers yet</p>
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:brightness-95"
            >
              <Plus className="h-4 w-4" /> Add first influencer
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Influencer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Handle</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground sm:table-cell">Link</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Order</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Visible</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {influencers.map((inf) => (
                  <tr key={inf.id} className="transition hover:bg-muted/20">
                    {/* Avatar + name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-brand/30">
                          {inf.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={inf.avatar_url} alt={inf.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-brand">
                              {inf.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-foreground">{inf.name}</span>
                      </div>
                    </td>

                    {/* Handle */}
                    <td className="px-4 py-3 text-muted-foreground">{inf.handle || "—"}</td>

                    {/* Link */}
                    <td className="hidden max-w-[200px] truncate px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                      {inf.href}
                    </td>

                    {/* Sort order */}
                    <td className="px-4 py-3 text-center text-muted-foreground">{inf.sort_order}</td>

                    {/* Toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(inf.id, inf.is_active)}
                        aria-label={inf.is_active ? "Hide" : "Show"}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition
                          ${inf.is_active
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                      >
                        {inf.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {inf.is_active ? "Live" : "Hidden"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(inf)}
                          className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(inf.id)}
                          disabled={deletingId === inf.id}
                          className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
