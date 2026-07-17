import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { CartProvider } from '@/components/cart-provider'
import { GlobalHeader } from '@/components/global-header'
import { BottomNav } from '@/components/bottom-nav'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Unaferia - Online Shopping for Electronics, Fashion & More',
  description:
    'Unaferia is your one-stop destination for online shopping in India. Great deals, secure payments and fast delivery on millions of products.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`light ${inter.variable} bg-background`}>
      <body className="font-sans antialiased pb-14 sm:pb-0">
        <CartProvider>
          <GlobalHeader />
          {children}
          <BottomNav />
        </CartProvider>
        <Toaster position="bottom-center" richColors closeButton />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
