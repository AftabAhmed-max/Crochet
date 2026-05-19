'use client'
import Link from 'next/link'
import Image from 'next/image'
import Footer from '@/components/Footer'
import { useCart } from '@/context/CartContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const { items, updateQty, subtotal } = useCart()
  const shipping = subtotal > 999 ? 0 : 99
  const total = subtotal + shipping
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (items.length === 0) return (
    <>
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <span style={{ fontFamily: 'var(--font-script)', fontSize: '48px', color: 'var(--gold)' }}>Your cart is empty</span>
        <p style={{ color: 'var(--brown-soft)', fontSize: '15px' }}>Looks like you haven&apos;t added anything yet.</p>
        <Link href="/shop"><button className="btn-primary">Start Shopping</button></Link>
      </div>
      <Footer />
    </>
  )

  const summary = (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--cream-dark)',
      borderRadius: '4px', padding: '28px',
      ...(isMobile ? { width: '100%', maxWidth: '480px', margin: '0 auto' } : { position: 'sticky', top: '90px' }),
    }}>
      <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '24px' }}>Order Summary</p>
      {[['Subtotal', `₹ ${subtotal}`], ['Shipping', shipping === 0 ? 'Free' : `₹ ${shipping}`]].map(([label, val]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span style={{ fontSize: '14px', color: 'var(--brown-soft)' }}>{label}</span>
          <span style={{ fontSize: '14px', color: 'var(--charcoal)', fontWeight: 500 }}>{val}</span>
        </div>
      ))}
      {shipping > 0 && <p style={{ fontSize: '12px', color: 'var(--gold)', marginBottom: '16px' }}>Free shipping on orders above ₹999</p>}
      <div style={{ borderTop: '1px solid var(--cream-dark)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>Total</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>₹ {total}</span>
      </div>
      <button className="btn-primary" style={{ width: '100%', textAlign: 'center' }}
        onClick={() => router.push('/checkout')}>
        Proceed to Checkout
      </button>
      <Link href="/shop">
        <button className="btn-outline" style={{ width: '100%', textAlign: 'center', marginTop: '12px' }}>Continue Shopping</button>
      </Link>
    </div>
  )

  return (
    <>
      <div style={{ background: 'var(--charcoal)', padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '10px' }}>Review</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 56px)', color: 'var(--cream)' }}>Your Cart</h1>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{
          display: isMobile ? 'flex' : 'grid',
          flexDirection: 'column',
          gridTemplateColumns: '1fr 340px',
          gap: '40px', alignItems: 'start',
        }}>
          {/* Items */}
          <div>
            {items.map(item => (
              <div key={item.id} style={{
                display: 'flex', gap: '20px', alignItems: 'center',
                padding: '20px 0', borderBottom: '1px solid var(--cream-dark)',
              }}>
                <div style={{ width: '90px', height: '90px', flexShrink: 0, borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                  {item.images?.[0] ? (
                    <Image src={item.images[0]} alt={item.name} fill sizes="90px" style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-script)', fontSize: '12px', color: 'rgba(201,169,110,0.5)' }}>photo</span>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '4px' }}>{item.category}</p>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', color: 'var(--charcoal)', marginBottom: '12px' }}>{item.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => updateQty(item.id, item.qty - 1)}
                      style={{ width: '28px', height: '28px', border: '1px solid var(--cream-dark)', background: 'var(--white)', borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}>−</button>
                    <span style={{ fontSize: '15px', fontWeight: 500 }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)}
                      style={{ width: '28px', height: '28px', border: '1px solid var(--cream-dark)', background: 'var(--white)', borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}>+</button>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--charcoal)', marginBottom: '8px' }}>₹ {item.price * item.qty}</p>
                  <button onClick={() => updateQty(item.id, 0)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--brown-soft)', letterSpacing: '1px', textTransform: 'uppercase' }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          {summary}
        </div>
      </div>
      <Footer />
    </>
  )
}