import type { Metadata } from "next"
import { SiteFooter } from "@/components/site-footer"
import { getPageSeo, buildMetadata } from "@/lib/seo"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("terms")
  return buildMetadata(seo, "/terms")
}

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: `By accessing or using the Shourya Quest platform (website, mobile application, or any associated service), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use our services.

These Terms constitute a legally binding agreement between you and Shourya Quest Private Limited, a company incorporated under the laws of India. We reserve the right to update these Terms at any time, and continued use of the platform after any changes constitutes your acceptance of the new Terms.`,
  },
  {
    id: "account",
    title: "2. User Accounts",
    content: `To place orders or access certain features, you must create an account. You agree to:

• Provide accurate, current, and complete information during registration.
• Maintain the confidentiality of your password and take responsibility for all activities under your account.
• Notify us immediately at support@shouryaquest.in if you suspect unauthorised use of your account.
• Not transfer your account to any third party.

Shourya Quest reserves the right to suspend or terminate accounts that violate these Terms or that are inactive for more than 24 months.`,
  },
  {
    id: "products",
    title: "3. Products and Pricing",
    content: `Shourya Quest acts as a marketplace facilitating transactions between buyers and third-party sellers. We do not manufacture or warehouse most products listed on the platform.

• Product descriptions, images, and specifications are provided by sellers. While we make reasonable efforts to verify accuracy, Shourya Quest does not guarantee that descriptions are error-free.
• Prices are subject to change without notice. The price displayed at the time of placing an order is the price you will be charged.
• In the event of a pricing error, Shourya Quest reserves the right to cancel orders placed at the incorrect price and will notify you promptly.`,
  },
  {
    id: "orders",
    title: "4. Orders and Payments",
    content: `By placing an order you represent that you are authorised to use the chosen payment method. All payments are processed securely by our payment partners.

• Order confirmation does not constitute acceptance. Acceptance occurs when the goods are dispatched.
• We reserve the right to refuse or cancel orders at any time for reasons including product unavailability, pricing errors, or suspected fraud.
• Cash on Delivery (COD) is available at our discretion and may not be offered in all regions or for all products.`,
  },
  {
    id: "delivery",
    title: "5. Delivery",
    content: `Estimated delivery timelines are provided at checkout and are subject to the seller's processing time, courier availability, and your location.

• Shourya Quest is not liable for delays caused by circumstances beyond our reasonable control, including natural disasters, strikes, or courier disruptions.
• Risk of loss passes to you upon delivery to the address provided.
• If a delivery fails due to an incorrect or incomplete address provided by you, re-delivery charges may apply.`,
  },
  {
    id: "prohibited",
    title: "6. Prohibited Uses",
    content: `You agree not to:

• Use the platform for any unlawful purpose or in a manner that violates any applicable local, national, or international law.
• Post or transmit any material that is defamatory, offensive, or infringes the intellectual property rights of any third party.
• Attempt to gain unauthorised access to any part of the platform, its servers, or networks.
• Use automated tools, bots, or scripts to scrape, crawl, or interact with the platform without prior written consent.
• Resell products purchased on the platform in violation of applicable law or these Terms.`,
  },
  {
    id: "ip",
    title: "7. Intellectual Property",
    content: `All content on the Shourya Quest platform — including but not limited to text, graphics, logos, button icons, images, audio clips, and software — is the property of Shourya Quest Pvt. Ltd. or its content suppliers and is protected by applicable intellectual property laws.

You may not reproduce, distribute, or create derivative works without our express written permission. Sellers retain ownership of content they upload but grant Shourya Quest a royalty-free licence to display and use it on the platform.`,
  },
  {
    id: "liability",
    title: "8. Limitation of Liability",
    content: `To the fullest extent permitted by applicable law, Shourya Quest shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of, or inability to use, the platform.

Our total liability to you for any claim arising from these Terms or your use of the platform shall not exceed the amount you paid for the specific product or service giving rise to the claim.

This limitation does not exclude liability for death or personal injury caused by negligence, or for fraud or fraudulent misrepresentation.`,
  },
  {
    id: "governing",
    title: "9. Governing Law and Dispute Resolution",
    content: `These Terms are governed by the laws of India. Any disputes arising out of or in connection with these Terms shall first be attempted to be resolved through good-faith negotiation.

If negotiation fails, disputes shall be subject to the exclusive jurisdiction of the courts of Gurugram, Haryana. Nothing in this clause shall prevent either party from seeking injunctive or other equitable relief from a court of competent jurisdiction.`,
  },
  {
    id: "contact",
    title: "10. Contact",
    content: `If you have questions about these Terms, please contact our legal team at legal@shouryaquest.in or write to us at:

Shourya Quest Private Limited
14th Floor, Tower B, DLF Cyber City
Gurugram, Haryana – 122002, India`,
  },
]

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-navy py-14 text-white">
        <div className="mx-auto max-w-[1400px] px-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">Legal</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Terms &amp; Conditions</h1>
          <p className="mt-3 text-sm text-white/60">Last updated: 1 January 2025</p>
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* TOC — sticky on desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 rounded-xl border border-border bg-card p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Contents</p>
              <nav aria-label="Table of contents">
                <ul className="space-y-1.5">
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className="block text-sm text-muted-foreground transition hover:text-foreground hover:underline"
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>

          {/* Content */}
          <article className="rounded-xl border border-border bg-card p-6 sm:p-8">
            <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
              Please read these Terms and Conditions carefully before using the Shourya Quest platform. These Terms affect your legal rights and obligations.
            </p>
            <div className="space-y-10">
              {sections.map((s) => (
                <section key={s.id} id={s.id}>
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
            </div>
          </article>
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}
