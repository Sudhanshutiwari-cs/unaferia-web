'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Package, Loader2, Home, ShoppingBag, Truck, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Order {
  id: string
  order_number: string
  total: number
  payment_method: string
  status: string
  created_at: string
  tracking_carrier: string | null
  tracking_number: string | null
  tracking_url: string | null
  estimated_delivery: string | null
}

// Inner component calls useSearchParams() — must be inside <Suspense>
function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!orderId) { setIsLoading(false); return }

    const fetchOrder = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, total, payment_method, status, created_at, tracking_carrier, tracking_number, tracking_url, estimated_delivery')
        .eq('id', orderId)
        .single()
      setOrder(data ?? null)
      setIsLoading(false)
    }

    const t = setTimeout(fetchOrder, 800)
    return () => clearTimeout(t)
  }, [orderId])

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand" />
        <p className="text-lg font-medium text-foreground">Confirming your order…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          {/* Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-11 w-11 text-green-600" aria-hidden="true" />
          </div>

          <h1 className="mt-6 text-2xl font-bold text-foreground">Order Placed Successfully!</h1>
          <p className="mt-2 text-muted-foreground">
            {order?.payment_method === 'cod'
              ? 'Your order is confirmed. Pay when it arrives at your door.'
              : 'Thank you! Your payment was received and order is confirmed.'}
          </p>

          {order && (
            <div className="mt-8 space-y-3 rounded-xl border border-border bg-muted/40 p-5 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order Number</span>
                <span className="font-bold text-foreground">{order.order_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-bold text-foreground">₹{Number(order.total).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment</span>
                <span className="font-bold text-foreground">
                  {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online (Razorpay)'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order Date</span>
                <span className="font-bold text-foreground">
                  {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          )}

          {/* Tracking card — shown once admin adds tracking info */}
          {order && (order.tracking_number || order.tracking_carrier || order.tracking_url) && (
            <div className="mt-6 overflow-hidden rounded-xl border border-brand/20 bg-brand/5 text-left">
              <div className="flex items-center gap-2 border-b border-brand/10 px-4 py-3">
                <Truck className="h-4 w-4 text-brand" aria-hidden="true" />
                <span className="text-sm font-semibold text-foreground">Your Shipment is on the Way</span>
              </div>
              <div className="grid grid-cols-2 gap-3 px-4 py-3">
                {order.tracking_carrier && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Carrier</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">{order.tracking_carrier}</p>
                  </div>
                )}
                {order.tracking_number && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">AWB / Tracking</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">{order.tracking_number}</p>
                  </div>
                )}
                {order.estimated_delivery && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Est. Delivery</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {new Date(order.estimated_delivery).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
              {order.tracking_url && (
                <div className="border-t border-brand/10 px-4 py-3">
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                  >
                    <Truck className="h-4 w-4" />
                    Track Your Shipment
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* What's next */}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-left">
            <Package className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
            <div>
              <p className="font-medium text-foreground">What happens next?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We&apos;ll confirm your order within 2–4 hours and send you an SMS with the tracking link.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-3 font-medium text-foreground hover:bg-muted"
            >
              <Home className="h-4 w-4" aria-hidden="true" /> Continue Shopping
            </Link>
            <Link
              href="/orders"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand py-3 font-medium text-brand-foreground hover:opacity-90"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" /> My Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Wrap with Suspense so Next.js can statically prerender the shell while
// the inner component reads dynamic search params at runtime.
export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
          <Loader2 className="h-10 w-10 animate-spin text-brand" />
          <p className="text-lg font-medium text-foreground">Confirming your order…</p>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  )
}
