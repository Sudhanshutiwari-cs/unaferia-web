"use client"

import Link from "next/link"
import useSWR from "swr"
import { ChevronRight } from "lucide-react"
import type { CategoryMenuItem } from "@/lib/queries"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function CategorySidebar() {
  const { data } = useSWR<{ menu: CategoryMenuItem[] }>("/api/categories", fetcher)
  const menu = data?.menu ?? []

  return (
    <aside className="w-full shrink-0 lg:w-60">
      <nav
        aria-label="Shop by department"
        className="overflow-hidden rounded-md border border-border bg-card"
      >
        <div className="border-b border-border bg-muted px-4 py-2.5">
          <h2 className="text-sm font-bold text-foreground">Shop by Category</h2>
        </div>
        <ul className="py-1">
          {menu.length === 0
            ? Array.from({ length: 10 }).map((_, i) => (
                <li key={i} className="px-4 py-2.5">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                </li>
              ))
            : menu.map((cat) => (
                <li key={cat.slug} className="group relative">
                  <Link
                    href={`/search?category=${encodeURIComponent(cat.name)}`}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    <span className="flex-1">{cat.name}</span>
                    {cat.children.length > 0 && (
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                  </Link>

                  {/* Subcategory flyout */}
                  {cat.children.length > 0 && (
                    <div className="invisible absolute left-full top-0 z-40 ml-0 hidden min-w-56 rounded-md border border-border bg-card p-2 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 lg:block">
                      <p className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {cat.name}
                      </p>
                      <ul>
                        {cat.children.map((sub) => (
                          <li key={sub.slug}>
                            <Link
                              href={`/search?category=${encodeURIComponent(sub.name)}`}
                              className="block rounded px-2 py-1.5 text-sm text-foreground hover:bg-muted hover:text-link"
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
        </ul>
      </nav>
    </aside>
  )
}
