import { orderStatusBreakdown as fallbackBreakdown, type StatusSlice } from "@/lib/admin-data"

const RADIUS = 70
const STROKE = 26
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function OrderStatusChart({ data }: { data?: StatusSlice[] }) {
  const orderStatusBreakdown = data && data.length > 0 ? data : fallbackBreakdown
  const hasData = orderStatusBreakdown.some((s) => s.count > 0)
  let offset = 0

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-lg font-semibold text-foreground">Order Status</h2>

      {!hasData ? (
        <p className="mt-6 text-sm text-muted-foreground">No orders yet.</p>
      ) : (
      <div className="mt-4 flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
        {/* Donut */}
        <svg width="180" height="180" viewBox="0 0 180 180" role="img" aria-label="Order status breakdown">
          <g transform="rotate(-90 90 90)">
            {orderStatusBreakdown.map((slice) => {
              const dash = (slice.percent / 100) * CIRCUMFERENCE
              const circle = (
                <circle
                  key={slice.status}
                  cx="90"
                  cy="90"
                  r={RADIUS}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                  strokeDashoffset={-offset}
                />
              )
              offset += dash
              return circle
            })}
          </g>
        </svg>

        {/* Legend */}
        <ul className="flex w-full max-w-xs flex-col gap-4 sm:w-auto">
          {orderStatusBreakdown.map((slice) => (
            <li key={slice.status} className="flex items-center gap-3 text-sm">
              <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="flex-1 text-foreground">{slice.status}</span>
              <span className="font-semibold text-foreground">{slice.percent}%</span>
              <span className="w-12 text-right text-muted-foreground">({slice.count})</span>
            </li>
          ))}
        </ul>
      </div>
      )}
    </div>
  )
}
