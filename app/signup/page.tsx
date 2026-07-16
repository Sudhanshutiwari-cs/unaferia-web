import type { Metadata } from "next"
import { CustomerAuthForm } from "@/components/customer-auth-form"
import { getPageSeo, buildMetadata } from "@/lib/seo"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("signup")
  return buildMetadata(seo, "/signup")
}

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-10">
      <CustomerAuthForm mode="signup" />
    </main>
  )
}
