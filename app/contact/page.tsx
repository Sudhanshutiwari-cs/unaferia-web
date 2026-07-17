"use client"

import { useState } from "react"
import { SiteFooter } from "@/components/site-footer"
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, Headphones, RotateCcw } from "lucide-react"

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate a brief delay
    await new Promise((r) => setTimeout(r, 800))
    setSent(true)
    setLoading(false)
  }

  const channels = [
    {
      icon: Headphones,
      title: "Customer Support",
      description: "Speak to our friendly team",
      detail: "1800-123-4567 (Toll Free)",
      sub: "Mon – Sat, 9 AM – 8 PM IST",
    },
    {
      icon: Mail,
      title: "Email Us",
      description: "We reply within 24 hours",
      detail: "support@unaferia.in",
      sub: "For order & product queries",
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Chat with us in real time",
      detail: "Available on the app",
      sub: "Mon – Sat, 9 AM – 8 PM IST",
    },
    {
      icon: RotateCcw,
      title: "Returns & Refunds",
      description: "Start a return or track refund",
      detail: "returns@unaferia.in",
      sub: "Typically resolved in 5–7 days",
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-[1400px] px-4 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand">Support</p>
          <h1 className="text-3xl font-extrabold sm:text-4xl md:text-5xl">Contact Us</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/70">
            Have a question, concern or feedback? We&apos;re here to help. Reach out through any of the channels below and our team will get back to you promptly.
          </p>
        </div>
      </section>

      {/* Contact channels */}
      <section className="mx-auto max-w-[1400px] px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((c) => (
            <div key={c.title} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand/10">
                <c.icon className="size-5 text-brand" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-foreground">{c.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{c.description}</p>
              </div>
              <div className="mt-auto">
                <p className="text-sm font-medium text-foreground">{c.detail}</p>
                <p className="text-xs text-muted-foreground">{c.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Form + Info */}
      <section className="mx-auto max-w-[1400px] px-4 pb-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Form */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-xl font-bold text-foreground">Send Us a Message</h2>
            <p className="mt-1 text-sm text-muted-foreground">Fill in the form and our team will reach out within 24 hours.</p>

            {sent ? (
              <div className="mt-8 flex flex-col items-center gap-4 py-10 text-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-success/10">
                  <Send className="size-7 text-success" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-lg font-bold text-foreground">Message Sent!</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Thanks for reaching out, {form.name.split(" ")[0]}. We&apos;ll get back to you at {form.email} within 24 hours.
                  </p>
                </div>
                <button
                  onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }) }}
                  className="rounded-full border border-border px-6 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="Rahul Sharma"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="rahul@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label htmlFor="subject" className="text-sm font-medium text-foreground">Subject</label>
                  <input
                    id="subject"
                    type="text"
                    required
                    placeholder="e.g. Order #12345 not delivered"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label htmlFor="message" className="text-sm font-medium text-foreground">Message</label>
                  <textarea
                    id="message"
                    rows={5}
                    required
                    placeholder="Describe your issue or question in detail…"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 rounded-full bg-brand px-8 py-3 text-sm font-semibold text-brand-foreground transition hover:brightness-95 disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-foreground border-t-transparent" />
                    ) : (
                      <Send className="size-4" aria-hidden="true" />
                    )}
                    {loading ? "Sending…" : "Send Message"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-bold text-foreground">Our Office</h3>
              <ul className="mt-4 space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Registered Address</p>
                    <p className="text-sm text-muted-foreground">Unaferia Pvt. Ltd., 14th Floor, Tower B, DLF Cyber City, Gurugram, Haryana – 122002, India</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Phone</p>
                    <p className="text-sm text-muted-foreground">1800-123-4567 (Toll Free)</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="text-sm text-muted-foreground">support@unaferia.in</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Business Hours</p>
                    <p className="text-sm text-muted-foreground">Monday – Saturday: 9 AM – 8 PM IST<br />Sunday: 10 AM – 5 PM IST</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-bold text-foreground">Quick Links</h3>
              <ul className="mt-4 space-y-2">
                {[
                  { label: "Track Your Order", href: "/orders" },
                  { label: "Refund & Return Policy", href: "/refund-policy" },
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms & Conditions", href: "/terms" },
                ].map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm font-medium text-link transition hover:underline">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
