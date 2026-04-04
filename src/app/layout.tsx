import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'IncidentIQ — AI Incident Management',
    template: '%s | IncidentIQ',
  },
  description: 'AI-powered incident management and post-mortem automation for modern engineering teams.',
  keywords: ['incident management', 'post-mortem', 'SRE', 'DevOps', 'AI', 'on-call'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://incidentiq.vercel.app',
    siteName: 'IncidentIQ',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}