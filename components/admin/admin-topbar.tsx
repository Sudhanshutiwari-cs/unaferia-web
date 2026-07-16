"use client"

import { useState, useRef, useEffect } from "react"
import { Menu, ChevronDown, LogOut, User } from "lucide-react"
import { signOutAdmin } from "@/app/actions/admin-auth"

export function AdminTopbar({ title, onMenuClick }: { title: string; onMenuClick?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    await signOutAdmin()
  }

  return (
    <header className="sticky top-0 z-10 flex h-[4.5rem] items-center justify-between gap-4 border-b border-border bg-background px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open menu"
          onClick={onMenuClick}
          className="flex size-9 items-center justify-center rounded-lg text-foreground transition hover:bg-muted lg:hidden"
        >
          <Menu className="size-6" />
        </button>
        <h1 className="truncate text-lg font-bold text-foreground sm:text-xl md:text-2xl">{title}</h1>
      </div>

      {/* User menu */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-muted"
          aria-label="Admin account menu"
          aria-expanded={menuOpen}
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
            A
          </span>
          <span className="hidden text-sm font-semibold text-foreground sm:block">Admin</span>
          <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            <div className="border-b border-border px-4 py-2.5">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="truncate text-sm font-semibold text-foreground">admin@shouryaquest.app</p>
            </div>
            <div className="py-1">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                onClick={() => { setMenuOpen(false) }}
              >
                <User className="size-4 text-muted-foreground" aria-hidden="true" />
                Profile
              </button>
              <button
                type="button"
                disabled={signingOut}
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-60"
              >
                <LogOut className="size-4" aria-hidden="true" />
                {signingOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
