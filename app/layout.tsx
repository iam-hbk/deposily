import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Urbanist as FontSans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Deposily",
  description: "Manage deposits into your banking accounts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col items-center">
            <div className="flex-1 w-full flex flex-col  items-center relative ">
              <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 border sticky top-0 bg-transparent backdrop-blur-md z-10">
                <div className="w-full flex justify-between items-center p-3 px-5 text-sm gap-3">
                  <div className="flex gap-5 items-center font-semibold">
                    <Link className="flex items-center justify-center" href="/">
                      <Image
                        src={"/logo-no-text.svg"}
                        alt="Deposily Logo"
                        width={62}
                        height={62}
                        className="rounded-lg dark:filter dark:grayscale dark:invert"
                      />
                      <span className="ml-2 text-2xl font-bold text-primary">
                        Deposily
                      </span>
                    </Link>
                  </div>
                  <div className="flex flex-row items-center space-x-4">
                    {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
                    <ThemeSwitcher />
                  </div>
                </div>
              </nav>
              <div className="flex flex-col w-full">{children}</div>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
