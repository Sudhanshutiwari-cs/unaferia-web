"use client"

import { useState } from "react"
import { Mail } from "lucide-react"

export function Newsletter() {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubscribed(true)
    setEmail("")
  }

  return (
    <section className="bg-navy-2">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-4 px-4 py-6 md:flex-row md:justify-between">
        <div className="flex items-center gap-3 text-white">
          <Mail className="hidden h-9 w-9 shrink-0 sm:block" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-bold">Subscribe to our Newsletter</h2>
            <p className="text-sm text-white/70">Get updates on the latest offers and new arrivals</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex w-full max-w-md items-stretch gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            aria-label="Email address"
            className="h-10 min-w-0 flex-1 rounded-md bg-white px-3 text-sm text-navy placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            type="submit"
            className="h-10 rounded-md bg-brand px-5 text-sm font-bold text-brand-foreground transition hover:brightness-95"
          >
            {subscribed ? "Subscribed" : "Subscribe"}
          </button>
        </form>
      </div>
    </section>
  )
}
