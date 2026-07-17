import { PackageSearch, Tag, ShieldCheck, Truck, RotateCcw, Headset } from "lucide-react"

const reasons = [
  { icon: PackageSearch, title: "Wide Selection", desc: "Millions of products across categories" },
  { icon: Tag, title: "Best Prices", desc: "Unbeatable prices everyday" },
  { icon: ShieldCheck, title: "Secure Shopping", desc: "100% secure payments and data protection" },
  { icon: Truck, title: "Fast Delivery", desc: "Quick delivery at your doorstep" },
  { icon: RotateCcw, title: "Easy Returns", desc: "Hassle-free returns within 30 days" },
  { icon: Headset, title: "Customer Support", desc: "24/7 support we're here to help" },
]

export function WhyShop() {
  return (
    <section className="rounded-md bg-card p-4">
      <h2 className="mb-4 text-xl font-bold text-foreground">Why Shop With Unaferia?</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {reasons.map((r) => {
          const Icon = r.icon
          return (
            <div key={r.title} className="flex flex-col gap-1.5">
              <Icon className="h-7 w-7 text-navy-2" aria-hidden="true" />
              <p className="text-sm font-bold text-foreground">{r.title}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{r.desc}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
