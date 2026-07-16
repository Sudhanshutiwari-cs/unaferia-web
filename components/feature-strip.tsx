import { Truck, RotateCcw, CreditCard, BadgePercent } from "lucide-react"

const features = [
  { icon: Truck, title: "Free Delivery", desc: "On orders over ₹499" },
  { icon: RotateCcw, title: "Easy Returns", desc: "30 days return policy" },
  { icon: CreditCard, title: "Secure Payment", desc: "100% secure checkout" },
  { icon: BadgePercent, title: "Great Offers", desc: "Best deals & discounts" },
]

export function FeatureStrip() {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
      {features.map((f) => {
        const Icon = f.icon
        return (
          <div key={f.title} className="flex items-center gap-3 bg-card px-4 py-3">
            <Icon className="h-6 w-6 shrink-0 text-navy-2" aria-hidden="true" />
            <div className="leading-tight">
              <p className="text-sm font-bold text-foreground">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
