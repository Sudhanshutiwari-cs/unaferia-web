import Link from "next/link"
import { Play, Apple } from "lucide-react"
import { NewsletterSection } from "@/components/newsletter-section"

type IconProps = { className?: string }

function Facebook({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
    </svg>
  )
}

function Instagram({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function Twitter({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.22-6.82-5.97 6.82H1.66l7.73-8.84L1.24 2.25H8.06l4.71 6.23 5.47-6.23Zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64Z" />
    </svg>
  )
}

function Youtube({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.11-2.12C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.39.53A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.11 2.12c1.89.53 9.39.53 9.39.53s7.5 0 9.39-.53a3 3 0 0 0 2.11-2.12A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
    </svg>
  )
}

const columns = [
  {
    title: "Get to Know Us",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "#" },
      { label: "Press Releases", href: "#" },
      { label: "Shourya Quest Cares", href: "#" },
      { label: "Gift a Smile", href: "#" },
    ],
  },
  {
    title: "Customer Policies",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "Refund & Return Policy", href: "/refund-policy" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "100% Purchase Protection", href: "#" },
    ],
  },
  {
    title: "Let Us Help You",
    links: [
      { label: "Your Account", href: "/profile" },
      { label: "Track Your Orders", href: "/orders" },
      { label: "Your Wishlist", href: "/wishlist" },
      { label: "Returns Centre", href: "/refund-policy" },
      { label: "Help", href: "/contact" },
    ],
  },
]

const socials = [
  { icon: Facebook, label: "Facebook",  href: "https://www.facebook.com/shouryaquest" },
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/shouryaquest" },
  { icon: Twitter,  label: "X (Twitter)", href: "https://x.com/shouryaquest" },
  { icon: Youtube,  label: "YouTube",   href: "https://www.youtube.com/@shouryaquest" },
]

export function SiteFooter() {
  return (
    <footer className="bg-navy text-white">
      {/* Newsletter */}
      <NewsletterSection />

      <div className="mx-auto max-w-[1400px] px-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-5">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold">SHOURYA</span>
              <span className="text-lg font-bold text-brand">QUEST</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Shourya Quest is your one-stop destination for online shopping in India. Shop from a
              wide range of products with great deals, secure payments and fast delivery.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-sm font-bold text-white">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-white/70 transition hover:text-white hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* App */}
          <div>
            <h3 className="mb-3 text-sm font-bold text-white">Download the App</h3>
            <p className="mb-3 text-sm text-white/70">
              Get the Shourya Quest app on your mobile
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="#"
                className="flex items-center gap-2 rounded-md border border-white/20 bg-black px-3 py-2 transition hover:bg-white/10"
              >
                <Play className="h-6 w-6 fill-white" aria-hidden="true" />
                <span className="leading-tight">
                  <span className="block text-[10px] text-white/70">GET IT ON</span>
                  <span className="block text-sm font-semibold">Google Play</span>
                </span>
              </a>
              <a
                href="#"
                className="flex items-center gap-2 rounded-md border border-white/20 bg-black px-3 py-2 transition hover:bg-white/10"
              >
                <Apple className="h-6 w-6" aria-hidden="true" />
                <span className="leading-tight">
                  <span className="block text-[10px] text-white/70">Download on the</span>
                  <span className="block text-sm font-semibold">App Store</span>
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Socials */}
        <div className="mt-8 flex gap-4 border-t border-white/10 pt-6">
          {socials.map((s) => {
            const Icon = s.icon
            return (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-brand hover:text-brand-foreground"
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </a>
            )
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 bg-navy-2">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-white/70 sm:flex-row">
          <div className="flex flex-wrap gap-4">
            <Link href="/terms" className="hover:text-white hover:underline">Terms &amp; Conditions</Link>
            <Link href="/privacy" className="hover:text-white hover:underline">Privacy Policy</Link>
            <Link href="/refund-policy" className="hover:text-white hover:underline">Refund &amp; Return Policy</Link>
            <Link href="/contact" className="hover:text-white hover:underline">Contact Us</Link>
          </div>
          <p>© 2025 Shourya Quest. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
