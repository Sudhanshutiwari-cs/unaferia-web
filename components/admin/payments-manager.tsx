"use client"

import { useState } from "react"
import { Search, IndianRupee, CreditCard, Clock, XCircle } from "lucide-react"
import type { PaymentRow, PaymentStats } from "@/app/actions/admin-payments"

const STATUS_STYLES: Record<string, string> = {
  paid:      "bg-green-100 text-green-700",
  pending:   "bg-amber-100 text-amber-700",
  failed:    "bg-red-100 text-red-700",
  refunded:  "bg-blue-100 text-blue-700",
  cod:       "bg-slate-100 text-slate-700",
}

export function PaymentsManager({ payments, stats }: { payments: PaymentRow[]; stats: PaymentStats }) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filtered = payments.filter((p) => {
    const matchSearch =
      (p.order_number ?? "").toLowerCase().includes(search.toLowerCase()) ||
      p.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.transaction_id ?? "").toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const statCards = [
    { label: "Total Collected", value: `₹${stats.total_collected.toLocaleString("en-IN")}`, icon: IndianRupee, color: "bg-green-100 text-green-600" },
    { label: "Pending", value: `₹${stats.total_pending.toLocaleString("en-IN")}`, icon: Clock, color: "bg-amber-100 text-amber-600" },
    { label: "Failed", value: `₹${stats.total_failed.toLocaleString("en-IN")}`, icon: XCircle, color: "bg-red-100 text-red-600" },
    { label: "Refunded", value: `₹${stats.total_refunded.toLocaleString("en-IN")}`, icon: CreditCard, color: "bg-blue-100 text-blue-600" },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <span className={`flex size-9 items-center justify-center rounded-full ${s.color}`}>
                <s.icon className="size-4" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold text-foreground">{s.value}</p>
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
            placeholder="Search by order, customer, transaction ID…"
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand sm:w-80"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", "paid", "pending", "failed", "refunded"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition ${statusFilter === s ? "border-brand bg-brand text-white" : "border-border bg-background text-muted-foreground hover:bg-muted"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            No payments found.
          </p>
        ) : filtered.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">#{p.order_number ?? p.order_id.slice(0, 8).toUpperCase()}</p>
                <p className="mt-0.5 font-medium text-foreground">{p.customer_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{p.method ?? "—"}</p>
              </div>
              <span className={`rounded px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLES[p.status] ?? "bg-muted text-muted-foreground"}`}>
                {p.status}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="font-mono text-xs text-muted-foreground">{p.transaction_id ?? "—"}</span>
              <span className="font-semibold text-foreground">₹{p.amount.toLocaleString("en-IN")}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card sm:block">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium">Transaction ID</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">No payments found.</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="transition hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-foreground">{p.order_number ?? p.order_id.slice(0, 8).toUpperCase()}</td>
                <td className="px-4 py-3 text-foreground">{p.customer_name}</td>
                <td className="px-4 py-3 font-semibold text-foreground">₹{p.amount.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{p.method ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.transaction_id ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLES[p.status] ?? "bg-muted text-muted-foreground"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
