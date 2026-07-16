"use client"

import { useState, useTransition } from "react"
import { Search, AlertTriangle, CheckCircle, Package, Save } from "lucide-react"
import type { InventoryRow } from "@/app/actions/admin-inventory"
import { updateStock } from "@/app/actions/admin-inventory"
import Image from "next/image"

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700">Out of Stock</span>
  if (stock < 10) return <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700">Low Stock</span>
  return <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700">In Stock</span>
}

function StockCell({ row }: { row: InventoryRow }) {
  const [value, setValue] = useState(String(row.stock))
  const [saved, setSaved] = useState(false)
  const [pending, start] = useTransition()
  const dirty = String(row.stock) !== value

  function save() {
    const n = parseInt(value, 10)
    if (isNaN(n) || n < 0) return
    start(async () => {
      await updateStock(row.id, n)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save() }}
        className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />
      {dirty && (
        <button onClick={save} disabled={pending} aria-label="Save stock" className="flex size-7 items-center justify-center rounded-lg bg-brand text-white transition hover:bg-brand/80 disabled:opacity-50">
          <Save className="size-3.5" />
        </button>
      )}
      {saved && !dirty && <CheckCircle className="size-4 text-green-500" />}
    </div>
  )
}

export function InventoryManager({ initial }: { initial: InventoryRow[] }) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "low" | "out">("all")

  const filtered = initial.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.sku ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.brand ?? "").toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === "all" ? true :
      filter === "out" ? r.stock === 0 :
      r.stock > 0 && r.stock < 10
    return matchSearch && matchFilter
  })

  const outCount = initial.filter((r) => r.stock === 0).length
  const lowCount = initial.filter((r) => r.stock > 0 && r.stock < 10).length

  return (
    <div className="flex flex-col gap-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Products", value: initial.length, icon: Package, color: "bg-blue-100 text-blue-600" },
          { label: "In Stock", value: initial.filter((r) => r.stock >= 10).length, icon: CheckCircle, color: "bg-green-100 text-green-600" },
          { label: "Low Stock", value: lowCount, icon: AlertTriangle, color: "bg-amber-100 text-amber-600" },
          { label: "Out of Stock", value: outCount, icon: AlertTriangle, color: "bg-red-100 text-red-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <span className={`flex size-9 items-center justify-center rounded-full ${s.color}`}>
                <s.icon className="size-4" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU or brand…"
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand sm:w-72"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "low", "out"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${filter === f ? "border-brand bg-brand text-white" : "border-border bg-background text-muted-foreground hover:bg-muted"}`}
            >
              {f === "all" ? "All" : f === "low" ? `Low Stock (${lowCount})` : `Out of Stock (${outCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            No products match your filters.
          </p>
        ) : filtered.map((row) => (
          <div key={row.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                {row.thumbnail ? (
                  <Image src={row.thumbnail} alt={row.title} width={40} height={40} className="size-10 object-contain" />
                ) : (
                  <Package className="size-4 text-muted-foreground" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-foreground">{row.title}</p>
                <p className="text-xs text-muted-foreground">{row.category ?? "—"} {row.sku ? `· ${row.sku}` : ""}</p>
              </div>
              <StockBadge stock={row.stock} />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">₹{Number(row.price).toLocaleString("en-IN")}</span>
              <StockCell row={row} />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card sm:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">No products match your filters.</td></tr>
            ) : filtered.map((row) => (
              <tr key={row.id} className="transition hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                      {row.thumbnail ? (
                        <Image src={row.thumbnail} alt={row.title} width={36} height={36} className="size-9 object-contain" />
                      ) : (
                        <Package className="size-4 text-muted-foreground" />
                      )}
                    </span>
                    <span className="line-clamp-1 max-w-[200px] font-medium text-foreground">{row.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.sku ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.category ?? "—"}</td>
                <td className="px-4 py-3 font-medium text-foreground">₹{Number(row.price).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3"><StockBadge stock={row.stock} /></td>
                <td className="px-4 py-3"><StockCell row={row} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
