"use client"

import Image from "next/image"
import { useEffect, useState, useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Banner } from "@/app/actions/admin-banners"

const AUTOPLAY_INTERVAL = 4000

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const total = banners.length

  const goTo = useCallback((idx: number) => {
    setCurrent((idx + total) % total)
  }, [total])

  const next = useCallback(() => goTo(current + 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1), [current, goTo])

  useEffect(() => {
    if (paused || total <= 1) return
    timerRef.current = setTimeout(next, AUTOPLAY_INTERVAL)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [current, paused, next, total])

  if (total === 0) return null

  return (
    <section
      className="w-screen relative left-1/2 -translate-x-1/2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Promotional banners"
      aria-roledescription="carousel"
    >
      {/* ~5:2 aspect ratio — shorter than 16:9 */}
      <div className="relative w-full" style={{ paddingBottom: "40%" }}>
        {banners.map((b, i) => (
          <div
            key={b.id}
            aria-roledescription="slide"
            aria-label={`Slide ${i + 1} of ${total}`}
            aria-hidden={i !== current}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === current ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {b.image_url ? (
              <Image
                src={b.image_url}
                alt={`Banner ${i + 1}`}
                fill
                sizes="100vw"
                className="object-cover"
                priority={i === 0}
                draggable={false}
              />
            ) : (
              <div className="h-full w-full" style={{ backgroundColor: b.bg_color }} />
            )}
          </div>
        ))}

        {/* Prev / Next arrows */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous banner"
              className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50 md:h-11 md:w-11"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next banner"
              className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50 md:h-11 md:w-11"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {total > 1 && (
          <div
            className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5"
            role="tablist"
            aria-label="Slide indicators"
          >
            {banners.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === current}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? "w-6 bg-white opacity-100" : "w-2 bg-white opacity-50 hover:opacity-75"
                }`}
              />
            ))}
          </div>
        )}

        {/* Progress bar */}
        {total > 1 && !paused && (
          <div className="absolute bottom-0 left-0 z-20 h-0.5 w-full overflow-hidden bg-white/20">
            <div
              key={current}
              className="h-full bg-white/70"
              style={{ animation: `banner-progress ${AUTOPLAY_INTERVAL}ms linear forwards` }}
            />
          </div>
        )}
      </div>
    </section>
  )
}
