"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Star, StarHalf, CheckCircle2, Check } from "lucide-react"
import { useUser } from "@/hooks/use-user"
import { submitReview } from "@/app/actions/submit-review"
import type { ProductReview, ReviewSummary } from "@/lib/queries"

function Stars({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) {
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75
  return (
    <span className="flex items-center" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < full) return <Star key={i} className={`${size} fill-star text-star`} aria-hidden="true" />
        if (i === full && hasHalf) return <StarHalf key={i} className={`${size} fill-star text-star`} aria-hidden="true" />
        return <Star key={i} className={`${size} text-neutral-300`} aria-hidden="true" />
      })}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
}

export function ProductReviews({
  productId,
  productPath,
  reviews,
  summary,
}: {
  productId: string
  productPath: string
  reviews: ProductReview[]
  summary: ReviewSummary
}) {
  const { user } = useUser()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const maxCount = Math.max(...summary.distribution, 1)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (rating < 1) {
      setError("Please select a star rating.")
      return
    }
    startTransition(async () => {
      const res = await submitReview({ productId, rating, title, comment, productPath })
      if (!res.success) {
        setError(res.error ?? "Something went wrong.")
        return
      }
      setDone(true)
      setShowForm(false)
      setTitle("")
      setComment("")
      setRating(0)
      router.refresh()
      setTimeout(() => setDone(false), 3000)
    })
  }

  return (
    <section aria-labelledby="reviews-heading" className="rounded-lg bg-card p-4 sm:p-6">
      <h2 id="reviews-heading" className="mb-4 text-xl font-bold text-foreground">
        Ratings &amp; Reviews
      </h2>

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Summary */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-bold text-foreground">{summary.average.toFixed(1)}</span>
            <div>
              <Stars rating={summary.average} size="h-5 w-5" />
              <p className="mt-0.5 text-xs text-muted-foreground">
                {summary.total.toLocaleString("en-IN")} global rating{summary.total === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution[star - 1]
              const pct = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-12 shrink-0 text-link">{star} star</span>
                  <div className="h-4 flex-1 overflow-hidden rounded-sm border border-border bg-muted">
                    <div
                      className="h-full bg-star"
                      style={{ width: `${summary.total > 0 ? (count / maxCount) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right text-muted-foreground">{pct}%</span>
                </div>
              )
            })}
          </div>

          <div className="mt-5">
            {done && (
              <p className="mb-2 flex items-center gap-1.5 text-sm text-success">
                <Check className="h-4 w-4" aria-hidden="true" /> Thanks! Your review was posted.
              </p>
            )}
            {user ? (
              <button
                onClick={() => setShowForm((v) => !v)}
                className="w-full rounded-full border border-navy px-4 py-2 text-sm font-semibold text-navy transition hover:bg-muted"
              >
                {showForm ? "Cancel" : "Write a product review"}
              </button>
            ) : (
              <Link
                href={`/login?redirect=${encodeURIComponent(productPath)}`}
                className="block w-full rounded-full border border-navy px-4 py-2 text-center text-sm font-semibold text-navy transition hover:bg-muted"
              >
                Sign in to write a review
              </Link>
            )}
          </div>
        </div>

        {/* Form + list */}
        <div className="min-w-0">
          {showForm && user && (
            <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-border p-4">
              <p className="mb-2 text-sm font-medium text-foreground">Overall rating</p>
              <div className="mb-3 flex items-center gap-1" role="radiogroup" aria-label="Select a rating">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHover(s)}
                    onMouseLeave={() => setHover(0)}
                    aria-label={`${s} star${s === 1 ? "" : "s"}`}
                    aria-checked={rating === s}
                    role="radio"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        (hover || rating) >= s ? "fill-star text-star" : "text-neutral-300"
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>

              <label htmlFor="review-title" className="mb-1 block text-sm font-medium text-foreground">
                Add a headline
              </label>
              <input
                id="review-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's most important to know?"
                maxLength={120}
                className="mb-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
              />

              <label htmlFor="review-comment" className="mb-1 block text-sm font-medium text-foreground">
                Add a written review
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="What did you like or dislike? How did you use this product?"
                maxLength={2000}
                className="mb-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
              />

              {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-brand px-6 py-2 text-sm font-semibold text-brand-foreground transition hover:brightness-95 disabled:opacity-50"
              >
                {isPending ? "Submitting…" : "Submit review"}
              </button>
            </form>
          )}

          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No reviews yet. Be the first to share your thoughts on this product.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {reviews.map((r) => (
                <li key={r.id} className="py-4 first:pt-0">
                  <p className="text-sm font-semibold text-foreground">{r.reviewerName}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Stars rating={r.rating} />
                    {r.title && <span className="text-sm font-medium text-foreground">{r.title}</span>}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Reviewed on {formatDate(r.createdAt)}</span>
                    {r.isVerified && (
                      <span className="flex items-center gap-1 font-medium text-deal">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Verified Purchase
                      </span>
                    )}
                  </div>
                  {r.comment && <p className="mt-2 text-sm leading-relaxed text-foreground">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
