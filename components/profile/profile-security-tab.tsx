"use client"

import { useState, useTransition } from "react"
import { Lock, Eye, EyeOff, Check, Loader2, ShieldCheck } from "lucide-react"
import { changePassword } from "@/app/actions/profile"

export function ProfileSecurityTab() {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.")
      return
    }

    startTransition(async () => {
      const res = await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setSuccess(true)
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setTimeout(() => setSuccess(false), 4000)
    })
  }

  const strength = (() => {
    const p = form.newPassword
    if (!p) return null
    if (p.length < 6) return { label: "Too short", color: "bg-destructive", width: "w-1/4" }
    if (p.length < 8) return { label: "Weak", color: "bg-amber-400", width: "w-2/4" }
    if (/[^a-zA-Z0-9]/.test(p) && /[0-9]/.test(p)) return { label: "Strong", color: "bg-emerald-500", width: "w-full" }
    return { label: "Medium", color: "bg-amber-400", width: "w-3/4" }
  })()

  return (
    <div className="space-y-6">
      {/* Info card */}
      <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-foreground">Password Security</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Use a strong, unique password that you don&apos;t use on other websites.
          </p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
          Password updated successfully.
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4">
        {/* Current password */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Current Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type={showCurrent ? "text" : "password"}
              value={form.currentPassword}
              onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
              required
              placeholder="Enter current password"
              className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showCurrent ? "Hide password" : "Show password"}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* New password */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type={showNew ? "text" : "password"}
              value={form.newPassword}
              onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
              required
              placeholder="Min. 6 characters"
              className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Strength meter */}
          {strength && (
            <div className="mt-2 space-y-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
              </div>
              <p className={`text-xs font-medium ${
                strength.label === "Strong" ? "text-emerald-600" :
                strength.label === "Too short" ? "text-destructive" : "text-amber-600"
              }`}>
                {strength.label}
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              required
              placeholder="Repeat new password"
              className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            {form.confirmPassword && form.newPassword === form.confirmPassword && (
              <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" aria-hidden="true" />
            )}
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          )}
          Update Password
        </button>
      </form>
    </div>
  )
}
