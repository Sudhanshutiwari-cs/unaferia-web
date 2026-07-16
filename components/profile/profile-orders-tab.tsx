"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import Image from "next/image"
import { Package, ShoppingBag, ChevronRight, Truck, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { CustomerUser } from "@/hooks/use-user"
import { OrderDetailDrawer } from "@/components/order-detail-drawer"

type OrderItem = {
  id: string
  product_title: string
  product_image: string | null
  price: number
  quantity: number
}

type Order = {
  id: string
  order_number: string
  status: string
  payment_status: string
  payment_method: string | null
  total: number
  created_at: string
  tracking_carrier: string | null
  tracking_number: string | null
  tracking_url: string | null
  estimated_delivery: string | null
  order_items: OrderItem[]
}

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  pending:    { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400" },
  confirmed:  { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400" },
  processing: { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400" },
  shipped:    { bg: "bg-indigo-50",  text: "text-indigo-700",  dot: "bg-indigo-400" },
  delivered:  { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  cancelled:  { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-400" },
}

function StatusPill({ status }: { status: string }) {
  const s = statusStyles[status] ?? { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {status}
    </span>
  )
}

const supabase = createClient()

async function fetchOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, payment_method, total, created_at, tracking_carrier, tracking_number, tracking_url, estimated_delivery, order_items(id, product_title, product_image, price, quantity)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20)
  if (error) return []
  return (data as Order[]) ?? []
}

export function ProfileOrdersTab({ user }: { user: CustomerUser }) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const { data: orders, isLoading } = useSWR(
    user ? `profile-orders-${user.id}` : null,
    () => fetchOrders(user.id),
  )

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (!orders?.length) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </span>
        <div>
          <p className="font-semibold text-foreground">No orders yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Your orders will appear here after you place one.</p>
        </div>
        <Link
          href="/"
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground transition hover:opacity-90"
        >
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <OrderDetailDrawer orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
      {orders.map((order) => {
        const firstItem = order.order_items?.[0]
        const extraCount = (order.order_items?.length ?? 1) - 1
        const date = new Date(order.created_at).toLocaleDateString("en-IN", {
          day: "numeric", month: "short", year: "numeric",
        })

        return (
          <div
            key={order.id}
            className="group rounded-xl border border-border bg-card transition hover:border-brand/30 hover:shadow-sm"
          >
            <div className="flex items-start gap-4 p-4">
              {/* Product thumbnail */}
              {firstItem?.product_image ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  <Image
                    src={firstItem.product_image}
                    alt={firstItem.product_title}
                    fill
                    className="object-contain p-1"
                  />
                </div>
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                  <Package className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                </span>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Order #{order.order_number}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{date}</p>
                  </div>
                  <StatusPill status={order.status} />
                </div>

                <p className="mt-1.5 truncate text-sm text-muted-foreground">
                  {firstItem?.product_title}
                  {extraCount > 0 && (
                    <span className="ml-1 text-xs">+{extraCount} more item{extraCount !== 1 ? "s" : ""}</span>
                  )}
                </p>

                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    &#8377;{order.total.toLocaleString("en-IN")}
                  </p>
                  <button
                    onClick={() => setSelectedOrderId(order.id)}
                    className="flex items-center gap-0.5 text-xs font-medium text-link hover:underline"
                    aria-label={`View details for order ${order.order_number}`}
                  >
                    View details
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tracking strip — shown when admin has added tracking info */}
            {(order.tracking_number || order.tracking_carrier || order.tracking_url) && (
              <div className="flex items-center justify-between border-t border-brand/10 bg-brand/5 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden="true" />
                  <span className="text-xs text-muted-foreground">
                    {order.tracking_carrier && <span className="font-medium text-foreground">{order.tracking_carrier}</span>}
                    {order.tracking_carrier && order.tracking_number && " · "}
                    {order.tracking_number && <span className="font-medium text-foreground">{order.tracking_number}</span>}
                    {!order.tracking_carrier && !order.tracking_number && "Tracking available"}
                  </span>
                </div>
                {order.tracking_url && (
                  <a
                    href={/^https?:\/\//i.test(order.tracking_url ?? '') ? order.tracking_url! : `https://${order.tracking_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:opacity-90"
                    aria-label="Track shipment"
                  >
                    Track <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        )
      })}

      <Link
        href="/orders"
        className="block w-full rounded-xl border border-dashed border-border bg-card py-3 text-center text-sm font-medium text-link transition hover:bg-muted"
      >
        View all orders
      </Link>
    </div>
  )
}
