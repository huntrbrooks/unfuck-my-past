import "@/styles/globals.css"
import { Inter, Fredoka as Fredoka_One } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import type React from "react"

const inter = Inter({ subsets: ["latin"] })
const fredokaOne = Fredoka_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-fredoka",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={fredokaOne.variable}>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" disableSystemTheme>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.app'
    };
