import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ApprovedIn — Vendor Compliance for Florida CAMs',
  description: 'Track vendor certificates of insurance, trade licenses, and corporate filings. Get alerted before anything expires.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
