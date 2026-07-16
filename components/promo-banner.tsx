export function PromoBanner() {
  return (
    <section className="overflow-hidden rounded-md bg-[#f2d9b0]">
      <div className="grid items-center md:grid-cols-2">
        {/* Image first on mobile (order-1 = visual top), text second */}
        <div className="order-1 h-40 sm:h-44 md:order-2 md:h-56">
          <img
            src="/images/promo-lifestyle.png"
            alt="Luggage, backpack, camera, laptop and sneakers on sale"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="order-2 px-5 py-5 md:order-1 md:px-10 md:py-10">
          <h2 className="text-xl font-bold text-navy sm:text-2xl md:text-3xl">Up to 60% Off</h2>
          <p className="mt-2 text-sm font-medium text-navy-2 sm:text-base">
            Top Brands <span className="mx-1 text-navy/50">|</span> Great Prices
          </p>
          <button className="mt-4 rounded-md bg-navy px-5 py-2.5 text-sm font-bold text-white transition hover:bg-navy-2 sm:px-6 sm:mt-5">
            Shop Now
          </button>
        </div>
      </div>
    </section>
  )
}
