"use client"

import useSWR from "swr"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Loader2, Package, ShoppingBag, Truck, ExternalLink, CheckCircle2, Circle, Clock } from "lucide-react"
import { SiteFooter } from "@/components/site-footer"
import { useUser } from "@/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { OrderDetailDrawer } from "@/components/order-detail-drawer"
import { useSWRConfig } from "swr"

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

// ── Order progress steps ──────────────────────────────────────────────────────
const ORDER_STEPS = [
  { key: "pending",    label: "Order Placed" },
  { key: "processing", label: "Processing" },
  { key: "shipped",    label: "Shipped" },
  { key: "delivered",  label: "Delivered" },
]

function getStepIndex(status: string) {
  const idx = ORDER_STEPS.findIndex((s) => s.key === status)
  return idx === -1 ? 0 : idx
}

function OrderProgressBar({ status }: { status: string }) {
  if (status === "cancelled" || status === "refunded") return null
  const current = getStepIndex(status)
  return (
    <div className="px-4 pb-4 pt-1">
      <div className="flex items-center justify-between">
        {ORDER_STEPS.map((step, i) => {
          const done    = i < current
          const active  = i === current
          const future  = i > current
          return (
            <div key={step.key} className="flex flex-1 flex-col items-center gap-1">
              {/* connector line + icon row */}
              <div className="flex w-full items-center">
                {/* left line */}
                {i > 0 && (
                  <div className={`h-0.5 flex-1 transition-all ${done || active ? "bg-brand" : "bg-border"}`} />
                )}
                {/* dot */}
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all
                    ${done  ? "border-brand bg-brand text-white"
                    : active ? "border-brand bg-brand/10 text-brand"
                    : "border-border bg-background text-muted-foreground"}`}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : active ? (
                    <Clock className="h-3.5 w-3.5" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                </div>
                {/* right line */}
                {i < ORDER_STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 transition-all ${done ? "bg-brand" : "bg-border"}`} />
                )}
              </div>
              {/* label */}
              <span className={`text-center text-[10px] font-medium leading-tight
                ${done ? "text-brand" : active ? "text-brand font-semibold" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const supabase = createClient()

async function fetchOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, payment_method, total, created_at, tracking_carrier, tracking_number, tracking_url, estimated_delivery, order_items(id, product_title, product_image, price, quantity)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) {
    console.log("[v0] fetchOrders error:", error.message)
    return []
  }
  return (data as Order[]) ?? []
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
}

function StatusPill({ status }: { status: string }) {
  const cls = statusStyles[status] ?? "bg-muted text-muted-foreground"
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {status}
    </span>
  )
}

function formatINR(v: number) {
  return "₹" + Number(v).toLocaleString("en-IN")
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
}

export default function OrdersPage() {
  const { user, isLoading: userLoading } = useUser()
  const { data: orders, isLoading, mutate } = useSWR(user ? ["orders", user.id] : null, () => fetchOrders(user!.id))
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const { mutate: globalMutate } = useSWRConfig()

  function handleCancelled() {
    mutate()
    globalMutate((key) => typeof key === "string" && key.startsWith("profile-orders-"), undefined, { revalidate: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <OrderDetailDrawer
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onCancelled={handleCancelled}
      />
      <div className="mx-auto max-w-4xl px-3 py-6 sm:px-4">
        <h1 className="mb-4 text-2xl font-bold text-foreground">Your Orders</h1>

        {(userLoading || (user && isLoading)) && (
          <div className="flex flex-col items-center gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Loading your orders…</p>
          </div>
        )}

        {!userLoading && !user && (
          <div className="flex flex-col items-center gap-4 rounded-lg bg-card py-20 text-center">
            <Package className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
            <p className="text-lg font-medium text-foreground">Sign in to view your orders</p>
            <Link href="/login?redirect=/orders" className="rounded-lg bg-brand px-8 py-2.5 font-medium text-brand-foreground hover:brightness-95">
              Sign In
            </Link>
          </div>
        )}

        {user && !isLoading && orders && orders.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-lg bg-card py-20 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
            <p className="text-lg font-medium text-foreground">No orders yet</p>
            <p className="text-sm text-muted-foreground">When you place an order, it will show up here.</p>
            <Link href="/" className="rounded-lg bg-brand px-8 py-2.5 font-medium text-brand-foreground hover:brightness-95">
              Start Shopping
            </Link>
          </div>
        )}

        {user && orders && orders.length > 0 && (
          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <div key={order.id} className="overflow-hidden rounded-lg border border-border bg-card">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border bg-muted/40 px-3 py-3 sm:px-4">
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs sm:gap-x-8">
                    <div>
                      <p className="uppercase tracking-wide text-muted-foreground">Order Placed</p>
                      <p className="font-medium text-foreground">{formatDate(order.created_at)}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wide text-muted-foreground">Total</p>
                      <p className="font-medium text-foreground">{formatINR(order.total)}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wide text-muted-foreground">Order #</p>
                      <p className="font-medium text-foreground truncate max-w-[120px] sm:max-w-none">{order.order_number}</p>
                    </div>
                  </div>
                  <StatusPill status={order.status} />
                </div>

                {/* Items */}
                <div className="divide-y divide-border">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                        <Image
                          src={item.product_image || "/placeholder.svg"}
                          alt={item.product_title}
                          width={64}
                          height={64}
                          className="h-full w-auto object-contain p-1"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium text-foreground">{item.product_title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{formatINR(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                {/* Order progress bar */}
                <OrderProgressBar status={order.status} />

                {/* Tracking card — shown when admin has added any tracking info */}
                {(order.tracking_number || order.tracking_carrier || order.tracking_url) && (
                  <div className="mx-4 mb-4 overflow-hidden rounded-xl border border-brand/20 bg-gradient-to-br from-brand/5 to-indigo-50">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-brand/10 bg-brand/5 px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10">
                          <Truck className="h-4 w-4 text-brand" aria-hidden="true" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">Shipment Tracking</span>
                      </div>
                      {order.tracking_url && (
                        <a
                          href={order.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
                          aria-label="Track your shipment"
                        >
                          Track Now <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    {/* Details */}
                    <div className="grid grid-cols-2 gap-3 px-4 py-3 sm:grid-cols-3">
                      {order.tracking_carrier && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Carrier</p>
                          <p className="mt-0.5 text-sm font-semibold text-foreground">{order.tracking_carrier}</p>
                        </div>
                      )}
                      {order.tracking_number && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">AWB / Tracking No.</p>
                          <p className="mt-0.5 text-sm font-semibold text-foreground">{order.tracking_number}</p>
                        </div>
                      )}
                      {order.estimated_delivery && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Est. Delivery</p>
                          <p className="mt-0.5 text-sm font-semibold text-foreground">
                            {new Date(order.estimated_delivery).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                    {/* Copy-able tracking URL as text */}
                    {order.tracking_url && (
                      <div className="border-t border-brand/10 px-4 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tracking Link</p>
                        <p className="mt-0.5 truncate text-xs text-link">{order.tracking_url}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2.5 text-xs text-muted-foreground sm:px-4">
                  <span className="truncate">
                    {order.payment_method === "cod" ? "Cash on Delivery" : "Online (Razorpay)"} · {order.payment_status}
                  </span>
                  <button
                    onClick={() => setSelectedOrderId(order.id)}
                    className="shrink-0 font-medium text-link hover:underline"
                  >
                    View details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  )
}
