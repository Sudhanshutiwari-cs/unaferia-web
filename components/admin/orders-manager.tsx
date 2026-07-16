'use client'

import { useMemo, useState, useCallback } from 'react'
import { Search, Settings2, Truck, RefreshCw } from 'lucide-react'
import { OrderProcessDrawer } from '@/components/admin/order-process-drawer'
import type { AdminOrderRow, OrderDetailStatus } from '@/app/actions/admin-order'

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-700',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-indigo-100 text-indigo-700',
  delivered:  'bg-emerald-100 text-emerald-700',
  cancelled:  'bg-red-100 text-red-700',
  refunded:   'bg-rose-100 text-rose-600',
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground'
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {status}
    </span>
  )
}

function formatINR(v: number) {
  return '₹' + Number(v).toLocaleString('en-IN')
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type FilterTab = 'All' | OrderDetailStatus
const FILTERS: FilterTab[] = ['All', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']

// ─── Component ────────────────────────────────────────────────────────────────

interface OrdersManagerProps {
  initialOrders: AdminOrderRow[]
  refreshOrdersAction: () => Promise<AdminOrderRow[]>
}

export function OrdersManager({ initialOrders, refreshOrdersAction }: OrdersManagerProps) {
  const [orders, setOrders] = useState<AdminOrderRow[]>(initialOrders)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<FilterTab>('All')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter((o) => {
      const matchesStatus = active === 'All' || o.status === active
      const matchesQuery  = !q
        || o.customer.toLowerCase().includes(q)
        || o.order_number.toLowerCase().includes(q)
        || o.email.toLowerCase().includes(q)
      return matchesStatus && matchesQuery
    })
  }, [orders, query, active])

  // Refresh orders after successful update in drawer
  const handleSaved = useCallback(async () => {
    setRefreshing(true)
    try {
      const freshOrders = await refreshOrdersAction()
      setOrders(freshOrders)
    } catch (error) {
      console.error('Failed to refresh orders:', error)
    } finally {
      setRefreshing(false)
    }
  }, [refreshOrdersAction])

  // Manual refresh
  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const freshOrders = await refreshOrdersAction()
      setOrders(freshOrders)
    } catch (error) {
      console.error('Failed to refresh orders:', error)
    } finally {
      setRefreshing(false)
    }
  }, [refreshOrdersAction])

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Refresh indicator */}
        {refreshing && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            Updating orders...
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActive(f)}
                className={
                  'rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition ' +
                  (active === f
                    ? 'bg-navy text-white'
                    : 'border border-border bg-card text-muted-foreground hover:bg-muted')
                }
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {/* Manual refresh button */}
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="rounded-lg border border-border bg-card p-2.5 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
              title="Refresh orders"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="search"
                placeholder="Search orders…"
                className="w-full rounded-lg border border-input bg-card py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="flex flex-col gap-3 sm:hidden">
          {filtered.length === 0 ? (
            <p className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
              No orders found.
            </p>
          ) : (
            filtered.map((order) => (
              <div key={order.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">#{order.order_number}</p>
                    <p className="mt-0.5 font-medium text-foreground">{order.customer}</p>
                    <p className="text-xs text-muted-foreground">{order.email}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                {order.tracking_number && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Truck className="h-3.5 w-3.5" />
                    <span>{order.tracking_carrier} · {order.tracking_number}</span>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{order.date}</span>
                  <span className="font-semibold text-foreground">{formatINR(order.total)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setProcessingId(order.id)}
                  disabled={refreshing}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-brand bg-brand/5 py-2 text-sm font-medium text-brand hover:bg-brand/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Settings2 className="h-4 w-4" /> Process Order
                </button>
              </div>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-xl border border-border bg-card sm:block">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Tracking</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((order) => (
                <tr key={order.id} className="transition hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium text-foreground">#{order.order_number}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{order.customer}</p>
                    <p className="text-xs text-muted-foreground">{order.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{order.date}</td>
                  <td className="px-4 py-3 text-foreground">{order.items}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{formatINR(order.total)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3">
                    {order.tracking_number ? (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Truck className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                        <span className="font-medium text-foreground">{order.tracking_carrier}</span>
                        <span>·</span>
                        <span>{order.tracking_number}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setProcessingId(order.id)}
                      disabled={refreshing}
                      className="flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/5 px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      Process
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process drawer */}
      <OrderProcessDrawer
        orderId={processingId}
        onClose={() => setProcessingId(null)}
        onSaved={handleSaved}
      />
    </>
  )
}