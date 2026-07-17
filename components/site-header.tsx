"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { MapPin, Search, ShoppingCart, ChevronDown, Menu, LogOut, Package, X, ChevronRight, Loader2, Heart, User } from "lucide-react"
import { useCart } from "@/components/cart-provider"
import { useUser } from "@/hooks/use-user"
import { useWishlist } from "@/hooks/use-wishlist"
import { InfluencerStrip } from "@/components/influencer-strip"
import type { CategoryMenuItem } from "@/lib/queries"
import type { Influencer } from "@/app/actions/admin-influencers"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type LocationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "resolved"; label: string }
  | { status: "denied" }

function useCurrentLocation() {
  const [loc, setLoc] = useState<LocationState>({ status: "idle" })

  const detect = useCallback(() => {
    if (!navigator.geolocation) {
      setLoc({ status: "denied" })
      return
    }
    setLoc({ status: "loading" })
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
            { headers: { "Accept-Language": "en" } },
          )
          const data = await res.json()
          const addr = data.address ?? {}
          // prefer city → town → village → county → state
          const label =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.county ||
            addr.state ||
            "India"
          setLoc({ status: "resolved", label })
        } catch {
          setLoc({ status: "resolved", label: "India" })
        }
      },
      () => setLoc({ status: "denied" }),
      { timeout: 8000 },
    )
  }, [])

  // auto-detect on first mount
  useEffect(() => { detect() }, [detect])

  return { loc, detect }
}

export function SiteHeader() {
  const { count } = useCart()
  const { user, signOut } = useUser()
  const router = useRouter()
  const { data: menuData } = useSWR<{ menu: CategoryMenuItem[] }>("/api/categories", fetcher)
  const menu = menuData?.menu ?? []
  const { data: influencers = [] } = useSWR<Influencer[]>("/api/influencers", fetcher)
  const searchCategories = ["All", ...menu.map((c) => c.name)]
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")
  const [accountOpen, setAccountOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const firstName = user?.fullName?.split(" ")[0] ?? ""
  const { loc, detect } = useCurrentLocation()
  const { count: wishlistCount } = useWishlist()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    if (category !== "All") params.set("category", category)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-2 py-2 sm:gap-3 sm:px-4">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/images/unaferia-logo.jpg"
            alt="Unaferia"
            width={120}
            height={40}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>

        {/* Deliver to — md+ only */}
        <button
          onClick={detect}
          aria-label="Detect delivery location"
          className="hidden shrink-0 items-center gap-1 rounded px-2 py-1 text-left hover:outline hover:outline-1 hover:outline-white/60 md:flex"
        >
          {loc.status === "loading" ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <MapPin className="h-5 w-5" aria-hidden="true" />
          )}
          <span className="leading-tight">
            <span className="block text-xs text-white/70">Deliver to</span>
            <span className="flex items-center text-sm font-bold">
              {loc.status === "loading" && (
                <span className="text-white/60">Locating…</span>
              )}
              {loc.status === "resolved" && loc.label}
              {(loc.status === "idle" || loc.status === "denied") && "India"}
            </span>
          </span>
        </button>

        {/* Search */}
        <form
          className="flex h-10 min-w-0 flex-1 items-stretch overflow-hidden rounded-md"
          onSubmit={handleSearch}
          role="search"
        >
          {/* Category select — hidden on xs, shown from sm */}
          <div className="relative hidden items-center bg-[#e6e6e6] text-navy sm:flex">
            <select
              aria-label="Search category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-full cursor-pointer appearance-none rounded-l-md bg-transparent py-0 pl-2 pr-6 text-xs font-medium text-navy focus:outline-none"
            >
              {searchCategories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1 h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            aria-label="Search Unaferia"
            className="min-w-0 flex-1 rounded-l-md bg-white px-3 text-sm text-navy placeholder:text-neutral-500 focus:outline-none sm:rounded-none"
          />
          <button
            type="submit"
            aria-label="Search"
            className="flex w-10 shrink-0 items-center justify-center rounded-r-md bg-brand text-brand-foreground hover:brightness-95 sm:w-12"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>
        </form>

        {/* Account — lg+ */}
        {user ? (
          <div
            className="relative hidden shrink-0 lg:block"
            onMouseLeave={() => setAccountOpen(false)}
          >
            <button
              onClick={() => setAccountOpen((v) => !v)}
              className="rounded px-2 py-1 text-left text-sm hover:outline hover:outline-1 hover:outline-white/60"
            >
              <span className="block text-xs text-white/90">Hello, {firstName}</span>
              <span className="flex items-center font-bold">
                Account &amp; Lists
                <ChevronDown className="ml-0.5 h-3 w-3 text-white/70" aria-hidden="true" />
              </span>
            </button>
            {accountOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-border bg-card py-1 text-navy shadow-lg">
                <div className="border-b border-border px-4 py-2 text-xs text-muted-foreground">
                  +91 {user.phone}
                </div>
                <Link
                  href="/profile"
                  onClick={() => setAccountOpen(false)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  My Profile
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setAccountOpen(false)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                >
                  <Package className="h-4 w-4" aria-hidden="true" />
                  My Orders
                </Link>
                <Link
                  href="/wishlist"
                  onClick={() => setAccountOpen(false)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                >
                  <Heart className="h-4 w-4" aria-hidden="true" />
                  My Wishlist
                  {wishlistCount > 0 && (
                    <span className="ml-auto rounded-full bg-rose-100 px-1.5 py-0.5 text-xs font-semibold text-rose-600">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => {
                    setAccountOpen(false)
                    signOut()
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="hidden shrink-0 rounded px-2 py-1 text-left text-sm hover:outline hover:outline-1 hover:outline-white/60 lg:block"
          >
            <span className="block text-xs text-white/90">Hello, Sign in</span>
            <span className="flex items-center font-bold">
              Account &amp; Lists
              <ChevronDown className="ml-0.5 h-3 w-3 text-white/70" aria-hidden="true" />
            </span>
          </Link>
        )}

        {/* Returns — lg+ */}
        <Link href={user ? "/orders" : "/login?redirect=/orders"} className="hidden shrink-0 rounded px-2 py-1 text-left text-sm hover:outline hover:outline-1 hover:outline-white/60 lg:block">
          <span className="block text-xs text-white/90">Returns</span>
          <span className="font-bold">&amp; Orders</span>
        </Link>

        {/* Account icon — sm–md only (when sidebar links are hidden) */}
        {user ? (
          <Link href="/orders" aria-label="My Orders" className="flex shrink-0 items-center rounded p-1 hover:outline hover:outline-1 hover:outline-white/60 lg:hidden">
            <Package className="h-6 w-6" aria-hidden="true" />
          </Link>
        ) : (
          <Link href="/login" aria-label="Sign in" className="flex shrink-0 items-center rounded p-1 hover:outline hover:outline-1 hover:outline-white/60 lg:hidden">
            <Package className="h-6 w-6" aria-hidden="true" />
          </Link>
        )}

        {/* Wishlist */}
        <Link
          href="/wishlist"
          aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ""}`}
          className="flex shrink-0 items-end gap-1 rounded px-1 py-1 hover:outline hover:outline-1 hover:outline-white/60"
        >
          <span className="relative">
            <Heart className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold leading-none text-white shadow">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </span>
          <span className="hidden text-sm font-bold sm:inline">Wishlist</span>
        </Link>

        {/* Cart */}
        <Link
          href="/cart"
          aria-label={`Cart, ${count} items`}
          className="flex shrink-0 items-end gap-1 rounded px-1 py-1 hover:outline hover:outline-1 hover:outline-white/60"
        >
          <span className="relative">
            <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold leading-none text-white shadow">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </span>
          <span className="hidden text-sm font-bold sm:inline">Cart</span>
        </Link>
      </div>

      {/* Secondary nav — parent category links */}
      <nav className="bg-navy-2 text-white" aria-label="Category navigation">
        <div className="mx-auto flex max-w-[1400px] items-center gap-1 px-2 py-1.5 text-sm sm:px-4">
          <button
            onClick={() => setMenuOpen(true)}
            className="flex shrink-0 items-center gap-1 rounded px-1.5 py-1 font-bold hover:outline hover:outline-1 hover:outline-white/60"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
            <span className="hidden sm:inline">All</span>
          </button>
          <ul className="flex items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {menu.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/category/${cat.slug}`}
                  className="block whitespace-nowrap rounded px-2 py-1 transition-colors hover:outline hover:outline-1 hover:outline-white/60"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Influencer strip — directly below category nav, mobile only */}
      <InfluencerStrip influencers={influencers} />

      {/* All Categories mega drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="All categories">
          <button
            className="absolute inset-0 bg-black/50"
            aria-label="Close categories menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-full max-w-3xl bg-card text-foreground shadow-xl">
            {/* Left: top-level categories */}
            <div className="flex w-1/2 flex-col border-r border-border sm:w-64">
              <div className="flex items-center justify-between bg-navy px-4 py-3 text-white">
                <span className="font-bold">Shop by Category</span>
                <button onClick={() => setMenuOpen(false)} aria-label="Close">
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <ul className="flex-1 overflow-y-auto py-1">
                {menu.map((cat) => (
                  <li key={cat.slug}>
                    <button
                      onMouseEnter={() => setActiveCat(cat.slug)}
                      onClick={() => {
                        setMenuOpen(false)
                        router.push(`/category/${cat.slug}`)
                      }}
                      className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted ${
                        activeCat === cat.slug ? "bg-muted font-medium" : ""
                      }`}
                    >
                      <span className="flex-1">{cat.name}</span>
                      {cat.children.length > 0 && (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: subcategories */}
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                const active = menu.find((c) => c.slug === activeCat) ?? menu[0]
                if (!active) return null
                return (
                  <>
                    <Link
                      href={`/category/${active.slug}`}
                      onClick={() => setMenuOpen(false)}
                      className="mb-3 inline-block text-base font-bold text-foreground hover:text-link"
                    >
                      All {active.name}
                    </Link>
                    {active.children.length > 0 ? (
                      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                        {active.children.map((sub) => (
                          <li key={sub.slug}>
                            <Link
                              href={`/category/${sub.slug}`}
                              onClick={() => setMenuOpen(false)}
                              className="block rounded px-2 py-1.5 text-sm text-foreground hover:bg-muted hover:text-link"
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">Browse all products in this category.</p>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
