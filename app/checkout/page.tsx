'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCart } from '@/components/cart-provider'
import { useUser } from '@/hooks/use-user'
import { createOrder } from '@/app/actions/create-order'
import { getUserAddresses } from '@/app/actions/address'
import type { SavedAddress } from '@/app/actions/address'
import { validateCoupon, incrementCouponUsage } from '@/app/actions/coupon'
import type { AppliedCoupon } from '@/app/actions/coupon'
import { checkCodStatus } from '@/app/actions/check-cod-status'
import { ChevronLeft, ChevronRight, Lock, Loader2, CreditCard, Truck, MapPin, Plus, Check, Tag, X, Ban } from 'lucide-react'

type Step = 'address' | 'payment'

export default function CheckoutPage() {
  const { items, subtotal, tax, total, savings, clear } = useCart()
  const { user } = useUser()
  const router = useRouter()

  const [step, setStep] = useState<Step>('address')
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay')
  const [codBlocked, setCodBlocked] = useState(false)

  // Address form state
  const [address, setAddress] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)

  const couponDiscount = appliedCoupon?.discountAmount ?? 0
  const finalTotal = Math.max(0, total - couponDiscount)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError(null)
    const result = await validateCoupon(couponCode, subtotal)
    setCouponLoading(false)
    if (!result.success) {
      setCouponError(result.error)
      return
    }
    setAppliedCoupon({ coupon: result.coupon, discountAmount: result.discountAmount })
    setCouponCode('')
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponError(null)
    setCouponCode('')
  }

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)

  // Fetch COD block status
  useEffect(() => {
    if (!user) return
    checkCodStatus().then(({ blocked }) => {
      setCodBlocked(blocked)
      if (blocked) setPaymentMethod('razorpay')
    })
  }, [user])

  useEffect(() => {
    if (!user) return
    getUserAddresses().then((addrs) => {
      setSavedAddresses(addrs)
      if (addrs.length > 0) {
        // Pre-select the default address and fill the form
        const def = addrs.find((a) => a.isDefault) ?? addrs[0]
        setSelectedSavedId(def.id)
        setAddress({
          fullName: def.fullName,
          phone: def.phone,
          addressLine1: def.addressLine1,
          addressLine2: def.addressLine2,
          city: def.city,
          state: def.state,
          pincode: def.pincode,
        })
      } else {
        setShowNewForm(true)
      }
    })
  }, [user])

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <h1 className="text-2xl font-bold text-foreground">Sign in to checkout</h1>
        <Link href="/login?redirect=/checkout" className="rounded-lg bg-brand px-8 py-3 font-medium text-brand-foreground hover:opacity-90">
          Sign In
        </Link>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <h1 className="text-2xl font-bold text-foreground">Your cart is empty</h1>
        <Link href="/" className="rounded-lg bg-brand px-8 py-3 font-medium text-brand-foreground hover:opacity-90">
          Continue Shopping
        </Link>
      </div>
    )
  }

  const validateAddress = () => {
    const e: Record<string, string> = {}
    if (!address.fullName.trim()) e.fullName = 'Full name is required'
    if (!address.phone.match(/^\d{10}$/)) e.phone = 'Enter a valid 10-digit mobile number'
    if (!address.addressLine1.trim()) e.addressLine1 = 'Address is required'
    if (!address.city.trim()) e.city = 'City is required'
    if (!address.state.trim()) e.state = 'State is required'
    if (!address.pincode.match(/^\d{6}$/)) e.pincode = 'Enter a valid 6-digit pincode'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleContinueToPayment = () => {
    if (validateAddress()) setStep('payment')
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePlaceOrder = async () => {
    setIsLoading(true)
    try {
      const result = await createOrder({
        items: items.map((item) => ({
          productId: item.product.id,
          productTitle: item.product.name,
          productImage: item.product.image,
          price: item.product.price,
          quantity: item.qty,
        })),
        shippingAddress: address,
        paymentMethod,
        subtotal,
        tax,
        total: finalTotal,
        couponCode: appliedCoupon?.coupon.code,
        couponDiscount,
      })

      if (!result.success || !result.orderId) {
        alert(result.error || 'Failed to create order. Please try again.')
        return
      }

      // Increment coupon usage (non-fatal)
      if (appliedCoupon) {
        incrementCouponUsage(appliedCoupon.coupon.id).catch(() => {})
      }

      if (paymentMethod === 'cod') {
        clear()
        router.push(`/order-success?orderId=${result.orderId}`)
        return
      }

      // --- Razorpay ---
      // Load the checkout script if not already present
      if (!(window as any).Razorpay) {
        await new Promise<void>((res, rej) => {
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.async = true
          script.onload = () => res()
          script.onerror = () => rej(new Error('Failed to load Razorpay script'))
          document.body.appendChild(script)
        })
      }

      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      if (!razorpayKey) {
        alert('Payment gateway is not configured.')
        return
      }

      const options = {
        key: razorpayKey,
        order_id: result.razorpayOrderId,
        name: 'Unaferia',
        description: `Order ${result.orderNumber}`,
        amount: Math.round(finalTotal * 100),
        currency: 'INR',
        prefill: {
          name: address.fullName,
          contact: `+91${address.phone}`,
        },
        theme: { color: '#c87a25' },
        handler: async (response: {
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }) => {
          // Verify on the server, then clear cart and redirect
          await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              order_id: result.orderId,
            }),
          })
          clear()
          router.push(`/order-success?orderId=${result.orderId}`)
        },
        modal: {
          // User closed the modal without paying — stay on checkout page
          ondismiss: () => {
            setIsLoading(false)
          },
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', () => {
        alert('Payment failed. Please try again.')
        setIsLoading(false)
      })
      rzp.open()
      // Don't set isLoading=false here; modal is still open
      return
    } catch (err) {
      console.error('[checkout] place order error:', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Steps indicator */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-0 px-4 sm:px-6 lg:px-8">
          {(['address', 'payment'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center">
              {i > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
              <button
                onClick={() => s === 'address' ? setStep('address') : undefined}
                className={`flex items-center gap-2 px-3 py-4 text-sm font-medium transition-colors ${
                  step === s ? 'border-b-2 border-brand text-brand' : 'text-muted-foreground'
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                  step === s ? 'bg-brand text-brand-foreground' : 'bg-muted text-muted-foreground'
                }`}>{i + 1}</span>
                {s === 'address' ? 'Delivery' : 'Payment'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Left: form */}
          <div className="order-2 space-y-6 lg:order-1 lg:col-span-2">

            {/* Step 1 — Address */}
            {step === 'address' && (
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-6 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-brand" aria-hidden="true" />
                  <h2 className="text-lg font-bold text-foreground">Delivery Address</h2>
                </div>

                {/* Saved addresses */}
                {savedAddresses.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <p className="text-sm font-medium text-foreground">Select a saved address</p>

                    {savedAddresses.map((saved) => (
                      <button
                        key={saved.id}
                        type="button"
                        onClick={() => {
                          setSelectedSavedId(saved.id)
                          setShowNewForm(false)
                          setAddress({
                            fullName: saved.fullName,
                            phone: saved.phone,
                            addressLine1: saved.addressLine1,
                            addressLine2: saved.addressLine2,
                            city: saved.city,
                            state: saved.state,
                            pincode: saved.pincode,
                          })
                          setErrors({})
                        }}
                        className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                          selectedSavedId === saved.id && !showNewForm
                            ? 'border-brand bg-brand/5'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                          selectedSavedId === saved.id && !showNewForm
                            ? 'border-brand bg-brand'
                            : 'border-muted-foreground'
                        }`}>
                          {selectedSavedId === saved.id && !showNewForm && (
                            <Check className="h-2.5 w-2.5 text-white" aria-hidden="true" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">{saved.fullName}</p>
                            {saved.isDefault && (
                              <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {saved.addressLine1}
                            {saved.addressLine2 ? `, ${saved.addressLine2}` : ''}, {saved.city}, {saved.state} – {saved.pincode}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">+91 {saved.phone}</p>
                        </div>
                      </button>
                    ))}

                    {/* Add new address toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewForm(true)
                        setSelectedSavedId(null)
                        setAddress({
                          fullName: user?.fullName || '',
                          phone: user?.phone || '',
                          addressLine1: '',
                          addressLine2: '',
                          city: '',
                          state: '',
                          pincode: '',
                        })
                        setErrors({})
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                        showNewForm ? 'border-brand bg-brand/5' : 'border-dashed border-border hover:bg-muted'
                      }`}
                    >
                      <Plus className={`h-4 w-4 shrink-0 ${showNewForm ? 'text-brand' : 'text-muted-foreground'}`} aria-hidden="true" />
                      <span className={`text-sm font-medium ${showNewForm ? 'text-brand' : 'text-muted-foreground'}`}>
                        Add a new address
                      </span>
                    </button>
                  </div>
                )}

                {/* Address form — shown always when no saved, or when adding new */}
                {(showNewForm || savedAddresses.length === 0) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-foreground">Full Name *</label>
                    <input
                      id="fullName"
                      type="text"
                      value={address.fullName}
                      onChange={(e) => setAddress((a) => ({ ...a, fullName: e.target.value }))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                      placeholder="Enter your full name"
                    />
                    {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label htmlFor="phone" className="mb-1 block text-sm font-medium text-foreground">Mobile Number *</label>
                    <div className="flex">
                      <span className="flex items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">+91</span>
                      <input
                        id="phone"
                        type="tel"
                        maxLength={10}
                        value={address.phone}
                        onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value.replace(/\D/g, '') }))}
                        className="flex-1 rounded-r-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                        placeholder="10-digit number"
                      />
                    </div>
                    {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="pincode" className="mb-1 block text-sm font-medium text-foreground">Pincode *</label>
                    <input
                      id="pincode"
                      type="text"
                      maxLength={6}
                      value={address.pincode}
                      onChange={(e) => setAddress((a) => ({ ...a, pincode: e.target.value.replace(/\D/g, '') }))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                      placeholder="6-digit pincode"
                    />
                    {errors.pincode && <p className="mt-1 text-xs text-destructive">{errors.pincode}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="addressLine1" className="mb-1 block text-sm font-medium text-foreground">Address (House No, Street) *</label>
                    <input
                      id="addressLine1"
                      type="text"
                      value={address.addressLine1}
                      onChange={(e) => setAddress((a) => ({ ...a, addressLine1: e.target.value }))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                      placeholder="House no., Street name"
                    />
                    {errors.addressLine1 && <p className="mt-1 text-xs text-destructive">{errors.addressLine1}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="addressLine2" className="mb-1 block text-sm font-medium text-foreground">Area, Colony (optional)</label>
                    <input
                      id="addressLine2"
                      type="text"
                      value={address.addressLine2}
                      onChange={(e) => setAddress((a) => ({ ...a, addressLine2: e.target.value }))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                      placeholder="Area, Colony, Landmark"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="mb-1 block text-sm font-medium text-foreground">City *</label>
                    <input
                      id="city"
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                      placeholder="City"
                    />
                    {errors.city && <p className="mt-1 text-xs text-destructive">{errors.city}</p>}
                  </div>

                  <div>
                    <label htmlFor="state" className="mb-1 block text-sm font-medium text-foreground">State *</label>
                    <select
                      id="state"
                      value={address.state}
                      onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    >
                      <option value="">Select State</option>
                      {['Andhra Pradesh','Assam','Bihar','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {errors.state && <p className="mt-1 text-xs text-destructive">{errors.state}</p>}
                  </div>
                  </div>
                )} {/* end new address form */}

                <button
                  onClick={handleContinueToPayment}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3 font-semibold text-brand-foreground hover:opacity-90"
                >
                  Continue to Payment <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Step 2 — Payment */}
            {step === 'payment' && (
              <div className="space-y-4">
                {/* Address summary */}
                <div className="flex items-start justify-between rounded-xl border border-border bg-card p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Delivering to:</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {address.fullName}, {address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}, {address.city}, {address.state} – {address.pincode}
                    </p>
                  </div>
                  <button onClick={() => setStep('address')} className="ml-4 shrink-0 text-sm font-medium text-brand hover:underline">
                    Change
                  </button>
                </div>

                {/* Payment methods */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-brand" aria-hidden="true" />
                    <h2 className="text-lg font-bold text-foreground">Payment Method</h2>
                  </div>

                  <div className="space-y-3">
                    <label className={`flex cursor-pointer gap-4 rounded-xl border-2 p-4 transition-colors ${paymentMethod === 'razorpay' ? 'border-brand bg-brand/5' : 'border-border hover:bg-muted'}`}>
                      <input
                        type="radio"
                        name="payment"
                        value="razorpay"
                        checked={paymentMethod === 'razorpay'}
                        onChange={() => setPaymentMethod('razorpay')}
                        className="mt-0.5 accent-brand"
                      />
                      <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-foreground text-sm sm:text-base">UPI / Cards / Netbanking / Wallets</p>
                          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">Powered by Razorpay — 100% secure</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {['Visa', 'MC', 'UPI'].map((b) => (
                            <span key={b} className="rounded border border-border bg-white px-1.5 py-0.5 text-xs font-semibold text-foreground">{b}</span>
                          ))}
                        </div>
                      </div>
                    </label>

                    {codBlocked ? (
                      <div className="flex items-start gap-4 rounded-xl border-2 border-dashed border-destructive/30 bg-destructive/5 p-4 opacity-80">
                        <Ban className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
                        <div>
                          <p className="font-semibold text-destructive">Cash on Delivery — Unavailable</p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            COD has been disabled for your account because a previous COD order was cancelled.
                            Please pay online to continue.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <label className={`flex cursor-pointer gap-4 rounded-xl border-2 p-4 transition-colors ${paymentMethod === 'cod' ? 'border-brand bg-brand/5' : 'border-border hover:bg-muted'}`}>
                        <input
                          type="radio"
                          name="payment"
                          value="cod"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          className="mt-0.5 accent-brand"
                        />
                        <div>
                          <p className="font-semibold text-foreground">Cash on Delivery</p>
                          <p className="mt-0.5 text-sm text-muted-foreground">Pay when your order is delivered</p>
                        </div>
                      </label>
                    )}
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={isLoading}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3.5 font-bold text-brand-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Processing...</>
                    ) : (
                      `Place Order · ₹${finalTotal.toLocaleString('en-IN')}`
                    )}
                  </button>

                  <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" aria-hidden="true" /> Your payment information is encrypted and secure
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: order summary — shown first on mobile */}
          <div className="order-1 h-fit rounded-xl border border-border bg-card p-4 sm:p-6 lg:order-2 lg:sticky lg:top-4">
            <h2 className="text-base font-bold text-foreground">Order Summary</h2>
            <p className="text-sm text-muted-foreground">{items.reduce((s, i) => s + i.qty, 0)} items</p>

            <div className="mt-4 max-h-60 space-y-3 overflow-y-auto">
              {items.map(({ product, qty }) => (
                <div key={product.id} className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    <Image src={product.image} alt={product.name} width={48} height={48} className="h-full w-full object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {qty}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">₹{(product.price * qty).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            {/* Coupon input */}
            <div className="mt-4 border-t border-border pt-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-green-600" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-semibold text-green-700">{appliedCoupon.coupon.code} applied</p>
                      <p className="text-xs text-green-600">− ₹{appliedCoupon.discountAmount.toLocaleString('en-IN')} discount</p>
                    </div>
                  </div>
                  <button onClick={handleRemoveCoupon} aria-label="Remove coupon" className="ml-2 text-green-600 hover:text-green-800">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null) }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleApplyCoupon() }}
                      placeholder="Enter coupon code"
                      className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      {couponLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Tag className="h-3.5 w-3.5" />}
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-destructive">{couponError}</p>}
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">MRP Total</span>
                <span>₹{(subtotal + savings).toLocaleString('en-IN')}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product Discount</span>
                  <span className="text-green-600">− ₹{savings.toLocaleString('en-IN')}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coupon ({appliedCoupon?.coupon.code})</span>
                  <span className="text-green-600">− ₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-green-600">FREE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST (18%)</span>
                <span>₹{tax.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-bold">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">₹{finalTotal.toLocaleString('en-IN')}</span>
            </div>

            {(savings > 0 || couponDiscount > 0) && (
              <p className="mt-2 text-xs font-medium text-green-600">
                You save ₹{(savings + couponDiscount).toLocaleString('en-IN')} on this order!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
