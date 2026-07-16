"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export type PaymentRow = {
  id: string
  order_id: string
  order_number: string | null
  customer_name: string
  amount: number
  currency: string
  method: string | null
  provider: string | null
  transaction_id: string | null
  status: string
  paid_at: string | null
  created_at: string
}

export type PaymentStats = {
  total_collected: number
  total_pending: number
  total_failed: number
  total_refunded: number
  count_paid: number
  count_pending: number
}

export async function getPayments(): Promise<PaymentRow[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("payments")
    .select("id, order_id, amount, currency, method, provider, transaction_id, status, paid_at, created_at, orders(order_number, shipping_address)")
    .order("created_at", { ascending: false })
    .limit(500)

  if (!data) return []

  return data.map((p: any) => ({
    id: p.id,
    order_id: p.order_id,
    order_number: p.orders?.order_number ?? null,
    customer_name: (p.orders?.shipping_address as { fullName?: string } | null)?.fullName ?? "Guest",
    amount: Number(p.amount) || 0,
    currency: p.currency ?? "INR",
    method: p.method,
    provider: p.provider,
    transaction_id: p.transaction_id,
    status: p.status,
    paid_at: p.paid_at,
    created_at: p.created_at,
  }))
}

export async function getPaymentStats(): Promise<PaymentStats> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("payments")
    .select("amount, status")

  const rows = (data as { amount: number | string; status: string }[]) ?? []

  return {
    total_collected: rows.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.amount), 0),
    total_pending: rows.filter((r) => r.status === "pending").reduce((s, r) => s + Number(r.amount), 0),
    total_failed: rows.filter((r) => r.status === "failed").reduce((s, r) => s + Number(r.amount), 0),
    total_refunded: rows.filter((r) => r.status === "refunded").reduce((s, r) => s + Number(r.amount), 0),
    count_paid: rows.filter((r) => r.status === "paid").length,
    count_pending: rows.filter((r) => r.status === "pending").length,
  }
}
