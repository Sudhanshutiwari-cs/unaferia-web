export function HeroBanner() {
  return (
    <section className="overflow-hidden rounded-md bg-navy">
      <div className="grid items-center md:grid-cols-2">
        <div className="order-2 px-5 py-5 md:order-1 md:px-10 md:py-12">
          <h1 className="text-2xl font-bold leading-tight text-balance text-white sm:text-3xl md:text-4xl lg:text-5xl">
            Discover the Best.
            <br />
            Shop Everything.
          </h1>
          <p className="mt-3 max-w-sm text-xs leading-relaxed text-white/80 sm:text-sm md:text-base">
            Quality products. Best prices. Delivered to your door.
          </p>
          <button className="mt-5 rounded-md bg-brand px-6 py-2 text-sm font-bold text-brand-foreground transition hover:brightness-95 sm:px-8 sm:py-2.5">
            Shop Now
          </button>
        </div>
        <div className="order-1 h-36 sm:h-48 md:order-2 md:h-72 lg:h-80">
          <img
            src="/images/hero-audio.png"
            alt="Wireless headphones and smartwatch on a Unaferia delivery box"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  )
}
