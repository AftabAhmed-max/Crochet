'use client'
import Link from 'next/link'
import { useState } from 'react'




export default function Footer() {
  const [modal, setModal] = useState<string | null>(null)

  const policies: Record<string, string> = {
    'Shipping Policy': 'We ship across India within 8-10 business days. Orders above ₹999 get free shipping. You will receive updates via email once your order is dispatched.',
'Return Policy': 'Once ordered cannot return.',
'FAQs': 'Q: Are all products handmade? Yes, every piece is handcrafted with love.\nQ: Can I customize an order? Yes! Visit our Bouquet page or you can also customize via Instagram DM.\nQ: How long does delivery take? 8-10 business days across India.',
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
              {[
                { label: 'Instagram', href: 'https://instagram.com/crochetinggg_', icon: (
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                )},
                { label: 'WhatsApp', href: 'https://wa.me/918530566672', icon: (
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                )},
                { label: 'Pinterest', href: 'https://pinterest.com', icon: (
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
                )},
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={{
                  color: 'var(--gold)', opacity: 0.8, transition: 'opacity 0.2s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')}
                >{s.icon}</a>
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
            <p style={{ fontSize: '14px', color: 'rgba(250,247,242,0.6)', marginBottom: '12px' }}>+91 85305 66672</p>
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