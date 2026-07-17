import type { Metadata } from "next"
import { SiteFooter } from "@/components/site-footer"
import { getPageSeo, buildMetadata } from "@/lib/seo"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("privacy")
  return buildMetadata(seo, "/privacy")
}

const sections = [
  {
    id: "overview",
    title: "1. Overview",
    content: `Unaferia Private Limited ("we", "us", or "our") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights with respect to that data.

This Policy applies to all users of the Unaferia website and mobile application. By using our services you consent to the practices described in this Policy.`,
  },
  {
    id: "data-collected",
    title: "2. Information We Collect",
    content: `We collect information in the following ways:

Information you provide directly
• Account details: name, email address, phone number, date of birth, and profile picture.
• Delivery addresses: saved and newly entered shipping addresses.
• Payment information: we do not store full card numbers; payments are handled by PCI-DSS compliant third-party processors.
• Reviews, ratings, and messages you post on the platform.
• Communications with our customer support team.

Information collected automatically
• Device and browser details (IP address, operating system, browser type).
• Usage data: pages viewed, search queries, clicks, and time spent on the platform.
• Location data if you grant permission (used to show nearby delivery estimates).
• Cookies and similar tracking technologies — see Section 5.

Information from third parties
• Social login data if you choose to sign in with a third-party provider.
• Fraud detection signals from our payment and security partners.`,
  },
  {
    id: "use",
    title: "3. How We Use Your Information",
    content: `We use your information to:

• Process and fulfil orders, and communicate order status.
• Personalise your shopping experience and product recommendations.
• Send transactional emails, order updates, and security alerts.
• Send promotional communications if you have opted in (you may opt out at any time).
• Improve our platform through analytics, A/B testing, and research.
• Detect and prevent fraud, abuse, and security incidents.
• Comply with legal obligations and respond to lawful requests from authorities.`,
  },
  {
    id: "sharing",
    title: "4. Information Sharing",
    content: `We do not sell your personal information. We may share it with:

• Sellers — limited to the information required to fulfil your order (e.g. name, delivery address).
• Logistics partners — for delivery and tracking purposes.
• Payment processors — to process transactions securely.
• Analytics and advertising partners — in aggregated or anonymised form.
• Legal authorities — when required by law, court order, or to protect our rights.
• Business transferees — in the event of a merger, acquisition, or sale of assets, with advance notice to you.

All third parties are contractually required to handle your data in accordance with applicable data protection laws.`,
  },
  {
    id: "cookies",
    title: "5. Cookies & Tracking",
    content: `We use cookies, web beacons, and similar technologies to:

• Keep you signed in between sessions.
• Remember your preferences (language, region, cart contents).
• Measure traffic and user behaviour for analytics.
• Deliver relevant advertisements on third-party sites.

You can control cookies through your browser settings. Disabling cookies may affect certain features of the platform. For more information see our Cookie Policy or manage your preferences in the app settings.`,
  },
  {
    id: "retention",
    title: "6. Data Retention",
    content: `We retain your personal data for as long as your account is active or as needed to provide services. We also retain data to comply with legal obligations, resolve disputes, and enforce agreements.

If you delete your account, we will delete or anonymise your personal data within 30 days, except where we are required by law to retain it for longer.`,
  },
  {
    id: "rights",
    title: "7. Your Rights",
    content: `Under applicable Indian data protection law (DPDP Act 2023) and other regulations, you have the right to:

• Access the personal data we hold about you.
• Correct inaccurate or incomplete data.
• Request deletion of your personal data ("right to be forgotten").
• Object to or restrict certain processing activities.
• Data portability — receive your data in a structured, machine-readable format.
• Withdraw consent at any time where processing is based on consent.

To exercise any of these rights, email privacy@unaferia.in with your registered email address. We will respond within 30 days.`,
  },
  {
    id: "security",
    title: "8. Security",
    content: `We implement appropriate technical and organisational measures to protect your data against unauthorised access, alteration, disclosure, or destruction. These include encryption in transit and at rest, multi-factor authentication for staff, and regular security audits.

No method of transmission over the internet is completely secure. While we strive to protect your data, we cannot guarantee absolute security. Please notify us immediately at security@unaferia.in if you suspect a security breach.`,
  },
  {
    id: "children",
    title: "9. Children's Privacy",
    content: `Our platform is not directed at children under the age of 18. We do not knowingly collect personal information from minors. If we become aware that a minor has provided us with personal data, we will delete it promptly. If you believe a minor has registered on our platform, please contact us at privacy@unaferia.in.`,
  },
  {
    id: "changes",
    title: "10. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. Material changes will be communicated via email or a prominent notice on the platform at least 15 days before taking effect. Continued use of the platform after changes take effect constitutes your acceptance of the revised Policy.`,
  },
  {
    id: "contact",
    title: "11. Contact Our Privacy Team",
    content: `For questions, concerns, or requests relating to this Policy, contact our Data Protection Officer:

Email: privacy@unaferia.in
Post: Data Protection Officer, Unaferia Pvt. Ltd., 14th Floor, Tower B, DLF Cyber City, Gurugram, Haryana – 122002, India`,
  },
]

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-navy py-14 text-white">
        <div className="mx-auto max-w-[1400px] px-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">Legal</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Privacy Policy</h1>
          <p className="mt-3 text-sm text-white/60">Last updated: 1 January 2025</p>
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
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} className="block text-sm text-muted-foreground transition hover:text-foreground hover:underline">
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
              Your privacy matters to us. This Policy is written in plain language so you understand exactly what we do with your data.
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
