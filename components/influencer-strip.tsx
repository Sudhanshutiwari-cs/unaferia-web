"use client"

import Link from "next/link"
import type { Influencer } from "@/app/actions/admin-influencers"

export function InfluencerStrip({ influencers }: { influencers: Influencer[] }) {
  if (!influencers.length) return null

  return (
    <section
      aria-label="Featured influencers"
      className="sm:hidden -mx-2 px-3 py-2 bg-background"
    >
      <div className="flex gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {influencers.map((inf) => (
          <Link
            key={inf.id}
            href={inf.href}
            className="flex shrink-0 flex-col items-center gap-1.5 px-3 py-1 first:pl-0"
          >
            {/* Tile */}
            <div
              className="relative flex h-[3.2rem] w-[3.2rem] items-center justify-center overflow-hidden rounded-2xl border border-black/[0.04] shadow-sm"
              style={{ backgroundColor: inf.bg_color }}
            >
              {inf.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={inf.avatar_url}
                  alt={inf.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold" style={{ color: "#333" }}>
                  {inf.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* First name only */}
            <span className="max-w-[3.6rem] truncate text-center text-[10px] font-medium leading-tight text-foreground">
              {inf.name.split(" ")[0]}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
