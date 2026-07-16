import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import type {
  Stat,
  Order,
  OrderStatus,
  TopProduct,
  SalesPoint,
  StatusSlice,
  Customer,
} from "@/lib/admin-data"

function toNum(v: unknown): number {
  if (v === null || v === undefined) return 0
  return typeof v === "number" ? v : Number(v)
}

// Map the DB's lowercase status set onto the 4 display statuses the UI renders.
function displayStatus(dbStatus: string): OrderStatus {
  switch (dbStatus) {
    case "delivered":
      return "Delivered"
    case "shipped":
      return "Shipped"
    case "cancelled":
      return "Cancelled"
    default:
      return "Processing" // pending, confirmed, processing
  }
}

type OrderRow = {
  id: string
  order_number: string | null
  total: number | string
  status: string
  created_at: string
  user_id: string | null
  shipping_address: { fullName?: string } | null
  order_items: { quantity: number }[] | null
}

const ORDER_SELECT =
  "id, order_number, total, status, created_at, user_id, shipping_address, order_items(quantity)"

function mapOrder(row: OrderRow): Order {
  const items = (row.order_items ?? []).reduce((s, i) => s + (i.quantity ?? 0), 0)
  return {
    id: row.order_number || row.id.slice(0, 8).toUpperCase(),
    customer: row.shipping_address?.fullName || "Guest",
    date: row.created_at.slice(0, 10),
    items,
    total: toNum(row.total),
    status: displayStatus(row.status),
  }
}

// All orders for the admin Orders table (newest first).
export async function getAdminOrders(): Promise<Order[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false })

  if (error || !data) {
    console.log("[v0] getAdminOrders error:", error?.message)
    return []
  }
  return (data as OrderRow[]).map(mapOrder)
}

// Dashboard KPI cards.
export async function getDashboardStats(): Promise<Stat[]> {
  const supabase = createAdminClient()

  const [ordersRes, productsRes, customersRes] = await Promise.all([
    supabase.from("orders").select("total, status"),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_admin", false),
  ])

  const orders = (ordersRes.data as { total: number | string; status: string }[]) ?? []
  const totalOrders = orders.length
  const totalSales = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + toNum(o.total), 0)
  const totalProducts = productsRes.count ?? 0
  const totalCustomers = customersRes.count ?? 0

  return [
    { label: "Total Orders", value: totalOrders.toLocaleString("en-IN"), change: "Live", trend: "up", icon: "orders", accent: "purple" },
    { label: "Total Sales", value: "₹" + totalSales.toLocaleString("en-IN"), change: "Live", trend: "up", icon: "sales", accent: "green" },
    { label: "Total Customers", value: totalCustomers.toLocaleString("en-IN"), change: "Live", trend: "up", icon: "customers", accent: "orange" },
    { label: "Total Products", value: totalProducts.toLocaleString("en-IN"), change: "Live", trend: "up", icon: "products", accent: "blue" },
  ]
}

// Top selling products by total_sales.
export async function getTopProducts(): Promise<TopProduct[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("products")
    .select("title, thumbnail, price, total_sales")
    .order("total_sales", { ascending: false })
    .limit(5)

  if (error || !data) return []
  return data.map((p) => ({
    name: p.title as string,
    image: (p.thumbnail as string) || "/placeholder.svg",
    sales: toNum(p.total_sales),
    amount: toNum(p.total_sales) * toNum(p.price),
  }))
}

// Sales for the last 7 days (for the line chart).
export async function getSalesSeries(): Promise<SalesPoint[]> {
  const supabase = createAdminClient()
  const since = new Date()
  since.setDate(since.getDate() - 6)
  since.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from("orders")
    .select("total, created_at, status")
    .gte("created_at", since.toISOString())

  const rows = (data as { total: number | string; created_at: string; status: string }[]) ?? []

  const days: SalesPoint[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(since)
    d.setDate(since.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const value = rows
      .filter((r) => r.status !== "cancelled" && r.created_at.slice(0, 10) === key)
      .reduce((s, r) => s + toNum(r.total), 0)
    days.push({ label, value })
  }
  return days
}

// Order-status breakdown for the donut chart.
export async function getStatusBreakdown(): Promise<StatusSlice[]> {
  const supabase = createAdminClient()
  const { data } = await supabase.from("orders").select("status")
  const rows = (data as { status: string }[]) ?? []
  const total = rows.length || 1

  const config: { status: OrderStatus; color: string }[] = [
    { status: "Delivered", color: "#2563eb" },
    { status: "Processing", color: "#f59e0b" },
    { status: "Shipped", color: "#22c55e" },
    { status: "Cancelled", color: "#ef4444" },
  ]

  return config.map(({ status, color }) => {
    const count = rows.filter((r) => displayStatus(r.status) === status).length
    return { status, count, percent: Math.round((count / total) * 100), color }
  })
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export type RevenueByMonth = { month: string; revenue: number; orders: number }
export type CategoryRevenue = { category: string; revenue: number; count: number }
export type TopCustomer = { name: string; email: string; orders: number; spent: number }

export async function getMonthlyRevenue(): Promise<RevenueByMonth[]> {
  const supabase = createAdminClient()
  const since = new Date()
  since.setMonth(since.getMonth() - 5)
  since.setDate(1)
  since.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from("orders")
    .select("total, created_at, status")
    .gte("created_at", since.toISOString())

  const rows = (data as { total: number | string; created_at: string; status: string }[]) ?? []
  const months: RevenueByMonth[] = []

  for (let i = 0; i < 6; i++) {
    const d = new Date(since)
    d.setMonth(since.getMonth() + i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    const matched = rows.filter((r) => r.status !== "cancelled" && r.created_at.startsWith(key))
    months.push({ month: label, revenue: matched.reduce((s, r) => s + toNum(r.total), 0), orders: matched.length })
  }
  return months
}

export async function getCategoryRevenue(): Promise<CategoryRevenue[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("order_items")
    .select("price, quantity, product_id, products(category)")
    .limit(5000)

  const rows = (data as unknown as { price: number; quantity: number; products: { category: string } | null }[]) ?? []
  const map = new Map<string, { revenue: number; count: number }>()
  for (const r of rows) {
    const cat = (r.products?.category ?? "Other").trim() || "Other"
    const cur = map.get(cat) ?? { revenue: 0, count: 0 }
    map.set(cat, { revenue: cur.revenue + toNum(r.price) * toNum(r.quantity), count: cur.count + toNum(r.quantity) })
  }
  return Array.from(map.entries())
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
}

export async function getTopCustomers(): Promise<TopCustomer[]> {
  const supabase = createAdminClient()
  const [profilesRes, ordersRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email").eq("is_admin", false),
    supabase.from("orders").select("user_id, total, status"),
  ])
  const profiles = (profilesRes.data as { id: string; full_name: string | null; email: string | null }[]) ?? []
  const orders = (ordersRes.data as { user_id: string | null; total: number | string; status: string }[]) ?? []

  return profiles
    .map((p) => {
      const own = orders.filter((o) => o.user_id === p.id && o.status !== "cancelled")
      return { name: p.full_name || "Customer", email: p.email || "—", orders: own.length, spent: own.reduce((s, o) => s + toNum(o.total), 0) }
    })
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 10)
}

// Customer list with aggregated order counts and spend.
export async function getAdminCustomers(): Promise<Customer[]> {
  const supabase = createAdminClient()

  const [profilesRes, ordersRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, phone, created_at").eq("is_admin", false).order("created_at", { ascending: false }),
    supabase.from("orders").select("user_id, total, status"),
  ])

  const profiles = (profilesRes.data as { id: string; full_name: string | null; email: string | null; phone: string | null; created_at: string }[]) ?? []
  const orders = (ordersRes.data as { user_id: string | null; total: number | string; status: string }[]) ?? []

  return profiles.map((p) => {
    const own = orders.filter((o) => o.user_id === p.id && o.status !== "cancelled")
    return {
      id: p.id.slice(0, 8).toUpperCase(),
      name: p.full_name || "Customer",
      email: p.email || p.phone || "—",
      orders: own.length,
      spent: own.reduce((s, o) => s + toNum(o.total), 0),
      joined: p.created_at.slice(0, 10),
    }
  })
}
