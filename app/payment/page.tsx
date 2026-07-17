'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

declare global {
  interface Window {
    Razorpay?: any
  }
}

function PaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const orderId = searchParams.get('orderId')
  const razorpayOrderId = searchParams.get('razorpayOrderId')

  useEffect(() => {
    if (!orderId || !razorpayOrderId) {
      setError('Invalid payment session')
      return
    }

    // Load Razorpay script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => {
      setIsLoading(false)
      initiatePayment()
    }
    script.onerror = () => {
      setError('Failed to load payment gateway')
    }
    document.body.appendChild(script)
  }, [orderId, razorpayOrderId])

  const initiatePayment = () => {
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID

    if (!razorpayKeyId || !razorpayOrderId) {
      setError('Payment gateway is not configured.')
      return
    }

    const options = {
      key: razorpayKeyId,
      order_id: razorpayOrderId,
      handler: async (response: any) => {
        await handlePaymentSuccess(response.razorpay_payment_id, razorpayOrderId)
      },
      prefill: {
        name: 'Unaferia Customer',
        email: 'customer@unaferia.app',
        contact: '9876500011',
      },
      theme: {
        color: '#0066cc',
      },
      modal: {
        ondismiss: () => {
          setError('Payment cancelled')
        },
      },
    }

    const razorpay = new window.Razorpay(options)
    razorpay.open()
  }

  const handlePaymentSuccess = async (paymentId: string, rzOrderId: string) => {
    try {
      setIsLoading(true)

      // Verify payment on backend
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_payment_id: paymentId,
          razorpay_order_id: rzOrderId,
          razorpay_signature: 'test_signature', // In production, calculate HMAC
          order_id: orderId,
        }),
      })

      if (!response.ok) {
        throw new Error('Payment verification failed')
      }

      // Redirect to success page
      router.push(`/order-success?orderId=${orderId}`)
    } catch (error) {
      console.error('[v0] Payment success handling error:', error)
      setError('Payment verified but order update failed')
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-bold text-destructive">Payment Error</h1>
        <p className="text-muted-foreground">{error}</p>
        <button
          onClick={() => router.push('/checkout')}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-brand-foreground"
        >
          Back to Checkout
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <Loader2 className="h-8 w-8 animate-spin text-brand" />
      <h1 className="text-2xl font-bold">Processing Payment...</h1>
      <p className="text-muted-foreground">Please wait while we process your payment</p>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <h1 className="text-2xl font-bold">Loading Payment...</h1>
          <p className="text-muted-foreground">Please wait</p>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  )
}
