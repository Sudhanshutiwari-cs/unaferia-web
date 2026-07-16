"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  User, Package, MapPin, Shield, LogOut, ChevronRight, Loader2, ShoppingBag,
} from "lucide-react"
import { useUser } from "@/hooks/use-user"
import { getProfile } from "@/app/actions/profile"
import { getUserAddresses } from "@/app/actions/address"
import { ProfileInfoTab } from "@/components/profile/profile-info-tab"
import { ProfileOrdersTab } from "@/components/profile/profile-orders-tab"
import { ProfileAddressesTab } from "@/components/profile/profile-addresses-tab"
import { ProfileSecurityTab } from "@/components/profile/profile-security-tab"
import { SiteFooter } from "@/components/site-footer"
import type { ProfileData } from "@/app/actions/profile"
import type { SavedAddress } from "@/app/actions/address"

type Tab = "info" | "orders" | "addresses" | "security"

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "info",      label: "Personal Info",  icon: User },
  { id: "orders",    label: "My Orders",      icon: Package },
  { id: "addresses", label: "My Addresses",   icon: MapPin },
  { id: "security",  label: "Security",       icon: Shield },
]

function AvatarCircle({ name }: { name: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
  return (
    <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand text-xl font-bold text-brand-foreground">
      {initials || <User className="h-6 w-6" />}
    </span>
  )
}

function ProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: userLoading, signOut } = useUser()

  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get("tab") as Tab) ?? "info",
  )
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const [prof, addrs] = await Promise.all([getProfile(), getUserAddresses()])
    setProfile(prof)
    setAddresses(addrs)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace("/login?redirect=/profile")
      return
    }
    if (!userLoading && user) loadData()
  }, [user, userLoading, router, loadData])

  // Sync tab with URL
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    router.replace(`/profile?tab=${tab}`, { scroll: false })
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  if (userLoading || loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1400px] px-4 py-12">
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand" aria-label="Loading profile" />
          </div>
        </div>
        <SiteFooter />
      </main>
    )
  }

  if (!user || !profile) return null

  const firstName = profile.fullName.split(" ")[0] || "Customer"

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground hover:underline">Home</Link>
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
          <span className="text-foreground font-medium">My Account</span>
        </nav>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* ── Sidebar ── */}
          <aside className="w-full shrink-0 lg:w-64">
            {/* Profile card */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <AvatarCircle name={profile.fullName || "?"} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">Hello, {firstName}</p>
                <p className="truncate text-xs text-muted-foreground">{profile.phone || profile.email}</p>
              </div>
            </div>

            {/* Nav */}
            <nav aria-label="Profile sections" className="mt-3 rounded-xl border border-border bg-card overflow-hidden">
              {tabs.map((tab, idx) => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium transition
                      ${idx !== 0 ? "border-t border-border" : ""}
                      ${active
                        ? "bg-brand/5 text-brand"
                        : "text-foreground hover:bg-muted"
                      }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {tab.label}
                    {active && <ChevronRight className="ml-auto h-3.5 w-3.5" aria-hidden="true" />}
                  </button>
                )
              })}
            </nav>

            {/* Quick links */}
            <div className="mt-3 rounded-xl border border-border bg-card overflow-hidden">
              <Link
                href="/orders"
                className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left text-sm font-medium text-foreground transition hover:bg-muted"
              >
                <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
                All Orders
              </Link>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium text-destructive transition hover:bg-destructive/5"
              >
                <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                Sign Out
              </button>
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            {/* Tab heading */}
            <div className="mb-5 flex items-center gap-2">
              {(() => {
                const current = tabs.find((t) => t.id === activeTab)!
                const Icon = current.icon
                return (
                  <>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
                      <Icon className="h-4 w-4 text-brand" aria-hidden="true" />
                    </span>
                    <h1 className="text-lg font-bold text-foreground">{current.label}</h1>
                  </>
                )
              })()}
            </div>

            {/* Mobile tab pills */}
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition
                      ${active
                        ? "bg-brand text-brand-foreground"
                        : "border border-border bg-card text-foreground hover:bg-muted"
                      }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Tab panels */}
            {activeTab === "info" && (
              <ProfileInfoTab
                profile={profile}
                onUpdated={(updated) => setProfile(updated)}
              />
            )}
            {activeTab === "orders" && (
              <ProfileOrdersTab user={user} />
            )}
            {activeTab === "addresses" && (
              <ProfileAddressesTab
                addresses={addresses}
                onChanged={async () => {
                  const updated = await getUserAddresses()
                  setAddresses(updated)
                }}
              />
            )}
            {activeTab === "security" && (
              <ProfileSecurityTab />
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background">
          <div className="mx-auto max-w-[1400px] px-4 py-12">
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand" aria-label="Loading profile" />
            </div>
          </div>
        </main>
      }
    >
      <ProfileContent />
    </Suspense>
  )
}
