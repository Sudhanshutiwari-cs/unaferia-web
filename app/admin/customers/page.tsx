import { AdminShell } from "@/components/admin/admin-shell"
import { getAdminCustomers } from "@/lib/admin-queries"

export const dynamic = "force-dynamic"

export default async function AdminCustomersPage() {
  const customers = await getAdminCustomers()

  return (
    <AdminShell title="Customers">
      {/* Mobile cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {customers.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            No customers yet.
          </p>
        ) : (
          customers.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white">
                  {c.name.split(" ").map((n) => n[0]).join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{c.orders} order{c.orders !== 1 ? "s" : ""} · Joined {c.joined}</span>
                <span className="font-semibold text-foreground">₹{c.spent.toLocaleString("en-IN")}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card sm:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Total Spent</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.map((c) => (
              <tr key={c.id} className="transition hover:bg-muted/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white">
                      {c.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                    <span className="font-medium text-foreground">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                <td className="px-4 py-3 text-foreground">{c.orders}</td>
                <td className="px-4 py-3 font-semibold text-foreground">₹{c.spent.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.joined}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  )
}
