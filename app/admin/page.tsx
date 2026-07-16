import Image from "next/image"
import Link from "next/link"
import { ShoppingBag, IndianRupee, Users, Package, TrendingUp } from "lucide-react"
import { AdminShell } from "@/components/admin/admin-shell"
import { SalesChart } from "@/components/admin/sales-chart"
import { OrderStatusChart } from "@/components/admin/order-status-chart"
import { StatusBadge } from "@/components/admin/status-badge"
import { type StatAccent, type StatIcon } from "@/lib/admin-data"
import {
  getDashboardStats,
  getAdminOrders,
  getTopProducts,
  getSalesSeries,
  getStatusBreakdown,
} from "@/lib/admin-queries"

const iconMap: Record<StatIcon, typeof ShoppingBag> = {
  orders: ShoppingBag,
  sales: IndianRupee,
  customers: Users,
  products: Package,
}

const accentMap: Record<StatAccent, string> = {
  purple: "bg-violet-100 text-violet-600",
  green: "bg-emerald-100 text-emerald-600",
  orange: "bg-orange-100 text-orange-600",
  blue: "bg-blue-100 text-blue-600",
}

export const dynamic = "force-dynamic"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default async function AdminDashboardPage() {
  const [dashboardStats, orders, topProducts, salesSeries, statusBreakdown] = await Promise.all([
    getDashboardStats(),
    getAdminOrders(),
    getTopProducts(),
    getSalesSeries(),
    getStatusBreakdown(),
  ])
  const recentOrders = orders.slice(0, 5)

  return (
    <AdminShell title="Dashboard">
      <div className="flex flex-col gap-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardStats.map((stat) => {
            const Icon = iconMap[stat.icon]
            return (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-4">
                  <span className={`flex size-12 shrink-0 items-center justify-center rounded-full ${accentMap[stat.accent]}`}>
                    <Icon className="size-6" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-0.5 truncate text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs">
                  <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600">
                    <TrendingUp className="size-3.5" />
                    {stat.change}
                  </span>
                  <span className="text-muted-foreground">vs last week</span>
                </p>
              </div>
            )
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <SalesChart data={salesSeries} />
          <OrderStatusChart data={statusBreakdown} />
        </div>

        {/* Recent orders + top selling */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Recent Orders */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
              <Link href="/admin/orders" className="text-sm font-medium text-link hover:underline">
                View All
              </Link>
            </div>

            {/* Mobile cards */}
            <div className="mt-4 flex flex-col gap-2 sm:hidden">
              {recentOrders.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No orders yet.</p>
              ) : recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">#{order.id}</p>
                    <p className="text-sm font-medium text-foreground">{order.customer}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.date)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold text-foreground">₹{order.total.toLocaleString("en-IN")}</span>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="mt-4 hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[440px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Order ID</th>
                    <th className="pb-3 pr-4 font-medium">Customer</th>
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 pr-4 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="py-3 pr-4 font-medium text-foreground">#{order.id}</td>
                      <td className="py-3 pr-4 text-foreground">{order.customer}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{formatDate(order.date)}</td>
                      <td className="py-3 pr-4 font-medium text-foreground">₹{order.total.toLocaleString("en-IN")}</td>
                      <td className="py-3">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                        No orders yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Top Selling Products</h2>
              <Link href="/admin/products" className="text-sm font-medium text-link hover:underline">
                View All
              </Link>
            </div>

            {/* Mobile cards */}
            <div className="mt-4 flex flex-col gap-2 sm:hidden">
              {topProducts.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No products yet.</p>
              ) : topProducts.map((product) => (
                <div key={product.name} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                  <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                    <Image src={product.image || "/placeholder.svg"} alt={product.name} width={40} height={40} className="size-8 object-contain" />
                  </span>
                  <p className="flex-1 truncate text-sm font-medium text-foreground">{product.name}</p>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-foreground">₹{product.amount.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-muted-foreground">{product.sales} sales</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="mt-4 hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[360px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Product</th>
                    <th className="pb-3 pr-4 text-right font-medium">Sales</th>
                    <th className="pb-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topProducts.map((product) => (
                    <tr key={product.name}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                            <Image
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="size-8 object-contain"
                            />
                          </span>
                          <span className="font-medium text-foreground">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right text-muted-foreground">{product.sales}</td>
                      <td className="py-3 text-right font-medium text-foreground">
                        ₹{product.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                  {topProducts.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                        No products yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
