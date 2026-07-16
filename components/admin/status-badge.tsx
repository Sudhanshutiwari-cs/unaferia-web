import { cn } from "@/lib/utils"
import type { OrderStatus } from "@/lib/admin-data"

const styles: Record<OrderStatus, string> = {
  Delivered: "bg-emerald-100 text-emerald-700",
  Processing: "bg-amber-100 text-amber-700",
  Shipped: "bg-blue-100 text-blue-700",
  Cancelled: "bg-red-100 text-red-700",
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", styles[status])}>
      {status}
    </span>
  )
}
