"use client"

import { useEffect, useCallback, useState } from "react"
import Image from "next/image"
import {
  X, Package, Truck, CreditCard, MapPin, ExternalLink,
  CheckCircle2, Clock, Circle, Tag, FileText, AlertTriangle, Loader2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import useSWR from "swr"
import { toast } from "sonner"
import { cancelOrder } from "@/app/actions/cancel-order"

// ── Types ─────────────────────────────────────────────────────────────────────

type OrderItem = {
  id: string
  product_title: string
  product_image: string | null
  price: number
  quantity: number
  subtotal: number
}

type ShippingAddress = {
  fullName?: string
  phone?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  pincode?: string
}

type FullOrder = {
  id: string
  order_number: string
  status: string
  payment_status: string
  payment_method: string | null
  subtotal: number
  discount: number
  tax: number
  total: number
  coupon_code: string | null
  shipping_address: ShippingAddress | null
  tracking_carrier: string | null
  tracking_number: string | null
  tracking_url: string | null
  estimated_delivery: string | null
  admin_notes: string | null
  placed_at: string | null
  created_at: string
  order_items: OrderItem[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const supabase = createClient()

async function fetchOrderDetail(orderId: string): Promise<FullOrder | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, order_number, status, payment_status, payment_method,
      subtotal, discount, tax, total, coupon_code,
      shipping_address, tracking_carrier, tracking_number,
      tracking_url, estimated_delivery, admin_notes,
      placed_at, created_at,
      order_items(id, product_title, product_image, price, quantity, subtotal)
    `)
    .eq("id", orderId)
    .single()
  if (error || !data) return null
  return data as FullOrder
}

function fmt(v: number) {
  return "₹" + Number(v).toLocaleString("en-IN")
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  })
}

// ── Progress bar ──────────────────────────────────────────────────────────────

const STEPS = [
  { key: "pending",    label: "Placed" },
  { key: "processing", label: "Processing" },
  { key: "shipped",    label: "Shipped" },
  { key: "delivered",  label: "Delivered" },
]

function ProgressBar({ status }: { status: string }) {
  if (status === "cancelled" || status === "refunded") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
        <X className="h-4 w-4" />
        Order {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    )
  }
  const current = STEPS.findIndex((s) => s.key === status)
  const idx = current === -1 ? 0 : current
  return (
    <div className="flex items-center justify-between">
      {STEPS.map((step, i) => {
        const done   = i < idx
        const active = i === idx
        return (
          <div key={step.key} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              {i > 0 && (
                <div className={`h-0.5 flex-1 ${done || active ? "bg-brand" : "bg-border"}`} />
              )}
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs
                ${done  ? "border-brand bg-brand text-white"
                : active ? "border-brand bg-brand/10 text-brand"
                : "border-border bg-background text-muted-foreground"}`}>
                {done   ? <CheckCircle2 className="h-4 w-4" /> :
                 active ? <Clock className="h-3.5 w-3.5" /> :
                          <Circle className="h-3 w-3" />}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 ${done ? "bg-brand" : "bg-border"}`} />
              )}
            </div>
            <span className={`text-center text-[10px] font-medium
              ${done ? "text-brand" : active ? "text-brand font-semibold" : "text-muted-foreground"}`}>
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-brand" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  )
}

// ── Status pill ───────────────────────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-700",
  confirmed:  "bg-blue-100 text-blue-700",
  processing: "bg-blue-100 text-blue-700",
  shipped:    "bg-indigo-100 text-indigo-700",
  delivered:  "bg-emerald-100 text-emerald-700",
  cancelled:  "bg-red-100 text-red-700",
  refunded:   "bg-rose-100 text-rose-700",
}

function StatusPill({ status }: { status: string }) {
  const cls = statusStyles[status] ?? "bg-muted text-muted-foreground"
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {status}
    </span>
  )
}

// ── Main drawer ───────────────────────────────────────────────────────────────

const CANCEL_REASONS = [
  "I changed my mind",
  "I found a better price elsewhere",
  "I ordered by mistake",
  "Delivery time is too long",
  "Other",
]

const CANCELLABLE = ["pending", "confirmed"]

interface Props {
  orderId: string | null
  onClose: () => void
  onCancelled?: (orderId: string) => void
}

export function OrderDetailDrawer({ orderId, onClose, onCancelled }: Props) {
  const { data: order, isLoading, mutate } = useSWR(
    orderId ? `order-detail-${orderId}` : null,
    () => fetchOrderDetail(orderId!),
  )

  const [showCancelPanel, setShowCancelPanel] = useState(false)
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0])
  const [cancelOther, setCancelOther] = useState("")
  const [cancelling, setCancelling] = useState(false)

  // Reset cancel panel when drawer closes / opens new order
  useEffect(() => {
    setShowCancelPanel(false)
    setCancelReason(CANCEL_REASONS[0])
    setCancelOther("")
  }, [orderId])

  async function handleCancelConfirm() {
    if (!orderId) return
    const reason = cancelReason === "Other" ? (cancelOther.trim() || "Other") : cancelReason
    setCancelling(true)
    const result = await cancelOrder(orderId, reason)
    setCancelling(false)
    if (result.ok) {
      toast.success("Order cancelled successfully.")
      mutate()
      onCancelled?.(orderId)
      setShowCancelPanel(false)
    } else {
      toast.error(result.error ?? "Failed to cancel order. Please try again.")
    }
  }

  // Close on Escape
  const handleKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === "Escape") onClose() },
    [onClose],
  )
  useEffect(() => {
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [handleKey])

  // Lock body scroll when open
  useEffect(() => {
    if (orderId) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [orderId])

  if (!orderId) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer — bottom sheet on mobile, right panel on sm+ */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Order details"
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl bg-background shadow-2xl sm:inset-y-0 sm:inset-x-auto sm:right-0 sm:max-h-none sm:w-full sm:max-w-md sm:rounded-none"
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3 sm:py-4">
          <div>
            <p className="text-xs text-muted-foreground">Order details</p>
            <h2 className="text-base font-bold text-foreground">
              {order ? `#${order.order_number}` : "Loading…"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-border"
            aria-label="Close order details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="space-y-4 p-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          )}

          {!isLoading && !order && (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <Package className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Could not load order details.</p>
            </div>
          )}

          {!isLoading && order && (
            <div className="divide-y divide-border">

              {/* ── Summary strip ── */}
              <div className="flex items-center justify-between px-5 py-3">
                <div className="text-xs text-muted-foreground">{fmtDate(order.placed_at || order.created_at)}</div>
                <StatusPill status={order.status} />
              </div>

              {/* ── Progress bar ── */}
              <div className="px-5 py-4">
                <ProgressBar status={order.status} />
              </div>

              {/* ── Tracking card ── */}
              {(order.tracking_number || order.tracking_carrier || order.tracking_url) && (
                <div className="px-5 py-4">
                  <Section icon={Truck} title="Shipment Tracking">
                    <div className="overflow-hidden rounded-xl border border-brand/20 bg-brand/5">
                      <div className="grid grid-cols-2 gap-3 p-4">
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
                            <p className="mt-0.5 text-sm font-semibold text-foreground">{fmtDate(order.estimated_delivery)}</p>
                          </div>
                        )}
                      </div>
                      {order.tracking_url && (
                        <div className="border-t border-brand/10 p-4 pt-3">
                          <a
                            href={/^https?:\/\//i.test(order.tracking_url) ? order.tracking_url : `https://${order.tracking_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                          >
                            <Truck className="h-4 w-4" />
                            Track Your Shipment
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </Section>
                </div>
              )}

              {/* ── Items ── */}
              <div className="px-5 py-4">
                <Section icon={Package} title="Items Ordered">
                  <div className="space-y-3">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                          <Image
                            src={item.product_image || "/placeholder.svg"}
                            alt={item.product_title}
                            width={56}
                            height={56}
                            className="h-full w-auto object-contain p-1"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-medium text-foreground">{item.product_title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">Qty: {item.quantity} × {fmt(item.price)}</p>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{fmt(item.subtotal || item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>

              {/* ── Price breakdown ── */}
              <div className="px-5 py-4">
                <Section icon={CreditCard} title="Price Breakdown">
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>{fmt(order.subtotal)}</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span className="flex items-center gap-1">
                            Discount
                            {order.coupon_code && (
                              <span className="inline-flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                <Tag className="h-2.5 w-2.5" />
                                {order.coupon_code}
                              </span>
                            )}
                          </span>
                          <span>−{fmt(order.discount)}</span>
                        </div>
                      )}
                      {order.tax > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Tax</span>
                          <span>{fmt(order.tax)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
                        <span>Total</span>
                        <span>{fmt(order.total)}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                      <CreditCard className="h-3.5 w-3.5 shrink-0" />
                      Payment: <span className="font-medium text-foreground capitalize">
                        {order.payment_method === "cod" ? "Cash on Delivery" : order.payment_method ?? "—"}
                      </span>
                      <span className="ml-auto">
                        <span className={`rounded-full px-2 py-0.5 font-semibold capitalize
                          ${order.payment_status === "paid" ? "bg-emerald-100 text-emerald-700"
                          : order.payment_status === "pending" ? "bg-amber-100 text-amber-700"
                          : "bg-muted text-muted-foreground"}`}>
                          {order.payment_status}
                        </span>
                      </span>
                    </div>
                  </div>
                </Section>
              </div>

              {/* ── Shipping address ── */}
              {order.shipping_address && (
                <div className="px-5 py-4">
                  <Section icon={MapPin} title="Delivery Address">
                    <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm leading-relaxed text-foreground">
                      {order.shipping_address.fullName && (
                        <p className="font-semibold">{order.shipping_address.fullName}</p>
                      )}
                      {order.shipping_address.phone && (
                        <p className="text-muted-foreground">{order.shipping_address.phone}</p>
                      )}
                      <p className="mt-1">
                        {[
                          order.shipping_address.addressLine1,
                          order.shipping_address.addressLine2,
                          order.shipping_address.city,
                          order.shipping_address.state,
                          order.shipping_address.pincode,
                        ].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </Section>
                </div>
              )}

              {/* ── Admin notes ── */}
              {order.admin_notes && (
                <div className="px-5 py-4">
                  <Section icon={FileText} title="Note from Store">
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      {order.admin_notes}
                    </div>
                  </Section>
                </div>
              )}

              {/* ── Cancel order ── */}
              {CANCELLABLE.includes(order.status) && (
                <div className="px-5 py-4">
                  {!showCancelPanel ? (
                    <button
                      onClick={() => setShowCancelPanel(true)}
                      className="w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      Cancel Order
                    </button>
                  ) : (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                        <p className="text-sm font-semibold text-red-700">Cancel this order?</p>
                      </div>
                      <p className="mb-4 text-xs text-red-600">
                        This action cannot be undone. Please select a reason below.
                      </p>

                      {/* Reason selector */}
                      <div className="mb-3 space-y-2">
                        {CANCEL_REASONS.map((r) => (
                          <label key={r} className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
                            <input
                              type="radio"
                              name="cancel-reason"
                              value={r}
                              checked={cancelReason === r}
                              onChange={() => setCancelReason(r)}
                              className="h-4 w-4 accent-red-600"
                            />
                            {r}
                          </label>
                        ))}
                      </div>

                      {/* Free-text for "Other" */}
                      {cancelReason === "Other" && (
                        <textarea
                          value={cancelOther}
                          onChange={(e) => setCancelOther(e.target.value)}
                          placeholder="Please describe your reason…"
                          rows={2}
                          className="mb-3 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-400"
                        />
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowCancelPanel(false)}
                          disabled={cancelling}
                          className="flex-1 rounded-lg border border-border bg-background py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
                        >
                          Keep Order
                        </button>
                        <button
                          onClick={handleCancelConfirm}
                          disabled={cancelling || (cancelReason === "Other" && !cancelOther.trim())}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                        >
                          {cancelling && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                          {cancelling ? "Cancelling…" : "Confirm Cancel"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </aside>
    </>
  )
}
