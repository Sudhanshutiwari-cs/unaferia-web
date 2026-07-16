import Link from "next/link"
import { TrendingUp, ShoppingBag, Users, Package, IndianRupee } from "lucide-react"
import { AdminShell } from "@/components/admin/admin-shell"
import { SalesChart } from "@/components/admin/sales-chart"
import { OrderStatusChart } from "@/components/admin/order-status-chart"
import {
  getDashboardStats,
  getSalesSeries,
  getStatusBreakdown,
  getMonthlyRevenue,
  getCategoryRevenue,
  getTopCustomers,
} from "@/lib/admin-queries"

export const dynamic = "force-dynamic"
export const metadata = { title: "Reports & Analytics — Admin" }

const STAT_ICONS = { orders: ShoppingBag, sales: IndianRupee, customers: Users, products: Package }

export default async function AdminAnalyticsPage() {
  const [dashboardStats, salesSeries, statusBreakdown, monthly, catRevenue, topCustomers] =
    await Promise.all([
      getDashboardStats(),
      getSalesSeries(),
      getStatusBreakdown(),
      getMonthlyRevenue(),
      getCategoryRevenue(),
      getTopCustomers(),
    ])

  const maxRevenue = Math.max(...monthly.map((m) => m.revenue), 1)
  const maxCat = Math.max(...catRevenue.map((c) => c.revenue), 1)

  return (
    <AdminShell title="Reports & Analytics">
      <div className="flex flex-col gap-6">

        {/* KPI cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardStats.map((stat) => {
            const Icon = STAT_ICONS[stat.icon as keyof typeof STAT_ICONS] ?? Package
            return (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-5 text-muted-foreground" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <SalesChart data={salesSeries} />
          <OrderStatusChart data={statusBreakdown} />
        </div>

        {/* Monthly revenue bar chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-base font-semibold text-foreground">Monthly Revenue (Last 6 Months)</h2>
          <div className="flex h-40 items-end gap-3">
            {monthly.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-foreground">
                  {m.revenue > 0 ? `₹${(m.revenue / 1000).toFixed(0)}k` : ""}
                </span>
                <div
                  className="w-full rounded-t-md bg-brand transition-all"
                  style={{ height: `${Math.max((m.revenue / maxRevenue) * 120, 4)}px` }}
                />
                <span className="text-[10px] text-muted-foreground">{m.month}</span>
                <span className="text-[9px] text-muted-foreground">{m.orders} orders</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category revenue + Top customers */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

          {/* Category revenue */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-base font-semibold text-foreground">Revenue by Category</h2>
            <div className="flex flex-col gap-3">
              {catRevenue.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No data yet.</p>
              ) : catRevenue.map((c) => (
                <div key={c.category}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{c.category}</span>
                    <span className="text-muted-foreground">₹{c.revenue.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${(c.revenue / maxCat) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top customers */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Top Customers</h2>
              <Link href="/admin/customers" className="text-xs font-medium text-link hover:underline">View All</Link>
            </div>
            <div className="flex flex-col gap-2">
              {topCustomers.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No customers yet.</p>
              ) : topCustomers.map((c, i) => (
                <div key={c.email} className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-muted/50">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-foreground">₹{c.spent.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-muted-foreground">{c.orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AdminShell>
  )
}
