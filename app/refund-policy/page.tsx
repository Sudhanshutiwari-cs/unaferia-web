import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { getPageSeo, buildMetadata } from "@/lib/seo"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("refund-policy")
  return buildMetadata(seo, "/refund-policy")
}
import { RotateCcw, Clock, CheckCircle, XCircle, Truck, CreditCard, AlertCircle } from "lucide-react"

const highlights = [
  { icon: RotateCcw, title: "Easy Returns", description: "Initiate a return within 7–30 days depending on category." },
  { icon: Clock, title: "Quick Refunds", description: "Refunds processed within 5–7 business days." },
  { icon: Truck, title: "Free Pickup", description: "We arrange free reverse pickup for eligible returns." },
  { icon: CreditCard, title: "Refund to Source", description: "Refunds go back to your original payment method." },
]

const categories = [
  { category: "Electronics & Mobiles", returnWindow: "7 days", conditions: "Unused, original packaging, all accessories included" },
  { category: "Computers & Laptops", returnWindow: "7 days", conditions: "Unused, original packaging, all accessories included" },
  { category: "Large Appliances", returnWindow: "7 days", conditions: "Unused, damaged/defective only" },
  { category: "Fashion & Clothing", returnWindow: "30 days", conditions: "Unworn, unwashed, tags intact" },
  { category: "Footwear", returnWindow: "30 days", conditions: "Unused, original box, tags intact" },
  { category: "Beauty & Skincare", returnWindow: "10 days", conditions: "Unopened, sealed original packaging" },
  { category: "Books & Stationery", returnWindow: "10 days", conditions: "Damaged or wrong item only" },
  { category: "Toys & Games", returnWindow: "10 days", conditions: "Unused, original packaging" },
  { category: "Sports & Fitness", returnWindow: "10 days", conditions: "Unused, original packaging" },
  { category: "Home & Kitchen", returnWindow: "10 days", conditions: "Unused, original packaging" },
  { category: "Jewellery & Watches", returnWindow: "10 days", conditions: "Unused, original packaging, certificate included" },
  { category: "Food & Grocery", returnWindow: "Non-returnable", conditions: "Damaged or expired items eligible for refund" },
]

const sections = [
  {
    id: "eligibility",
    title: "Return Eligibility",
    content: `A product is eligible for return if:

• It was delivered in a damaged or defective condition.
• It is different from what was described on the product page.
• Parts or accessories are missing from the package.
• The return is initiated within the category-specific return window (see table below).

Products are NOT eligible for return if:

• The return window has expired.
• The item shows signs of use, wear, or installation.
• Original packaging, tags, or accessories are missing.
• The item belongs to a non-returnable category (e.g., digital goods, personalised items, perishables).`,
  },
  {
    id: "process",
    title: "How to Initiate a Return",
    content: `Returning an order is simple:

1. Go to My Orders in your account.
2. Select the order and the specific item you wish to return.
3. Choose a reason for return and upload photos if the item is damaged.
4. Select a convenient date for reverse pickup — our logistics partner will collect the item.
5. Once the returned item is received and inspected, your refund will be initiated.

Alternatively, contact our support team at support@unaferia.in or call 1800-123-4567 (toll-free).`,
  },
  {
    id: "refund-timeline",
    title: "Refund Timelines",
    content: `After the returned item passes quality inspection, refunds are processed as follows:

• Credit / Debit Card: 5–7 business days
• Net Banking: 3–5 business days
• UPI: 1–3 business days
• Unaferia Wallet Credit: Within 24 hours
• Cash on Delivery (COD) — NEFT to bank account: 5–7 business days

Refund timelines may vary slightly depending on your bank. If you have not received your refund within the above windows, please contact us.`,
  },
  {
    id: "exchange",
    title: "Exchange Policy",
    content: `Exchanges are available for eligible products (primarily fashion, footwear, and electronics) where the product:

• Is defective or damaged.
• Was delivered in the wrong size, colour, or variant.

To request an exchange, follow the same process as a return and select "Exchange" as the resolution. If the exact replacement is out of stock, you will receive a full refund.`,
  },
  {
    id: "seller",
    title: "Seller Returns",
    content: `For products sold by third-party sellers on our marketplace, the return and refund policy of the individual seller may apply in addition to our platform policy. The seller's return policy is always displayed on the product page before purchase.

If a seller refuses a valid return request that falls within our platform policy, please escalate to Unaferia support and we will step in to resolve the matter at support@unaferia.in.`,
  },
  {
    id: "cancellations",
    title: "Order Cancellations",
    content: `You may cancel an order any time before it is dispatched. To cancel:

1. Go to My Orders and click "Cancel Order".
2. Select a reason for cancellation.

Once dispatched, orders cannot be cancelled — you may initiate a return after delivery.

Refunds for cancelled orders are processed within 1–3 business days to the original payment method. For COD orders that are cancelled before delivery, no refund is applicable as no payment was made.`,
  },
]

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-navy py-14 text-white">
        <div className="mx-auto max-w-[1400px] px-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">Customer Care</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Refund &amp; Return Policy</h1>
          <p className="mt-3 text-sm text-white/60">Last updated: 1 January 2025</p>
        </div>
      </section>

      {/* Highlights */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 divide-x divide-y divide-border px-4 sm:grid-cols-4 sm:divide-y-0">
          {highlights.map((h) => (
            <div key={h.title} className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span className="flex size-12 items-center justify-center rounded-xl bg-brand/10">
                <h.icon className="size-5 text-brand" aria-hidden="true" />
              </span>
              <p className="font-semibold text-foreground">{h.title}</p>
              <p className="text-xs text-muted-foreground">{h.description}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 rounded-xl border border-border bg-card p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Contents</p>
              <nav aria-label="Table of contents">
                <ul className="space-y-1.5">
                  <li><a href="#category-table" className="block text-sm text-muted-foreground transition hover:text-foreground hover:underline">Return Windows by Category</a></li>
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} className="block text-sm text-muted-foreground transition hover:text-foreground hover:underline">
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="mt-6 rounded-lg bg-brand/10 p-4">
                <p className="text-sm font-semibold text-foreground">Need help with a return?</p>
                <p className="mt-1 text-xs text-muted-foreground">Our team is ready to assist you.</p>
                <Link href="/contact" className="mt-3 block rounded-full bg-brand px-4 py-2 text-center text-xs font-semibold text-brand-foreground transition hover:brightness-95">
                  Contact Support
                </Link>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="space-y-8">
            {/* Category table */}
            <section id="category-table" className="rounded-xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-lg font-bold text-foreground">Return Windows by Category</h2>
              <p className="mt-1 text-sm text-muted-foreground">Return eligibility varies by product category. Check the table below or refer to the product page.</p>

              {/* Mobile cards */}
              <div className="mt-6 flex flex-col gap-3 sm:hidden">
                {categories.map((c) => (
                  <div key={c.category} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-foreground">{c.category}</p>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        c.returnWindow === "Non-returnable"
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {c.returnWindow}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{c.conditions}</p>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="mt-6 hidden overflow-x-auto sm:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="pb-3 pr-6 font-medium">Category</th>
                      <th className="pb-3 pr-6 font-medium">Return Window</th>
                      <th className="pb-3 font-medium">Conditions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {categories.map((c) => (
                      <tr key={c.category} className="hover:bg-muted/30">
                        <td className="py-3 pr-6 font-medium text-foreground">{c.category}</td>
                        <td className="py-3 pr-6">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            c.returnWindow === "Non-returnable"
                              ? "bg-red-100 text-red-600"
                              : "bg-green-100 text-green-700"
                          }`}>
                            {c.returnWindow}
                          </span>
                        </td>
                        <td className="py-3 text-muted-foreground">{c.conditions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Eligible / Not eligible quick summary */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-5 text-green-600" aria-hidden="true" />
                  <p className="font-semibold text-green-800">Eligible for Return</p>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm text-green-700">
                  <li>• Damaged or defective on arrival</li>
                  <li>• Wrong item delivered</li>
                  <li>• Missing parts or accessories</li>
                  <li>• Item not matching description</li>
                  <li>• Return within category window</li>
                </ul>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <div className="flex items-center gap-2">
                  <XCircle className="size-5 text-red-600" aria-hidden="true" />
                  <p className="font-semibold text-red-800">Not Eligible for Return</p>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm text-red-700">
                  <li>• Return window has expired</li>
                  <li>• Item shows signs of use</li>
                  <li>• Original packaging removed or damaged</li>
                  <li>• Non-returnable category</li>
                  <li>• Digital goods or personalised items</li>
                </ul>
              </div>
            </div>

            {/* Policy sections */}
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="rounded-xl border border-border bg-card p-6 sm:p-8">
                <h2 className="text-lg font-bold text-foreground">{s.title}</h2>
                <div className="mt-3 space-y-3">
                  {s.content.split("\n\n").map((para, i) => (
                    <p key={i} className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {para}
                    </p>
                  ))}
                </div>
              </section>
            ))}

            {/* CTA */}
            <div className="flex items-start gap-4 rounded-xl border border-brand/30 bg-brand/5 p-6">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
              <div>
                <p className="font-semibold text-foreground">Still have questions?</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  If you could not find the answer here, our customer support team is available Monday to Saturday, 9 AM – 8 PM IST.
                </p>
                <Link href="/contact" className="mt-3 inline-block rounded-full bg-brand px-6 py-2 text-sm font-semibold text-brand-foreground transition hover:brightness-95">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}
