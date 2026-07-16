"use client"

import { useState } from "react"
import { Mail, ArrowRight, Check } from "lucide-react"
import { subscribeToNewsletter } from "@/app/actions/newsletter"

export function NewsletterSection() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "already" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus("loading")
    const result = await subscribeToNewsletter(email)
    if (result.success) {
      setStatus(result.alreadySubscribed ? "already" : "success")
    } else {
      setErrorMsg(result.error)
      setStatus("error")
    }
  }

  const done = status === "success" || status === "already"

  return (
    <section className="border-t border-white/10 bg-navy-2">
      <div className="mx-auto max-w-[1400px] px-4 py-10">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          {/* Copy */}
          <div className="flex items-start gap-4">
            <span className="hidden shrink-0 items-center justify-center rounded-full bg-brand/20 p-3 md:flex">
              <Mail className="h-6 w-6 text-brand" aria-hidden="true" />
            </span>
            <div>
              <p className="text-lg font-bold text-white">Stay in the loop</p>
              <p className="mt-0.5 max-w-sm text-sm text-white/60">
                Get exclusive deals, new arrivals and special offers delivered straight to your inbox.
              </p>
            </div>
          </div>

          {/* Form */}
          {done ? (
            <div className="flex items-center gap-2 rounded-full bg-success/15 px-5 py-3 text-sm font-medium text-success">
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
              {status === "already"
                ? "You're already subscribed — thanks!"
                : "You're subscribed! Check your inbox soon."}
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex w-full max-w-md items-center gap-2"
              noValidate
            >
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden="true" />
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle") }}
                  className={`w-full rounded-full border bg-white/10 py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand/60
                    ${status === "error" ? "border-red-500" : "border-white/20"}`}
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition hover:brightness-95 disabled:opacity-60"
              >
                {status === "loading" ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-foreground border-t-transparent" />
                ) : (
                  <>Subscribe <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></>
                )}
              </button>
            </form>
          )}
        </div>

        {status === "error" && (
          <p className="mt-2 text-center text-xs text-red-400 md:text-right">{errorMsg}</p>
        )}
      </div>
    </section>
  )
}
