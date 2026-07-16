"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  Home,
  Package,
  ShoppingBag,
  Users,
  ListChecks,
  Settings,
  LogOut,
  X,
  Tag,
  Images,
  MailOpen,
  Warehouse,
  CreditCard,
  BarChart3,
  Layers,
  Globe,
  SearchCheck,
  Zap,
  UserCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { signOutAdmin } from "@/app/actions/admin-auth"

const mainNav = [
  { label: "Dashboard", href: "/admin", icon: Home },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Inventory", href: "/admin/inventory", icon: Warehouse },
  { label: "Categories & Brands", href: "/admin/categories", icon: Layers },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Coupons", href: "/admin/coupons", icon: Tag },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Banners", href: "/admin/banners", icon: Images },
  { label: "Quick Links", href: "/admin/quick-links", icon: Zap },
  { label: "Influencers", href: "/admin/influencers", icon: UserCircle2 },
  { label: "Newsletter", href: "/admin/newsletter", icon: MailOpen },
  { label: "SEO Manager", href: "/admin/seo", icon: SearchCheck },
]

const secondaryNav = [
  { label: "Website Settings", href: "/admin/settings", icon: Globe },
]

export function AdminSidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    onClose?.()
    await signOutAdmin()
  }

  const renderLink = (item: (typeof mainNav)[number]) => {
    const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition",
          active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
        )}
      >
        <item.icon className="size-4 shrink-0" />
        {item.label}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col bg-navy text-white transition-transform lg:sticky lg:top-0 lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-[4.5rem] items-center justify-between px-6">
          <span className="text-xl font-extrabold leading-tight tracking-tight">
            SHOURYA
            <br />
            <span className="text-brand">QUEST</span>
          </span>
          {/* Close button — visible on mobile only */}
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
          {mainNav.map(renderLink)}

          <div className="my-3 border-t border-white/10" />

          {secondaryNav.map(renderLink)}

          <button
            type="button"
            disabled={signingOut}
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-white/60 transition hover:bg-white/5 hover:text-white disabled:opacity-60"
          >
            <LogOut className="size-4 shrink-0" />
            {signingOut ? "Signing out..." : "Logout"}
          </button>
        </nav>
      </aside>
    </>
  )
}
