"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, ShoppingCart, Heart, User } from "lucide-react"
import { useCart } from "@/components/cart-provider"
import { useWishlist } from "@/hooks/use-wishlist"
import { useUser } from "@/hooks/use-user"

const navItems = [
  { href: "/",        label: "Home",    icon: Home },
  { href: "/search",  label: "Search",  icon: Search },
  { href: "/cart",    label: "Cart",    icon: ShoppingCart, badge: "cart" },
  { href: "/wishlist",label: "Wishlist",icon: Heart,        badge: "wishlist" },
  { href: "/profile", label: "Account", icon: User,         auth: true },
]

export function BottomNav() {
  const pathname = usePathname()
  const { count: cartCount } = useCart()
  const { count: wishlistCount } = useWishlist()
  const { user } = useUser()

  // Hide on admin routes
  if (pathname.startsWith("/admin")) return null

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 flex items-stretch border-t border-border bg-card shadow-[0_-1px_8px_rgba(0,0,0,0.07)] sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = item.href === "/"
          ? pathname === "/"
          : pathname.startsWith(item.href)

        const badge =
          item.badge === "cart" && cartCount > 0
            ? cartCount
            : item.badge === "wishlist" && wishlistCount > 0
            ? wishlistCount
            : null

        // auth items redirect to login when not signed in
        const href =
          item.auth && !user
            ? `/login?redirect=${encodeURIComponent(item.href)}`
            : item.href

        return (
          <Link
            key={item.href}
            href={href}
            aria-label={item.label}
            className={`relative flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 transition-colors
              ${isActive ? "text-brand" : "text-muted-foreground hover:text-foreground"}`}
          >
            <span className="relative shrink-0">
              <Icon
                className={`h-5 w-5 ${isActive ? "fill-brand/10" : ""}`}
                aria-hidden="true"
              />
              {badge !== null && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-0.5 text-[9px] font-bold leading-none text-white">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </span>
            <span className="w-full truncate text-center text-[10px] font-medium leading-none">
              {item.label}
            </span>
            {isActive && (
              <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-brand" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
