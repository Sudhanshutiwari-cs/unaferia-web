"use client"

import { useState } from "react"
import { Store, Search, Share2, Bell } from "lucide-react"

type Tab = "store" | "seo" | "social" | "notifications"

const tabs: { key: Tab; label: string; icon: typeof Store }[] = [
  { key: "store", label: "Store Info", icon: Store },
  { key: "seo", label: "SEO Defaults", icon: Search },
  { key: "social", label: "Social Links", icon: Share2 },
  { key: "notifications", label: "Notifications", icon: Bell },
]

function Field({ id, label, type = "text", defaultValue, placeholder }: {
  id: string; label: string; type?: string; defaultValue?: string; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">{label}</label>
      {type === "textarea" ? (
        <textarea
          id={id}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={3}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      ) : (
        <input
          id={id}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      )}
    </div>
  )
}

function SaveBar() {
  return (
    <div className="flex justify-end pt-2">
      <button
        type="button"
        className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy/90"
      >
        Save Changes
      </button>
    </div>
  )
}

export function WebsiteSettingsManager() {
  const [tab, setTab] = useState<Tab>("store")

  return (
    <div className="flex flex-col gap-5">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 border-b-2 px-4 pb-3 text-sm font-medium transition ${tab === t.key ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <t.icon className="size-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl">
        {tab === "store" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-5 text-base font-semibold text-foreground">Store Information</h2>
            <div className="flex flex-col gap-4">
              <Field id="store-name" label="Store Name" defaultValue="Unaferia" />
              <Field id="store-email" label="Support Email" type="email" defaultValue="admin@unaferia.in" />
              <Field id="store-phone" label="Support Phone" type="tel" placeholder="+91 98765 43210" />
              <Field id="store-address" label="Store Address" type="textarea" placeholder="123, Main Street, City — 400001" />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="currency" className="text-sm font-semibold text-foreground">Currency</label>
                <select id="currency" defaultValue="INR" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30">
                  <option value="INR">Indian Rupee (₹)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>
              <Field id="gst" label="GST Number" placeholder="22AAAAA0000A1Z5" />
              <SaveBar />
            </div>
          </div>
        )}

        {tab === "seo" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-5 text-base font-semibold text-foreground">SEO Defaults</h2>
            <div className="flex flex-col gap-4">
              <Field id="seo-title" label="Default Page Title" defaultValue="Unaferia — Quality Products, Best Prices" />
              <Field id="seo-desc" label="Default Meta Description" type="textarea" placeholder="Shop the best electronics, fashion, home essentials and more at Unaferia." />
              <Field id="seo-keywords" label="Keywords" placeholder="online shopping, electronics, fashion, india" />
              <Field id="og-image" label="Default OG Image URL" placeholder="https://yourdomain.com/og-image.jpg" />
              <Field id="favicon" label="Favicon URL" placeholder="https://yourdomain.com/favicon.ico" />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="robots" className="text-sm font-semibold text-foreground">Robots Tag</label>
                <select id="robots" defaultValue="index,follow" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30">
                  <option value="index,follow">index, follow</option>
                  <option value="noindex,nofollow">noindex, nofollow</option>
                  <option value="index,nofollow">index, nofollow</option>
                </select>
              </div>
              <SaveBar />
            </div>
          </div>
        )}

        {tab === "social" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-5 text-base font-semibold text-foreground">Social Media Links</h2>
            <div className="flex flex-col gap-4">
              <Field id="facebook" label="Facebook URL" placeholder="https://facebook.com/unaferia" />
              <Field id="instagram" label="Instagram URL" placeholder="https://instagram.com/unaferia" />
              <Field id="twitter" label="X (Twitter) URL" placeholder="https://x.com/unaferia" />
              <Field id="youtube" label="YouTube URL" placeholder="https://youtube.com/@unaferia" />
              <Field id="whatsapp" label="WhatsApp Number" placeholder="+91 98765 43210" />
              <SaveBar />
            </div>
          </div>
        )}

        {tab === "notifications" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-5 text-base font-semibold text-foreground">Notification Settings</h2>
            <div className="flex flex-col gap-5">
              {[
                { id: "notif-new-order", label: "New Order", desc: "Email alert when a new order is placed" },
                { id: "notif-low-stock", label: "Low Stock Alert", desc: "Alert when product stock falls below 10 units" },
                { id: "notif-new-customer", label: "New Customer", desc: "Email alert when a new customer registers" },
                { id: "notif-review", label: "New Review", desc: "Alert when a customer leaves a product review" },
              ].map((n) => (
                <label key={n.id} htmlFor={n.id} className="flex items-center justify-between gap-4 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-foreground">{n.label}</p>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    id={n.id}
                    defaultChecked
                    className="size-4 cursor-pointer accent-brand"
                  />
                </label>
              ))}
              <Field id="notif-email" label="Notification Email" type="email" defaultValue="admin@unaferia.in" />
              <SaveBar />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
