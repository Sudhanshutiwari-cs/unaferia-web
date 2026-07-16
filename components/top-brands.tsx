import { topBrands } from "@/lib/mock-data"

export function TopBrands() {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-4 text-xl font-bold text-foreground">Top Brands</h2>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
        {topBrands.map((brand, i) => (
          <a
            key={`${brand}-${i}`}
            href="#"
            className="flex h-16 items-center justify-center rounded-md border border-border bg-card px-2 transition hover:shadow-md"
          >
            <span className="text-sm font-extrabold uppercase tracking-tight text-navy">
              {brand}
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
