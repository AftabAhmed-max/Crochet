import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import { CartProvider } from '@/context/CartContext'

export const metadata: Metadata = {
  title: 'Crochetinggg — You Dream We Crochet',
  description: 'Handcrafted crochet pieces made with love',
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