'use client'

import { useEffect, useRef, useState } from 'react'
import {
  X, Loader2, Check, ExternalLink, Truck, User, MapPin,
  Package, AlertCircle, ChevronRight,
} from 'lucide-react'
import { getOrderDetail, processOrder } from '@/app/actions/admin-order'
import type { OrderDetail, OrderDetailStatus } from '@/app/actions/admin-order'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  orderId: string | null
  onClose: () => void
  onSaved?: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_FLOW: { value: OrderDetailStatus; label: string }[] = [
  { value: 'pending',    label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped',    label: 'Shipped' },
  { value: 'delivered',  label: 'Delivered' },
]

const ALL_STATUSES: { value: OrderDetailStatus; label: string; color: string }[] = [
  { value: 'pending',    label: 'Pending',    color: 'text-amber-500' },
  { value: 'processing', label: 'Processing', color: 'text-blue-500' },
  { value: 'shipped',    label: 'Shipped',    color: 'text-indigo-500' },
  { value: 'delivered',  label: 'Delivered',  color: 'text-emerald-500' },
  { value: 'cancelled',  label: 'Cancelled',  color: 'text-red-500' },
  { value: 'refunded',   label: 'Refunded',   color: 'text-rose-400' },
]

const CARRIERS = [
  'BlueDart', 'DTDC', 'Delhivery', 'Ecom Express',
  'FedEx', 'India Post', 'Shadowfax', 'Xpressbees',
  'Ekart', 'Shiprocket', 'Other',
]

function statusFlowIndex(status: OrderDetailStatus): number {
  return STATUS_FLOW.findIndex((s) => s.value === status)
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatINR(v: number) {
  return '₹' + Number(v).toLocaleString('en-IN')
}

function initials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition ' +
        'placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/20 ' +
        (props.className ?? '')
      }
    />
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={
        'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition ' +
        'placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none ' +
        (props.className ?? '')
      }
    />
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OrderProcessDrawer({ orderId, onClose, onSaved }: Props) {
  const [order, setOrder]           = useState<OrderDetail | null>(null)
  const [loading, setLoading]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState(false)

  // Form state
  const [status, setStatus]         = useState<OrderDetailStatus>('pending')
  const [carrier, setCarrier]       = useState('')
  const [trackingNum, setTrackingNum] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [estDelivery, setEstDelivery] = useState('')
  const [payStatus, setPayStatus]   = useState('pending')
  const [adminNotes, setAdminNotes] = useState('')

  const drawerRef = useRef<HTMLDivElement>(null)

  // Load order detail
  useEffect(() => {
    if (!orderId) { setOrder(null); return }
    setLoading(true)
    setError(null)
    setSuccess(false)
    getOrderDetail(orderId).then((data) => {
      if (!data) { setError('Order not found.'); setLoading(false); return }
      setOrder(data)
      setStatus(data.status)
      setCarrier(data.tracking_carrier ?? '')
      setTrackingNum(data.tracking_number ?? '')
      setTrackingUrl(data.tracking_url ?? '')
      setEstDelivery(data.estimated_delivery ?? '')
      setPayStatus(data.payment_status)
      setAdminNotes(data.admin_notes ?? '')
      setLoading(false)
    })
  }, [orderId])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSave() {
    if (!orderId) return
    setSaving(true)
    setError(null)
    const result = await processOrder({
      orderId,
      status,
      trackingCarrier: carrier,
      trackingNumber: trackingNum,
      trackingUrl,
      estimatedDelivery: estDelivery,
      adminNotes,
      paymentStatus: payStatus,
    })
    setSaving(false)
    if (!result.ok) { setError(result.error ?? 'Failed to save.'); toast.error(result.error ?? 'Failed to save order.'); return }
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2500)
    toast.success('Order updated')
    onSaved?.()
  }

  if (!orderId) return null

  const flowIdx = statusFlowIndex(status)

  const shippingAddr = order?.shipping_address
  const addrLine = shippingAddr
    ? [
        shippingAddr.addressLine1,
        shippingAddr.addressLine2,
        shippingAddr.city,
        shippingAddr.state,
        shippingAddr.pincode,
      ].filter(Boolean).join(', ')
    : null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Process order"
        className="fixed inset-0 z-50 flex flex-col bg-background md:inset-y-0 md:right-0 md:left-auto md:w-[860px] md:shadow-2xl"
      >
        {/* ── Top bar ── */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-foreground sm:text-lg">
              {order ? `Order #${order.order_number}` : 'Loading…'}
            </h2>
            {order && (
              <p className="text-xs text-muted-foreground">{formatDate(order.placed_at ?? order.created_at)}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading || !order}
              className="flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground shadow transition hover:opacity-90 disabled:opacity-60 sm:px-5"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : success ? (
                <Check className="h-4 w-4" />
              ) : null}
              <span className="hidden sm:inline">{saving ? 'Saving…' : success ? 'Saved!' : 'Save Changes'}</span>
              <span className="sm:hidden">{saving ? 'Saving…' : success ? 'Saved!' : 'Save'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : error && !order ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        ) : order ? (
          <div className="flex flex-1 overflow-hidden">
            {/* ── Left sidebar ── */}
            <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-border p-5 md:flex md:flex-col md:gap-6">

              {/* Progress timeline */}
              <div>
                <SectionLabel>Order Progress</SectionLabel>
                <div className="mt-3 flex flex-col gap-0">
                  {STATUS_FLOW.map((step, i) => {
                    const done    = i < flowIdx
                    const current = i === flowIdx && !['cancelled','refunded'].includes(status)
                    const future  = i > flowIdx

                    return (
                      <div key={step.value} className="flex items-start gap-3">
                        {/* Connector line + dot */}
                        <div className="flex flex-col items-center">
                          <div
                            className={
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ' +
                              (done || current
                                ? 'bg-brand text-brand-foreground'
                                : 'border-2 border-border text-muted-foreground')
                            }
                          >
                            {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                          </div>
                          {i < STATUS_FLOW.length - 1 && (
                            <div className={
                              'w-0.5 flex-1 min-h-[20px] ' +
                              (done ? 'bg-brand' : 'bg-border')
                            } />
                          )}
                        </div>
                        <div className="pb-4 pt-1">
                          <p className={
                            'text-sm font-semibold ' +
                            (current ? 'text-brand' : done ? 'text-foreground' : 'text-muted-foreground')
                          }>
                            {step.label}
                          </p>
                          {current && <p className="text-xs text-muted-foreground">Current status</p>}
                        </div>
                      </div>
                    )
                  })}
                  {/* Cancelled / Refunded indicator */}
                  {(status === 'cancelled' || status === 'refunded') && (
                    <div className="mt-1 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <p className="text-xs font-semibold capitalize text-red-600">{status}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer info */}
              <div>
                <SectionLabel>Customer</SectionLabel>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                    {initials(order.customer?.full_name ?? order.shipping_address?.fullName ?? null)}
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {order.customer?.full_name || order.shipping_address?.fullName || 'Guest'}
                  </p>
                </div>
                <div className="mt-2 flex flex-col gap-1.5 pl-1">
                  {order.customer?.email && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{order.customer.email}</span>
                    </div>
                  )}
                  {(order.customer?.phone || order.shipping_address?.phone) && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                      <span>{order.customer?.phone || order.shipping_address?.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Ship to */}
              {addrLine && (
                <div>
                  <SectionLabel>Ship To</SectionLabel>
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{addrLine}</span>
                  </div>
                </div>
              )}

              {/* Order summary */}
              <div>
                <SectionLabel>Order Summary</SectionLabel>
                <div className="mt-2 flex flex-col gap-1 text-xs">
                  {[
                    { label: 'Subtotal',  value: formatINR(order.subtotal) },
                    { label: 'Discount',  value: order.discount > 0 ? `−${formatINR(order.discount)}` : '—' },
                    { label: 'Tax',       value: order.tax > 0 ? formatINR(order.tax) : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-foreground">{value}</span>
                    </div>
                  ))}
                  <div className="mt-1 flex justify-between border-t border-border pt-1 text-sm font-bold">
                    <span>Total</span>
                    <span className="text-foreground">{formatINR(order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <SectionLabel>Items ({order.order_items.length})</SectionLabel>
                <div className="mt-2 flex flex-col gap-2">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_title}
                          className="h-9 w-9 shrink-0 rounded border border-border object-contain p-0.5"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-border bg-muted">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-xs font-medium text-foreground">{item.product_title}</p>
                        <p className="text-xs text-muted-foreground">Qty {item.quantity} · {formatINR(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* ── Main content ── */}
            <main className="flex-1 overflow-y-auto p-5">
              <div className="mx-auto max-w-xl space-y-8">

                {/* Error banner */}
                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                {/* ── Order Status ── */}
                <section>
                  <h3 className="text-base font-bold text-foreground">Order Status</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">Update the fulfilment status of this order.</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {ALL_STATUSES.map((s) => {
                      const active = status === s.value
                      return (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setStatus(s.value)}
                          className={
                            'flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition ' +
                            (active
                              ? 'border-brand bg-brand/5 text-brand shadow-sm'
                              : 'border-border bg-background text-foreground hover:border-brand/50 hover:bg-muted/60')
                          }
                        >
                          <span className={
                            'h-2.5 w-2.5 shrink-0 rounded-full ' +
                            (active ? 'bg-brand' : 'bg-muted-foreground/40')
                          } />
                          {s.label}
                        </button>
                      )
                    })}
                  </div>
                </section>

                {/* ── Shipping & Tracking ── */}
                <section>
                  <h3 className="text-base font-bold text-foreground">Shipping &amp; Tracking</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Provide courier and tracking details so the customer can follow their shipment.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Courier / Carrier">
                      <select
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                      >
                        <option value="">Select carrier…</option>
                        {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="Tracking ID / AWB Number">
                      <Input
                        value={trackingNum}
                        onChange={(e) => setTrackingNum(e.target.value)}
                        placeholder="e.g. 96322158"
                      />
                    </Field>
                  </div>

                  <div className="mt-4">
                    <Field label="Tracking URL">
                      <div className="relative">
                        <Input
                          value={trackingUrl}
                          onChange={(e) => setTrackingUrl(e.target.value)}
                          placeholder="https://track.dtdc.com/…"
                          className="pr-10"
                        />
                        {trackingUrl && (
                          <a
                            href={/^https?:\/\//i.test(trackingUrl) ? trackingUrl : `https://${trackingUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand"
                            aria-label="Open tracking URL"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      {trackingUrl && (
                        <a
                          href={/^https?:\/\//i.test(trackingUrl) ? trackingUrl : `https://${trackingUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 block text-xs text-brand hover:underline truncate"
                        >
                          {trackingUrl}
                        </a>
                      )}
                    </Field>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Estimated Delivery Date">
                      <Input
                        type="date"
                        value={estDelivery}
                        onChange={(e) => setEstDelivery(e.target.value)}
                      />
                    </Field>
                    <Field label="Payment Method">
                      <div className="flex items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 py-2 text-sm text-foreground">
                        <span>₹</span>
                        <span className="flex-1">
                          {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online (Razorpay)'}
                        </span>
                        <select
                          value={payStatus}
                          onChange={(e) => setPayStatus(e.target.value)}
                          className="rounded px-1.5 py-0.5 text-xs font-semibold outline-none
                            bg-amber-100 text-amber-700 border-0 focus:ring-0 cursor-pointer"
                        >
                          <option value="pending">pending</option>
                          <option value="paid">paid</option>
                          <option value="failed">failed</option>
                          <option value="refunded">refunded</option>
                        </select>
                      </div>
                    </Field>
                  </div>

                  {/* Tracking preview */}
                  {(carrier || trackingNum) && (
                    <div className="mt-4 rounded-xl border border-brand/20 bg-brand/5 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-brand" />
                          <p className="text-sm font-semibold text-foreground">Tracking Info Preview</p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                          What customer will see
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                        <div>
                          <p className="text-muted-foreground">Carrier</p>
                          <p className="font-semibold text-foreground">{carrier || '—'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">AWB / Tracking</p>
                          <p className="font-semibold text-foreground">{trackingNum || '—'}</p>
                        </div>
                        {trackingUrl && (
                          <div className="col-span-2">
                            <p className="text-muted-foreground">Track Link</p>
                            <a
                              href={/^https?:\/\//i.test(trackingUrl) ? trackingUrl : `https://${trackingUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 font-semibold text-brand hover:underline"
                            >
                              Open tracking <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </section>

                {/* ── Internal Notes ── */}
                <section>
                  <h3 className="text-base font-bold text-foreground">Internal Notes</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Private notes for your team — not visible to the customer.
                  </p>
                  <div className="mt-4">
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={4}
                      placeholder="e.g. Customer called to change delivery time. Handle with care."
                    />
                  </div>
                </section>

              </div>
            </main>
          </div>
        ) : null}
      </div>
    </>
  )
}
