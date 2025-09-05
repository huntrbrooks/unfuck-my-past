import type React from "react"
import type { Metadata } from "next"
import "./globals.css" // Import globals.css at the top of the file
import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Mindful Journal - AI-Powered Personal Reflection",
  description: "Write, reflect, and gain insights with your personal AI-powered journal",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
