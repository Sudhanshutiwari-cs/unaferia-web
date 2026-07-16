"use client"

import Link from "next/link"
import type { QuickLink } from "@/app/actions/admin-quick-links"

// Fallback icon shown when no icon_url is set — uses first letter of label
function FallbackIcon({ label, bgColor }: { label: string; bgColor: string }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center text-lg font-bold"
      style={{ backgroundColor: bgColor, color: "#333" }}
    >
      {label.charAt(0).toUpperCase()}
    </div>
  )
}

export function MobileQuickLinks({ links }: { links: QuickLink[] }) {
  if (!links.length) return null

  return (
    <section
      aria-label="Quick links"
      className="sm:hidden -mx-2 px-3 py-2 bg-background"
    >
      <div className="flex gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {links.map((link) => (
          <Link
            key={link.id}
            href={link.href}
            className="flex shrink-0 flex-col items-center gap-1.5 px-3 py-1 first:pl-0"
          >
            {/* Circle icon */}
            <div
              className="relative flex h-[3.2rem] w-[3.2rem] items-center justify-center overflow-hidden rounded-2xl shadow-sm border border-black/[0.04]"
              style={{ backgroundColor: link.bg_color }}
            >
              {link.icon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={link.icon_url}
                  alt={link.label}
                  className="h-full w-full object-cover"
                />
              ) : (
                <FallbackIcon label={link.label} bgColor={link.bg_color} />
              )}
            </div>

            {/* Label */}
            <span className="max-w-[3.6rem] truncate text-center text-[10px] font-medium leading-tight text-foreground">
              {link.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
