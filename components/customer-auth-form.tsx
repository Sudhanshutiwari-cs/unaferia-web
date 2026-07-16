"use client"

import type React from "react"
import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Phone, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { signUpCustomer } from "@/app/actions/customer-auth"
import { isValidPhone, normalizePhone, phoneToEmail } from "@/lib/auth-utils"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function CustomerAuthFormInner({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSignup = mode === "signup"
  const redirectTo = searchParams.get("redirect") || "/"

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
    // On success the browser redirects — no need to set loading false
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const cleanPhone = normalizePhone(phone)
    if (!isValidPhone(cleanPhone)) {
      setError("Enter a valid 10-digit mobile number.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setLoading(true)

    try {
      if (isSignup) {
        const result = await signUpCustomer({ fullName, phone: cleanPhone, password })
        if (!result.ok) {
          setError(result.error)
          setLoading(false)
          return
        }
      }

      // Sign in (for both flows) so a session is established immediately.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: phoneToEmail(cleanPhone),
        password,
      })

      if (signInError) {
        setError(
          isSignup
            ? "Account created, but sign-in failed. Please try logging in."
            : "Invalid mobile number or password.",
        )
        setLoading(false)
        return
      }

      router.push(redirectTo || "/")
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-xl sm:p-8 lg:p-10">
      <Link href="/" className="flex flex-col items-center leading-none">
        <span className="text-2xl font-bold tracking-tight text-navy">SHOURYA</span>
        <span className="text-2xl font-bold tracking-tight text-brand">QUEST</span>
      </Link>

      <div className="mt-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          {isSignup ? "Create your account" : "Sign in"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSignup ? "Sign up with your mobile number to start shopping" : "Use your mobile number and password"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
        {isSignup && (
          <div className="flex flex-col gap-2">
            <label htmlFor="fullName" className="text-sm font-semibold text-foreground">
              Full Name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-lg border border-input bg-background py-3 pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="phone" className="text-sm font-semibold text-foreground">
            Mobile Number
          </label>
          <div className="relative flex items-stretch">
            <span className="flex items-center gap-1 rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm font-medium text-foreground">
              <Phone className="size-4 text-muted-foreground" aria-hidden="true" />
              +91
            </span>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit mobile number"
              className="w-full rounded-r-lg border border-input bg-background py-3 px-4 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-semibold text-foreground">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? "Create a password (min 6 chars)" : "Enter your password"}
              className="w-full rounded-lg border border-input bg-background py-3 pl-11 pr-11 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
            >
              {showPassword ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-lg bg-navy py-3.5 text-sm font-semibold text-white transition hover:bg-navy-2 disabled:opacity-70"
        >
          {loading ? "Please wait..." : isSignup ? "Create Account" : "Login"}
        </button>
      </form>

      {/* Divider */}
      <div className="mt-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or continue with</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Google sign-in */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="mt-4 flex w-full items-center justify-center gap-3 rounded-lg border border-input bg-background py-3 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
      >
        {googleLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <GoogleIcon />
        )}
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </button>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-link hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to Shourya Quest?{" "}
            <Link href="/signup" className="font-semibold text-link hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  )
}

export function CustomerAuthForm({ mode }: { mode: "login" | "signup" }) {
  return (
    <Suspense fallback={<div className="w-full max-w-md animate-pulse rounded-2xl bg-card p-8 sm:p-10" style={{ minHeight: 480 }} />}>
      <CustomerAuthFormInner mode={mode} />
    </Suspense>
  )
}
