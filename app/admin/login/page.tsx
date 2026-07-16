import Image from "next/image"
import { Package, LineChart, ShieldCheck, Headphones } from "lucide-react"
import { AdminLoginForm } from "@/components/admin/admin-login-form"

const features = [
  {
    icon: Package,
    title: "Manage Everything",
    description: "Add, edit and manage products, categories and inventory.",
  },
  {
    icon: LineChart,
    title: "Track Performance",
    description: "Get real-time insights on sales, orders and customers.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Reliable",
    description: "Your data is safe with our advanced security and backup.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Our support team is always here to help you.",
  },
]

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      {/* Left panel */}
      <section className="relative flex w-full items-center overflow-hidden bg-navy px-8 py-10 text-white lg:h-screen lg:w-1/2 lg:px-16">
        {/* Product image (center-right, vertically centered) */}
        <Image
          src="/images/admin-hero.png"
          alt="Assortment of products including headphones, a smartwatch, sneakers and a handbag"
          width={640}
          height={420}
          className="pointer-events-none absolute -right-4 top-1/2 hidden w-[42%] max-w-lg -translate-y-1/2 select-none xl:block"
          priority
        />
        <div className="relative z-10 w-full max-w-md xl:max-w-sm">
          <h1 className="text-balance text-4xl font-bold leading-tight sm:text-5xl">
            Welcome Back,
            <br />
            <span className="text-brand">Admin</span>!
          </h1>
          <p className="mt-4 max-w-sm text-pretty text-base leading-relaxed text-white/70">
            Sign in to access your dashboard, manage products, orders and grow your business.
          </p>

          {/* Image on tablet/mobile (inline, since it can't sit beside a narrow column) */}
          <div className="mt-6 xl:hidden">
            <Image
              src="/images/admin-hero.png"
              alt=""
              width={640}
              height={420}
              className="w-full max-w-sm"
              aria-hidden="true"
            />
          </div>

          <ul className="mt-8 flex flex-col gap-5">
            {features.map((feature) => (
              <li key={feature.title} className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
                  <feature.icon className="size-5 text-white" />
                </span>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="mt-0.5 max-w-xs text-sm leading-relaxed text-white/60">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Right panel */}
      <section className="flex w-full flex-1 items-center justify-center overflow-y-auto bg-background px-6 py-10 lg:h-screen lg:w-1/2">
        <AdminLoginForm />
      </section>
    </main>
  )
}
