import Link from 'next/link'
import Footer from '@/components/Footer'

export default function OrderSuccess() {
  return (
    <>
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', textAlign: 'center', padding: '24px' }}>
        <span style={{ fontFamily: 'var(--font-script)', fontSize: '56px', color: 'var(--gold)' }}>Order Placed!</span>
        <p style={{ color: 'var(--brown-soft)', fontSize: '15px', maxWidth: '400px', lineHeight: 1.8 }}>
          Thank you for your order. We&apos;ll start crafting it with love and update you soon. 🌸
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
          <Link href="/shop"><button className="btn-primary">Continue Shopping</button></Link>
          <Link href="/account"><button className="btn-outline">My Account</button></Link>
        </div>
      </div>
      <Footer />
    </>
  )
}