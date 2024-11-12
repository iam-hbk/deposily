import { Metadata } from 'next'
import { Urbanist as FontSans, Bebas_Neue } from "next/font/google"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server";

import { cn } from "@/lib/utils"
import { hasEnvVars } from "@/lib/supabase/check-env-vars"
import Providers from "@/components/providers"
import { EnvVarWarning } from "@/components/env-var-warning"
import HeaderAuth from "@/components/header-auth"
import { ThemeSwitcher } from "@/components/theme-switcher"

import "./globals.css"

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontBebas = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-bebas",
  weight: ["400"],
})

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Deposily",
  description: "Manage deposits into your banking accounts",
}

async function getUser() {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontBebas.variable
        )}
      >
        <Providers>
          <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b border-b-foreground/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center space-x-2">
                  <Image
                    src="/logo-no-text.svg"
                    alt="Deposily Logo"
                    width={32}
                    height={32}
                    className="rounded-lg dark:filter dark:grayscale dark:invert"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                  <span className="text-2xl font-bold text-primary font-bebas">
                    Deposily
                  </span>
                </Link>
                <div className="flex items-center space-x-4">
                  {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth user={user} />}
                  <ThemeSwitcher />
                </div>
              </div>
            </header>
            <main className="flex-1">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}