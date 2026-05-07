'use client'
import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import AddToCartButton from '@/components/AddToCartButton'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const categories = ['All', 'Bouquet', 'Amigurumi', 'Home Décor', 'Custom']

type Product = {
  id: number; name: string; category: string;
  price: number; stock: number; tag: string | null;
  images: string[] | null;
}

function ShopContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [maxPrice, setMaxPrice] = useState(1500)
  const [sort, setSort] = useState('default')
  const [isMobile, setIsMobile] = useState(false)
  const searchParams = useSearchParams()
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All')
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })  
      if (data) setProducts(data)
      setLoading(false)
    }
    fetchProducts()
  }, [])

  let filtered = products
    .filter(p => activeCategory === 'All' || p.category === activeCategory)
    .filter(p => p.price <= maxPrice)
  if (sort === 'low') filtered = [...filtered].sort((a, b) => a.price - b.price)
  if (sort === 'high') filtered = [...filtered].sort((a, b) => b.price - a.price)

  return (
    <>
      <div style={{ background: 'var(--charcoal)', padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '10px' }}>Explore</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 56px)', color: 'var(--cream)' }}>Our Shop</h1>
      </div>

      {isMobile && (
        <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--cream-dark)', padding: '16px 24px' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                flexShrink: 0, padding: '6px 16px', borderRadius: '20px', cursor: 'pointer',
                fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase',
                background: activeCategory === cat ? 'var(--charcoal)' : 'transparent',
                color: activeCategory === cat ? 'var(--cream)' : 'var(--charcoal)',
                border: '1px solid var(--charcoal)', transition: 'all 0.2s',
              }}>{cat}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{
              padding: '6px 12px', fontSize: '12px', border: '1px solid var(--cream-dark)',
              background: 'var(--cream)', color: 'var(--charcoal)', borderRadius: '20px',
            }}>
              <option value="default">Sort: Default</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <span style={{ fontSize: '12px', color: 'var(--brown-soft)', whiteSpace: 'nowrap' }}>Max ₹{maxPrice}</span>
              <input type="range" min={300} max={1500} step={50} value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--gold-dark)' }} />
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 24px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '220px 1fr', gap: '40px', alignItems: 'start' }}>
        {!isMobile && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '28px', position: 'sticky', top: '90px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
            <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '20px' }}>Category</p>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 0', fontSize: '14px', color: activeCategory === cat ? 'var(--gold-dark)' : 'var(--charcoal)',
                fontWeight: activeCategory === cat ? 500 : 300, borderBottom: '1px solid var(--cream-dark)',
              }}>{cat}</button>
            ))}
            <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', margin: '28px 0 16px' }}>Max Price: ₹{maxPrice}</p>
            <input type="range" min={300} max={1500} step={50} value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--gold-dark)' }} />
            <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', margin: '28px 0 16px' }}>Sort By</p>
            {[['default', 'Default'], ['low', 'Low to High'], ['high', 'High to Low']].map(([val, label]) => (
              <button key={val} onClick={() => setSort(val)} style={{
                display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 0', fontSize: '14px', color: sort === val ? 'var(--gold-dark)' : 'var(--charcoal)',
                fontWeight: sort === val ? 500 : 300, borderBottom: '1px solid var(--cream-dark)',
              }}>{label}</button>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px' }}>
          {loading && <p style={{ color: 'var(--brown-soft)', fontSize: '14px' }}>Loading products...</p>}
          {!loading && filtered.length === 0 && <p style={{ color: 'var(--brown-soft)', fontSize: '14px' }}>No products found.</p>}
          {filtered.map((p, i) => (
            <div key={p.id} className={`fade-up fade-up-${Math.min(i + 1, 4)}`} style={{
              background: 'var(--white)', border: '1px solid var(--cream-dark)',
              borderRadius: '4px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.3s',
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div style={{ width: '100%', aspectRatio: '1/1', position: 'relative', overflow: 'hidden' }}>
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-script)', fontSize: '18px', color: 'rgba(201,169,110,0.4)' }}>photo</span>
                  </div>
                )}
                {p.tag && <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--charcoal)', color: 'var(--cream)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 10px' }}>{p.tag}</span>}
              </div>
              <div style={{ padding: '16px' }}>
                <p style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '4px' }}>{p.category}</p>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--charcoal)', marginBottom: '12px' }}>{p.name}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>₹ {p.price}</span>
                  <AddToCartButton item={p} small />
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

export default function ShopPage() {
  return <Suspense fallback={<div style={{padding:'80px',textAlign:'center',color:'var(--brown-soft)'}}>Loading...</div>}><ShopContent /></Suspense>
}