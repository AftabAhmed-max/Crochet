'use client'
import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void }
  }
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const router = useRouter()
  const shipping = subtotal > 999 ? 0 : 99
  const total = subtotal + shipping
  const [user, setUser] = useState<{ user_metadata?: { full_name?: string; phone?: string }; email?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', pincode: '', state: '' })
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      if (u) {
        setUser(u)
        setForm(p => ({ ...p, name: u.user_metadata?.full_name || '', email: u.email || '', phone: u.user_metadata?.phone || '' }))
      }
    })
  }, [])

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  function validate() {
    const errs: string[] = []
    if (!form.name) errs.push('Name is required.')
    if (!form.email) errs.push('Email is required.')
    if (!form.phone || form.phone.length < 10) errs.push('Valid phone number required.')
    if (!form.address) errs.push('Address is required.')
    if (!form.city) errs.push('City is required.')
    if (!form.pincode || form.pincode.length !== 6) errs.push('Valid 6-digit pincode required.')
    if (!form.state) errs.push('State is required.')
    setErrors(errs)
    return errs.length === 0
  }

  async function handlePayment() {
    if (!validate()) return
    if (items.length === 0) return
    setLoading(true)

    try {
      const res = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total }),
      })
      const order = await res.json()
      if (!order.id) {
        setErrors(['Failed to initiate payment. Please try again.'])
        setLoading(false)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.body.appendChild(script)

      script.onload = () => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: 'INR',
          name: 'Crochetinggg',
          description: 'Handcrafted with love',
          order_id: order.id,
          prefill: { name: form.name, email: form.email, contact: form.phone },
          theme: { color: '#C9A96E' },
          handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            try {
              const verifyRes = await fetch('/api/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  customerData: form,
                  items,
                  subtotal,
                  shipping,
                  total,
                }),
              })
              const verifyData = await verifyRes.json()

              if (!verifyData.success) {
                setErrors(['Payment verification failed. Please contact support.'])
                setLoading(false)
                return
              }

              await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: form.name,
                  email: form.email,
                  items,
                  total,
                  orderId: verifyData.orderId,
                }),
              })

              clearCart()
              router.push('/order-success')
            } catch {
              setErrors(['Payment verification failed. Please try again.'])
              setLoading(false)
            }
          },
        }
        const rzp = new window.Razorpay(options as Record<string, unknown>)
        rzp.open()
        setLoading(false)
      }
    } catch {
      setErrors(['Payment failed. Please try again.'])
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', fontSize: '14px',
    border: '1px solid var(--cream-dark)', borderRadius: '4px',
    background: 'var(--white)', color: 'var(--charcoal)',
    fontFamily: 'var(--font-body)', outline: 'none',
  }

  if (items.length === 0) return (
    <>
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <span style={{ fontFamily: 'var(--font-script)', fontSize: '40px', color: 'var(--gold)' }}>Your cart is empty</span>
        <a href="/shop"><button className="btn-primary">Shop Now</button></a>
      </div>
      <Footer />
    </>
  )

  return (
    <>
      <div style={{ background: 'var(--charcoal)', padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '10px' }}>Almost there</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 56px)', color: 'var(--cream)' }}>Checkout</h1>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'start' }}>

        {/* Form */}
        <div>
          {!user && (
            <div style={{ background: 'var(--gold-light)', border: '1px solid var(--gold)', borderRadius: '4px', padding: '16px', marginBottom: '24px', fontSize: '14px', color: 'var(--charcoal)' }}>
              <a href="/account" style={{ color: 'var(--gold-dark)', fontWeight: 500 }}>Login</a> for faster checkout
            </div>
          )}

          <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '20px' }}>Delivery Details</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input style={inputStyle} placeholder="Full Name*" value={form.name} onChange={e => update('name', e.target.value)} />
            <input style={inputStyle} placeholder="Email*" type="email" value={form.email} onChange={e => update('email', e.target.value)} />
            <input style={inputStyle} placeholder="Phone Number*" type="tel" maxLength={10} value={form.phone} onChange={e => update('phone', e.target.value)} />
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }} placeholder="Full Address*" value={form.address} onChange={e => update('address', e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <input style={inputStyle} placeholder="City*" value={form.city} onChange={e => update('city', e.target.value)} />
              <input style={inputStyle} placeholder="Pincode*" maxLength={6} value={form.pincode} onChange={e => update('pincode', e.target.value)} />
            </div>
            <select style={inputStyle} value={form.state} onChange={e => update('state', e.target.value)}>
              <option value="">Select State*</option>
              {[
                'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat',
                'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
                'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
                'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
                'Uttarakhand','West Bengal'
              ].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <p style={{ fontSize: '11px', color: 'var(--brown-soft)', marginTop: '4px' }}>
              We currently deliver across all major Indian states. For remote areas delivery may take extra time.
            </p>
          </div>

          {errors.length > 0 && (
            <div style={{ background: '#FFF0F0', border: '1px solid #FFCCCC', borderRadius: '4px', padding: '12px 16px', marginTop: '16px' }}>
              {errors.map((e, i) => <p key={i} style={{ fontSize: '13px', color: '#CC4444' }}>• {e}</p>)}
            </div>
          )}
        </div>

        {/* Summary */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '28px', position: 'sticky', top: '90px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '20px' }}>Order Summary</p>

          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', color: 'var(--charcoal)' }}>{item.name} × {item.qty}</span>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>₹{item.price * item.qty}</span>
            </div>
          ))}

          <div style={{ borderTop: '1px solid var(--cream-dark)', paddingTop: '16px', marginTop: '8px' }}>
            {[['Subtotal', `₹${subtotal}`], ['Shipping', shipping === 0 ? 'Free' : `₹${shipping}`]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', color: 'var(--brown-soft)' }}>{l}</span>
                <span style={{ fontSize: '14px' }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--cream-dark)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>₹{total}</span>
            </div>
          </div>

          <button className="btn-primary" style={{ width: '100%', marginTop: '24px' }} onClick={handlePayment} disabled={loading}>
            {loading ? 'Processing...' : `Pay ₹${total}`}
          </button>
          <p style={{ fontSize: '11px', color: 'var(--brown-soft)', textAlign: 'center', marginTop: '12px', letterSpacing: '1px' }}>
            Secured by Razorpay
          </p>
        </div>
      </div>
      <Footer />
    </>
  )
}
