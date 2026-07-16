"use client"

import { useState, useTransition } from "react"
import {
  Plus, Trash2, ToggleLeft, ToggleRight, Tag, X, Loader2, Copy, Check,
} from "lucide-react"
import { toast } from "sonner"
import type { Coupon } from "@/app/actions/coupon"
import {
  adminCreateCoupon,
  adminDeleteCoupon,
  adminToggleCoupon,
} from "@/app/actions/coupon"

// ── helpers ───────────────────────────────────────────────────────────────
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
        active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${
        type === "percentage"
          ? "bg-brand/10 text-brand"
          : "bg-navy/10 text-navy"
      }`}
    >
      {type === "percentage" ? "%" : "₹"} {type === "percentage" ? "Percent" : "Flat"}
    </span>
  )
}

function CodePill({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={copy}
      title="Copy code"
      className="group flex items-center gap-1.5 rounded-md border border-dashed border-border bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-foreground transition hover:border-brand hover:bg-brand/5"
    >
      {code}
      {copied ? (
        <Check className="size-3 text-green-600" />
      ) : (
        <Copy className="size-3 text-muted-foreground group-hover:text-brand" />
      )}
    </button>
  )
}

// ── Create modal ──────────────────────────────────────────────────────────
type CreateForm = {
  code: string
  description: string
  discount_type: "percentage" | "flat"
  discount_value: string
  min_order_value: string
  max_discount: string
  usage_limit: string
  expires_at: string
}

const EMPTY_FORM: CreateForm = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  min_order_value: "0",
  max_discount: "",
  usage_limit: "",
  expires_at: "",
}

function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (c: Coupon) => void
}) {
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const set = (k: keyof CreateForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await adminCreateCoupon({
        code: form.code,
        description: form.description,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        min_order_value: parseFloat(form.min_order_value) || 0,
        max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
        expires_at: form.expires_at || null,
      })
      if (!result.success) {
        setError(result.error ?? "Failed to create coupon.")
        toast.error(result.error ?? "Failed to create coupon.")
        return
      }
      toast.success("Coupon created")
      // Optimistic new coupon object (id will be real on next server fetch)
      onCreated({
        id: crypto.randomUUID(),
        code: form.code.toUpperCase(),
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        min_order_value: parseFloat(form.min_order_value) || 0,
        max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
        used_count: 0,
        starts_at: null,
        expires_at: form.expires_at || null,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      onClose()
    })
  }

  const field = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="mb-5 flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-brand/10">
            <Tag className="size-5 text-brand" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Create Coupon</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Code *</label>
              <input required value={form.code} onChange={set("code")} placeholder="e.g. SAVE20" className={field} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Type *</label>
              <select value={form.discount_type} onChange={set("discount_type")} className={field}>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                {form.discount_type === "percentage" ? "Discount %" : "Discount Amount ₹"} *
              </label>
              <input required type="number" min="0.01" step="0.01" value={form.discount_value} onChange={set("discount_value")} placeholder={form.discount_type === "percentage" ? "10" : "100"} className={field} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Min Order Value (₹)</label>
              <input type="number" min="0" value={form.min_order_value} onChange={set("min_order_value")} placeholder="0" className={field} />
            </div>

            {form.discount_type === "percentage" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Max Discount (₹)</label>
                <input type="number" min="0" value={form.max_discount} onChange={set("max_discount")} placeholder="No limit" className={field} />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Usage Limit</label>
              <input type="number" min="1" value={form.usage_limit} onChange={set("usage_limit")} placeholder="Unlimited" className={field} />
            </div>

            <div className={form.discount_type === "percentage" ? "" : "sm:col-span-2"}>
              <label className="mb-1 block text-xs font-medium text-foreground">Expires At</label>
              <input type="date" value={form.expires_at} onChange={set("expires_at")} className={field} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Description</label>
            <textarea value={form.description} onChange={set("description")} rows={2} placeholder="Short description shown to customers" className={`${field} resize-none`} />
          </div>

          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:opacity-90 disabled:opacity-50"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Create Coupon
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export function CouponsManager({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState(initialCoupons)
  const [showCreate, setShowCreate] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleToggle = (id: string, current: boolean) => {
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: !current } : c)))
    startTransition(() => adminToggleCoupon(id, !current))
  }

  const handleDelete = (id: string) => {
    if (!confirm("Delete this coupon? This cannot be undone.")) return
    setCoupons((prev) => prev.filter((c) => c.id !== id))
    startTransition(async () => {
      await adminDeleteCoupon(id)
      toast.success("Coupon deleted")
    })
  }

  const formatValue = (c: Coupon) =>
    c.discount_type === "percentage"
      ? `${c.discount_value}%${c.max_discount ? ` (max ₹${c.max_discount})` : ""}`
      : `₹${c.discount_value}`

  const formatExpiry = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "No expiry"

  return (
    <>
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => setCoupons((prev) => [c, ...prev])}
        />
      )}

      <div className="flex flex-col gap-4">
        {/* Header bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{coupons.length} coupon{coupons.length !== 1 ? "s" : ""} total · {coupons.filter((c) => c.is_active).length} active</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus className="size-4" />
            New Coupon
          </button>
        </div>

        {/* Mobile cards */}
        <div className="flex flex-col gap-3 sm:hidden">
          {coupons.length === 0 ? (
            <p className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
              No coupons yet. Create your first one.
            </p>
          ) : coupons.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1.5">
                  <CodePill code={c.code} />
                  <div className="flex items-center gap-1.5">
                    <TypeBadge type={c.discount_type} />
                    <StatusBadge active={c.is_active} />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => handleToggle(c.id, c.is_active)}
                    aria-label={c.is_active ? "Deactivate" : "Activate"}
                    className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted"
                  >
                    {c.is_active
                      ? <ToggleRight className="size-4 text-green-600" />
                      : <ToggleLeft className="size-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    aria-label="Delete coupon"
                    className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Discount: <span className="font-semibold text-foreground">{formatValue(c)}</span></span>
                <span>Min order: <span className="font-semibold text-foreground">₹{c.min_order_value}</span></span>
                <span>Used: <span className="font-semibold text-foreground">{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</span></span>
                <span>Expires: <span className="font-semibold text-foreground">{formatExpiry(c.expires_at)}</span></span>
              </div>
              {c.description && <p className="mt-2 text-xs text-muted-foreground">{c.description}</p>}
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-xl border border-border bg-card sm:block">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Min Order</th>
                <th className="px-4 py-3 font-medium">Usage</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No coupons yet. Create your first one.
                  </td>
                </tr>
              )}
              {coupons.map((c) => (
                <tr key={c.id} className="transition hover:bg-muted/40">
                  <td className="px-4 py-3"><CodePill code={c.code} /></td>
                  <td className="px-4 py-3"><TypeBadge type={c.discount_type} /></td>
                  <td className="px-4 py-3 font-medium text-foreground">{formatValue(c)}</td>
                  <td className="px-4 py-3 text-muted-foreground">₹{c.min_order_value.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.used_count}
                    {c.usage_limit !== null ? <span className="text-muted-foreground"> / {c.usage_limit}</span> : " / ∞"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatExpiry(c.expires_at)}</td>
                  <td className="px-4 py-3"><StatusBadge active={c.is_active} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggle(c.id, c.is_active)}
                        aria-label={c.is_active ? "Deactivate" : "Activate"}
                        title={c.is_active ? "Deactivate" : "Activate"}
                        className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted"
                      >
                        {c.is_active
                          ? <ToggleRight className="size-4 text-green-600" />
                          : <ToggleLeft className="size-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        aria-label="Delete coupon"
                        className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
