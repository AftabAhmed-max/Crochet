'use client'
import Link from 'next/link'
import { useState } from 'react'




export default function Footer() {
  const [modal, setModal] = useState<string | null>(null)

  const policies: Record<string, string> = {
    'Shipping Policy': 'We ship across India within 5-7 business days. Orders above ₹999 get free shipping. You will receive updates via email once your order is dispatched.',
    'Return Policy': 'We accept returns within 7 days of delivery for damaged or defective items. Custom orders are non-returnable. Contact us at hello@crochetinggg.com to initiate a return.',
    'FAQs': 'Q: Are all products handmade? Yes, every piece is handcrafted with love.\nQ: Can I customize an order? Yes! Visit our Bouquet page.\nQ: How long does delivery take? 5-7 business days across India.',
  }

  return (
    <footer style={{ background: 'var(--charcoal)', color: 'var(--cream)', padding: '64px 24px 32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Top Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '48px', marginBottom: '48px' }}>

          {/* Brand */}
          <div>
            <span style={{ fontFamily: 'var(--font-script)', fontSize: '32px', color: 'var(--gold)' }}>crochetinggg</span>
            <p style={{ fontSize: '13px', color: 'rgba(250,247,242,0.5)', lineHeight: 1.8, marginTop: '16px', maxWidth: '220px' }}>
              Handcrafted with love, one stitch at a time. Your dream, our craft.
            </p>
            {/* Socials */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
              {['Instagram', 'Pinterest', 'WhatsApp'].map(s => (
                <a key={s} href="#" style={{
                  fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase',
                  color: 'var(--gold)', textDecoration: 'none', opacity: 0.8,
                  transition: 'opacity 0.2s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')}
                >{s}</a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '20px' }}>Quick Links</p>
            {[['Home', '/'], ['Shop', '/shop'], ['Bouquet', '/bouquet'], ['About', '/about']].map(([label, href]) => (
              <Link key={label} href={href} style={{
                display: 'block', fontSize: '14px', color: 'rgba(250,247,242,0.6)',
                textDecoration: 'none', marginBottom: '12px', transition: 'color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(250,247,242,0.6)')}
              >{label}</Link>
            ))}
          </div>

          {/* Help */}
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '20px' }}>Help</p>
            {Object.keys(policies).map(item => (
              <button key={item} onClick={() => setModal(item)} style={{
                display: 'block', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '14px', color: 'rgba(250,247,242,0.6)', marginBottom: '12px',
                textAlign: 'left', transition: 'color 0.2s', padding: 0,
              }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(250,247,242,0.6)')}
              >{item}</button>
            ))}
          </div>

          {/* Contact */}
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '20px' }}>Contact</p>
            <p style={{ fontSize: '14px', color: 'rgba(250,247,242,0.6)', marginBottom: '12px' }}>hello@crochetinggg.com</p>
            <p style={{ fontSize: '14px', color: 'rgba(250,247,242,0.6)', marginBottom: '12px' }}>+91 98765 43210</p>
            <p style={{ fontSize: '14px', color: 'rgba(250,247,242,0.6)', lineHeight: 1.6 }}>Mumbai, Maharashtra, India</p>
          </div>

        </div>

        {/* Bottom */}
        <div style={{
          borderTop: '1px solid rgba(201,169,110,0.15)',
          paddingTop: '28px',
          display: 'flex', flexWrap: 'wrap', gap: '12px',
          justifyContent: 'space-between', alignItems: 'center',
        }}>
          <p style={{ fontSize: '12px', color: 'rgba(250,247,242,0.3)' }}>
            © 2026 crochetinggg. All rights reserved.
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(250,247,242,0.3)' }}>
            Made with <span style={{ color: 'var(--gold)' }}>♥</span> in Mumbai
          </p>
        </div>

      </div>
      {modal && (
        <div onClick={() => setModal(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999, padding: '24px',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--cream)', borderRadius: '4px', padding: '36px',
            maxWidth: '500px', width: '100%', position: 'relative',
          }}>
            <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>{modal}</p>
            <p style={{ fontSize: '14px', color: 'var(--brown-soft)', lineHeight: 1.9, whiteSpace: 'pre-line' }}>{policies[modal]}</p>
            <button onClick={() => setModal(null)} style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '20px', color: 'var(--brown-soft)',
            }}>×</button>
          </div>
        </div>
      )}
    </footer>
  )
}