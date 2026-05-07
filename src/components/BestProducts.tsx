'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import AddToCartButton from './AddToCartButton'
import { supabase } from '@/lib/supabase'

type Product = {
  id: number; name: string; category: string;
  price: number; stock: number; tag: string | null;
  images: string[] | null;
}

export default function BestProducts() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase.from('products').select('*').limit(4)
      if (data) setProducts(data)
    }
    fetch()
  }, [])

  return (
    <section style={{ background: 'var(--cream)', padding: '80px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px' }}>Handpicked for you</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 500, color: 'var(--charcoal)' }}>Our Best Sellers</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '28px' }}>
          {products.map(product => (
            <div key={product.id} style={{
              background: 'var(--white)', borderRadius: '4px', overflow: 'hidden',
              border: '1px solid var(--cream-dark)', transition: 'transform 0.3s ease', cursor: 'pointer',
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-6px)'; el.style.boxShadow = '0 16px 40px rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}
            >
              <div style={{ width: '100%', aspectRatio: '1/1', position: 'relative', overflow: 'hidden' }}>
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-script)', fontSize: '18px', color: 'rgba(201,169,110,0.4)' }}>photo</span>
                  </div>
                )}
                {product.tag && <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--charcoal)', color: 'var(--cream)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 10px' }}>{product.tag}</span>}
              </div>
              <div style={{ padding: '18px' }}>
                <p style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '6px' }}>{product.category}</p>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--charcoal)', marginBottom: '12px' }}>{product.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '17px', fontWeight: 500 }}>₹ {product.price}</span>
                  <AddToCartButton item={product} small />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <Link href="/shop"><button className="btn-outline">View All Products</button></Link>
        </div>
      </div>
    </section>
  )
}