import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import { CartProvider } from '@/context/CartContext'

export const metadata: Metadata = {
  title: 'Crochetinggg — You Dream We Crochet',
  description: 'Handcrafted crochet pieces made with love',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Navbar />
          {children}
        </CartProvider>
      </body>
    </html>
  )
}