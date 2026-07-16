import type { Metadata } from "next"
import { SiteFooter } from "@/components/site-footer"
import { ShoppingBag, Truck, Shield, Star, Users, Package, TrendingUp, Award } from "lucide-react"
import { getPageSeo, buildMetadata } from "@/lib/seo"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("about")
  return buildMetadata(seo, "/about")
}

const stats = [
  { value: "50M+", label: "Happy Customers" },
  { value: "10M+", label: "Products Listed" },
  { value: "27,000+", label: "Pin Codes Served" },
  { value: "500+", label: "Brand Partners" },
]

const values = [
  {
    icon: ShoppingBag,
    title: "Customer First",
    description: "Every decision we make starts with the question: does this make our customers happier? From pricing to delivery, you are always our top priority.",
  },
  {
    icon: Shield,
    title: "Trust & Safety",
    description: "Secure payments, verified sellers, authentic products and a robust buyer protection programme so you can shop with complete confidence.",
  },
  {
    icon: Truck,
    title: "Fast & Reliable Delivery",
    description: "Our pan-India fulfilment network delivers to over 27,000 pin codes with same-day and next-day options available in major cities.",
  },
  {
    icon: Star,
    title: "Curated Quality",
    description: "Our team of experts vets every seller and product listing. If it's on Shourya Quest, you can trust that it meets our quality standards.",
  },
]

const team = [
  { name: "Arjun Mehta", role: "Co-Founder & CEO", initial: "AM" },
  { name: "Priya Singh", role: "Co-Founder & CTO", initial: "PS" },
  { name: "Rohan Verma", role: "Head of Operations", initial: "RV" },
  { name: "Sneha Kapoor", role: "Head of Customer Experience", initial: "SK" },
]

const milestones = [
  { year: "2018", title: "Founded", description: "Shourya Quest launched out of a small Gurugram office with a vision to democratise e-commerce in India." },
  { year: "2019", title: "First Million Orders", description: "Within 12 months we crossed 1 million orders, powered by word-of-mouth and exceptional customer service." },
  { year: "2021", title: "Pan-India Expansion", description: "Expanded our fulfilment network to 27,000+ pin codes, reaching Tier-2 and Tier-3 cities for the first time." },
  { year: "2023", title: "50 Million Customers", description: "Crossed 50 million registered customers and onboarded 500+ brand partners across 20+ categories." },
  { year: "2025", title: "The Next Chapter", description: "Launching same-day delivery in 50 cities, AI-powered recommendations, and a dedicated seller app." },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-navy py-20 text-white">
        <div className="mx-auto max-w-[1400px] px-4 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand">Our Story</p>
          <h1 className="text-3xl font-extrabold sm:text-4xl md:text-5xl">About Shourya Quest</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/75">
            We started with a simple belief: every Indian deserves access to great products at honest prices, delivered quickly and reliably to their doorstep. That belief drives everything we do.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 px-6 py-8 text-center">
              <span className="text-3xl font-extrabold text-brand sm:text-4xl">{s.value}</span>
              <span className="text-sm text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-[1400px] px-4 py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand">Our Mission</p>
            <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Building India&apos;s Most Trusted Marketplace</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Shourya Quest was born from a frustration shared by millions — the difficulty of finding genuine products at fair prices with dependable delivery. We set out to fix that.
            </p>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Today we are one of India&apos;s fastest-growing e-commerce platforms, serving customers from the metros to the most remote corners of the country. We partner with thousands of sellers — from global brands to local artisans — to bring an unmatched selection to your fingertips.
            </p>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              But we&apos;re more than a marketplace. We are a community of shoppers, sellers, and dreamers who believe commerce can be a force for good — creating livelihoods, reducing barriers, and connecting people to the things that matter to them.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Users, label: "50M+ Customers", color: "bg-blue-50 text-blue-600" },
              { icon: Package, label: "10M+ Products", color: "bg-brand/10 text-brand" },
              { icon: TrendingUp, label: "₹5,000 Cr+ GMV", color: "bg-green-50 text-green-600" },
              { icon: Award, label: "Best E-Commerce 2024", color: "bg-purple-50 text-purple-600" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 text-center">
                <span className={`flex size-12 items-center justify-center rounded-xl ${item.color}`}>
                  <item.icon className="size-6" aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-card border-y border-border py-16">
        <div className="mx-auto max-w-[1400px] px-4">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand">What We Stand For</p>
            <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Our Core Values</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-xl border border-border bg-background p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand/10">
                  <v.icon className="size-5 text-brand" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-bold text-foreground">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-[1400px] px-4 py-16">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">How We Got Here</p>
          <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Our Journey</h2>
        </div>
        <div className="relative mt-10">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 hidden h-full w-px bg-border sm:block sm:left-1/2" aria-hidden="true" />
          <div className="flex flex-col gap-8">
            {milestones.map((m, i) => (
              <div
                key={m.year}
                className={`relative flex items-start gap-6 sm:w-1/2 sm:gap-8 ${i % 2 === 0 ? "sm:ml-0 sm:pr-12" : "sm:ml-auto sm:flex-row-reverse sm:pl-12 sm:pr-0"}`}
              >
                {/* Dot */}
                <span className={`absolute hidden h-3 w-3 rounded-full bg-brand sm:block ${i % 2 === 0 ? "right-[-6px]" : "left-[-6px]"} top-1.5`} aria-hidden="true" />
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-extrabold text-brand-foreground sm:hidden">
                  {m.year.slice(2)}
                </div>
                <div className="flex-1 rounded-xl border border-border bg-card p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-brand">{m.year}</p>
                  <p className="mt-1 font-bold text-foreground">{m.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-card border-y border-border py-16">
        <div className="mx-auto max-w-[1400px] px-4">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand">The People Behind It</p>
            <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Our Leadership Team</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <div key={member.name} className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-6 text-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-navy text-lg font-extrabold text-white">
                  {member.initial}
                </span>
                <div>
                  <p className="font-bold text-foreground">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
