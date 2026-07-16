"use client"

import { useState, useTransition } from "react"
import { MapPin, Plus, Trash2, Star, Loader2, X, Check } from "lucide-react"
import { deleteAddressById, setDefaultAddress, addAddress } from "@/app/actions/profile"
import type { SavedAddress } from "@/app/actions/address"

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
]

const emptyForm = {
  fullName: "", phone: "", addressLine1: "", addressLine2: "",
  city: "", state: "", pincode: "",
}

interface Props {
  addresses: SavedAddress[]
  onChanged: () => void
}

export function ProfileAddressesTab({ addresses: initialAddresses, onChanged }: Props) {
  const [addresses, setAddresses] = useState<SavedAddress[]>(initialAddresses)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [defaulting, setDefaulting] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleAdd = () => {
    setFormError(null)
    startTransition(async () => {
      const res = await addAddress(form)
      if (!res.ok) { setFormError(res.error); return }
      onChanged()
      setShowForm(false)
      setForm(emptyForm)
      // Optimistic update — refetch via parent
    })
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    const res = await deleteAddressById(id)
    if (res.ok) {
      setAddresses((prev) => prev.filter((a) => a.id !== id))
      onChanged()
    }
    setDeleting(null)
  }

  const handleSetDefault = async (id: string) => {
    setDefaulting(id)
    const res = await setDefaultAddress(id)
    if (res.ok) {
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id }))
      )
      onChanged()
    }
    setDefaulting(null)
  }

  const field = (key: keyof typeof form, label: string, options?: { placeholder?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"] }) => (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type="text"
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        inputMode={options?.inputMode}
        placeholder={options?.placeholder}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Address list */}
      {addresses.length === 0 && !showForm && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <MapPin className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-foreground">No saved addresses yet</p>
          <p className="text-xs text-muted-foreground">Add your first delivery address below.</p>
        </div>
      )}

      {addresses.map((addr) => (
        <div
          key={addr.id}
          className={`relative rounded-xl border bg-card p-4 transition ${addr.isDefault ? "border-brand/50 shadow-sm" : "border-border"}`}
        >
          {addr.isDefault && (
            <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
              <Star className="h-3 w-3 fill-current" aria-hidden="true" />
              Default
            </span>
          )}
          <p className="pr-20 text-sm font-semibold text-foreground">{addr.fullName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{addr.phone}</p>
          <p className="mt-2 text-sm text-foreground leading-relaxed">
            {addr.addressLine1}
            {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
            <br />
            {addr.city}, {addr.state} &ndash; {addr.pincode}
          </p>
          <div className="mt-3 flex items-center gap-3">
            {!addr.isDefault && (
              <button
                onClick={() => handleSetDefault(addr.id)}
                disabled={defaulting === addr.id}
                className="flex items-center gap-1.5 text-xs font-medium text-link hover:underline disabled:opacity-60"
              >
                {defaulting === addr.id
                  ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                  : <Check className="h-3 w-3" aria-hidden="true" />}
                Set as default
              </button>
            )}
            <button
              onClick={() => handleDelete(addr.id)}
              disabled={deleting === addr.id}
              className="flex items-center gap-1.5 text-xs font-medium text-destructive hover:underline disabled:opacity-60"
            >
              {deleting === addr.id
                ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                : <Trash2 className="h-3 w-3" aria-hidden="true" />}
              Remove
            </button>
          </div>
        </div>
      ))}

      {/* Add address form */}
      {showForm ? (
        <div className="rounded-xl border border-brand/30 bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">New Delivery Address</h3>
            <button onClick={() => { setShowForm(false); setFormError(null); setForm(emptyForm) }} aria-label="Close form">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {field("fullName", "Full Name *", { placeholder: "Recipient name" })}
            {field("phone", "Mobile Number *", { inputMode: "tel", placeholder: "10-digit number" })}
            <div className="sm:col-span-2">{field("addressLine1", "Address Line 1 *", { placeholder: "House no., street, area" })}</div>
            <div className="sm:col-span-2">{field("addressLine2", "Address Line 2", { placeholder: "Landmark (optional)" })}</div>
            {field("city", "City *", { placeholder: "City" })}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">State *</label>
              <select
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {field("pincode", "Pincode *", { inputMode: "numeric", placeholder: "6-digit pincode" })}
          </div>

          {formError && (
            <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{formError}</p>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleAdd}
              disabled={isPending}
              className="flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save Address
            </button>
            <button
              onClick={() => { setShowForm(false); setFormError(null); setForm(emptyForm) }}
              className="rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card py-3.5 text-sm font-medium text-link transition hover:bg-muted"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add New Address
        </button>
      )}
    </div>
  )
}
