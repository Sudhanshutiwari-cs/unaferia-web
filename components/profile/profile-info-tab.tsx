"use client"

import { useState, useTransition } from "react"
import { User, Pencil, Check, X, Loader2, Phone, Mail, Calendar } from "lucide-react"
import { updateProfile } from "@/app/actions/profile"
import type { ProfileData } from "@/app/actions/profile"
import { useUser } from "@/hooks/use-user"

function AvatarCircle({ name, size = "lg" }: { name: string; size?: "sm" | "lg" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const dim = size === "lg" ? "h-20 w-20 text-2xl" : "h-10 w-10 text-sm"

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand font-bold text-brand-foreground ${dim}`}
      aria-hidden="true"
    >
      {initials || <User className="h-5 w-5" />}
    </span>
  )
}

interface Props {
  profile: ProfileData
  onUpdated: (updated: ProfileData) => void
}

export function ProfileInfoTab({ profile, onUpdated }: Props) {
  const { refresh } = useUser()
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState({
    fullName: profile.fullName,
    phone: profile.phone,
    email: profile.email,
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleCancel = () => {
    setForm({ fullName: profile.fullName, phone: profile.phone, email: profile.email })
    setEditing(false)
    setError(null)
  }

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const res = await updateProfile(form)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setEditing(false)
      setSuccess(true)
      refresh()
      onUpdated({ ...profile, ...form })
      setTimeout(() => setSuccess(false), 3000)
    })
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="flex items-center gap-5 rounded-xl border border-border bg-card p-5">
        <AvatarCircle name={profile.fullName || "?"} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-foreground">
            {profile.fullName || "Your Name"}
          </h2>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Member since {memberSince}
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </button>
        )}
      </div>

      {/* Success banner */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
          Profile updated successfully.
        </div>
      )}

      {/* Fields */}
      <div className="rounded-xl border border-border bg-card">
        <div className="divide-y divide-border">
          <Field
            icon={<User className="h-4 w-4" />}
            label="Full Name"
            value={form.fullName}
            editing={editing}
            onChange={(v) => setForm((f) => ({ ...f, fullName: v }))}
            placeholder="Enter your full name"
          />
          <Field
            icon={<Phone className="h-4 w-4" />}
            label="Mobile Number"
            value={form.phone}
            editing={editing}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            inputMode="tel"
            placeholder="10-digit mobile number"
          />
          <Field
            icon={<Mail className="h-4 w-4" />}
            label="Email Address"
            value={form.email}
            editing={editing}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            inputMode="email"
            placeholder="your@email.com"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      )}

      {/* Action buttons */}
      {editing && (
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="h-4 w-4" aria-hidden="true" />
            )}
            Save Changes
          </button>
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="flex items-center gap-2 rounded-full border border-border bg-background px-6 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

function Field({
  icon,
  label,
  value,
  editing,
  onChange,
  inputMode,
  placeholder,
}: {
  icon: React.ReactNode
  label: string
  value: string
  editing: boolean
  onChange: (v: string) => void
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  placeholder?: string
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="mb-0.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        {editing ? (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            inputMode={inputMode}
            placeholder={placeholder}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        ) : (
          <p className="text-sm text-foreground">{value || <span className="text-muted-foreground italic">Not set</span>}</p>
        )}
      </div>
    </div>
  )
}
