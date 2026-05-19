'use client'
import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import AddToCartButton from '@/components/AddToCartButton'
import CustomBouquetBuilder from '@/components/CustomBouquetBuilder'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

type Product = {
  id: number; name: string; category: string;
  price: number; stock: number; tag: string | null;
  images: string[] | null;
}

const steps = ['Choose flowers', 'Pick colors', 'Select size', 'Add message', 'Place order']

export default function BouquetPage() {
  const [bouquets, setBouquets] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
      .from('products')
      .select('*')
      .eq('category', 'Bouquet')
      if (data) setBouquets(data)
      setLoading(false)
    }
    fetch()
  }, [])

  return (
    <>
      <div style={{ background: 'var(--charcoal)', padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '10px' }}>Handcrafted</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 56px)', color: 'var(--cream)', marginBottom: '24px' }}>Crochet Bouquets</h1>
        <button className="btn-primary" onClick={() => setShowGuide(!showGuide)}
          style={{ border: '2px solid var(--gold)', animation: 'pulse-border 2s infinite' }}>
          {showGuide ? 'Hide Guide' : '✦ Create Your Own Bouquet'}
        </button>
      </div>

      {showGuide && (
        <div style={{ background: 'var(--gold-light)', padding: '40px 24px', borderBottom: '1px solid var(--gold)' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--charcoal)', marginBottom: '8px' }}>How to Create Your Bouquet</h2>
            <p style={{ fontSize: '13px', color: 'var(--brown-soft)', marginBottom: '32px' }}>Follow these simple steps</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--charcoal)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '18px' }}>{i + 1}</div>
                  <p style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--charcoal)', maxWidth: '80px', textAlign: 'center' }}>{step}</p>
                </div>
              ))}
            </div>
            <CustomBouquetBuilder />
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 24px' }}>
        {loading && <p style={{ color: 'var(--brown-soft)', fontSize: '14px' }}>Loading...</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
          {bouquets.map((b, i) => (
            <div key={b.id} className={`fade-up fade-up-${Math.min(i + 1, 4)}`} style={{
              background: 'var(--white)', border: '1px solid var(--cream-dark)',
              borderRadius: '4px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.3s',
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div style={{ width: '100%', aspectRatio: '1/1', position: 'relative', overflow: 'hidden' }}>
                {b.images?.[0] ? (
                  <Image src={b.images[0]} alt={b.name} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 25vw" />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-script)', fontSize: '18px', color: 'rgba(201,169,110,0.4)' }}>photo</span>
                  </div>
                )}
                {b.tag && <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--charcoal)', color: 'var(--cream)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 10px' }}>{b.tag}</span>}
              </div>
              <div style={{ padding: '16px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', color: 'var(--charcoal)', marginBottom: '12px' }}>{b.name}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>₹ {b.price}</span>
                  <AddToCartButton item={b} small />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}