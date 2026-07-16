import type { ShopCategory } from "@/lib/mock-data"

export function ShopByCategory({ categories }: { categories: ShopCategory[] }) {
  const shopByCategory = categories
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Shop by Category</h2>
        <a href="#" className="text-sm font-medium text-link hover:underline">
          View all
        </a>
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
        {shopByCategory.map((cat) => (
          <a key={cat.name} href="#" className="group flex flex-col items-center gap-1.5">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-muted transition group-hover:ring-2 group-hover:ring-brand sm:h-16 sm:w-16 md:h-20 md:w-20">
              <img
                src={cat.image || "/placeholder.svg"}
                alt={cat.name}
                className="h-10 w-10 object-contain sm:h-12 sm:w-12 md:h-14 md:w-14"
              />
            </div>
            <span className="text-center text-[10px] font-medium leading-tight text-foreground sm:text-xs">{cat.name}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
