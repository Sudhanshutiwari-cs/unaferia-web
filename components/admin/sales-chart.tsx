"use client"

import { ChevronDown } from "lucide-react"
import { salesThisWeek, type SalesPoint } from "@/lib/admin-data"

function niceMax(peak: number) {
  if (peak <= 0) return 1000
  const pow = Math.pow(10, Math.floor(Math.log10(peak)))
  return Math.ceil(peak / pow) * pow
}

function formatTick(v: number) {
  if (v === 0) return "₹0"
  if (v < 100000) return `₹${Math.round(v / 1000)}K`
  return `₹${(v / 100000).toFixed(1)}L`
}

// SVG plot geometry
const W = 720
const H = 300
const left = 56
const right = 706
const top = 18
const bottom = 252

export function SalesChart({ data }: { data?: SalesPoint[] }) {
  const series = data && data.length > 0 ? data : salesThisWeek
  const MAX = niceMax(Math.max(...series.map((p) => p.value), 1))
  const ticks = [0, MAX * 0.25, MAX * 0.5, MAX * 0.75, MAX]
  const n = series.length
  const x = (i: number) => (n <= 1 ? left : left + (i / (n - 1)) * (right - left))
  const y = (v: number) => bottom - (v / MAX) * (bottom - top)

  const linePoints = series.map((p, i) => `${x(i)},${y(p.value)}`).join(" ")
  const areaPath = `M ${x(0)},${bottom} L ${series
    .map((p, i) => `${x(i)},${y(p.value)}`)
    .join(" L ")} L ${x(n - 1)},${bottom} Z`

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Sales Overview</h2>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          This Week
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      </div>

      <div className="mt-6">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-64 w-full" role="img" aria-label="Weekly sales overview">
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Gridlines + y labels */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={left} y1={y(t)} x2={right} y2={y(t)} stroke="currentColor" className="text-border" strokeWidth="1" />
              <text x={left - 12} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
                {formatTick(t)}
              </text>
            </g>
          ))}

          {/* Area + line */}
          <path d={areaPath} fill="url(#salesFill)" />
          <polyline points={linePoints} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

          {/* Dots */}
          {series.map((p, i) => (
            <circle key={p.label} cx={x(i)} cy={y(p.value)} r="4.5" fill="#fff" stroke="#3b82f6" strokeWidth="2.5" />
          ))}

          {/* X labels */}
          {series.map((p, i) => (
            <text key={p.label} x={x(i)} y={bottom + 24} textAnchor="middle" className="fill-muted-foreground text-[11px]">
              {p.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}
