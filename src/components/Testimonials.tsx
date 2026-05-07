'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Testimonial = { id: number; name: string; location: string; text: string; rating: number }

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])

  useEffect(() => {
    supabase.from('testimonials').select('*').then(({ data }) => { if (data) setTestimonials(data) })
  }, [])

  return (
    <section style={{ background: 'var(--cream)', padding: '80px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <p style={{ fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px' }}>Kind words</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 500, color: 'var(--charcoal)' }}>What Our Customers Say</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {testimonials.map((t, i) => (
            <div key={t.id} className={`fade-up fade-up-${Math.min(i+1,4)}`} style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '32px 28px' }}>
              <div style={{ color: 'var(--gold)', fontSize: '16px', marginBottom: '16px', letterSpacing: '2px' }}>{'★'.repeat(t.rating)}</div>
              <p style={{ fontSize: '15px', lineHeight: 1.8, color: 'var(--brown-soft)', marginBottom: '24px', fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--cream-dark)', paddingTop: '20px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--gold-dark)' }}>{t.name[0]}</div>
                <div>
                  <p style={{ fontWeight: 500, fontSize: '14px', color: 'var(--charcoal)' }}>{t.name}</p>
                  <p style={{ fontSize: '12px', color: 'var(--gold)', letterSpacing: '1px' }}>{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}