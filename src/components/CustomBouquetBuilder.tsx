'use client'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'

const flowers = [
  { id: 'rose', name: 'Rose', price: 80 },
  { id: 'sunflower', name: 'Sunflower', price: 100 },
  { id: 'lavender', name: 'Lavender', price: 70 },
  { id: 'daisy', name: 'Daisy', price: 60 },
]

const wrappings = [
  { id: 'kraft', name: 'Kraft Paper', price: 50 },
  { id: 'satin', name: 'Satin Wrap', price: 80 },
  { id: 'jute', name: 'Jute Twine', price: 60 },
]

const addons = [
  { id: 'ribbon', name: 'Ribbon', price: 30 },
  { id: 'giftbox', name: 'Gift Box', price: 60 },
  { id: 'driedleaves', name: 'Dried Leaves', price: 40 },
]

export default function CustomBouquetBuilder() {
  const { addItem } = useCart()
  const [flowerQty, setFlowerQty] = useState<Record<string, number>>({ rose: 0, sunflower: 0, lavender: 0, daisy: 0 })
  const [wrapping, setWrapping] = useState('')
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState(false)

  const totalFlowers = Object.values(flowerQty).reduce((a, b) => a + b, 0)
  const flowerCost = flowers.reduce((sum, f) => sum + f.price * (flowerQty[f.id] || 0), 0)
  const wrappingCost = wrappings.find(w => w.id === wrapping)?.price || 0
  const addonCost = addons.filter(a => selectedAddons.includes(a.id)).reduce((sum, a) => sum + a.price, 0)
  const total = flowerCost + wrappingCost + addonCost

  const toggleAddon = (id: string) =>
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])

  const handleSubmit = () => {
    const errs = []
    if (totalFlowers < 4) errs.push('Please select at least 4 flowers total.')
    if (!wrapping) errs.push('Please select a wrapping paper.')
    setErrors(errs)
    if (errs.length === 0) {
      const selectedFlowers = flowers.filter(f => flowerQty[f.id] > 0).map(f => `${f.name} x${flowerQty[f.id]}`).join(', ')
      const selectedWrapping = wrappings.find(w => w.id === wrapping)?.name || ''
      const selectedAddonNames = addons.filter(a => selectedAddons.includes(a.id)).map(a => a.name).join(', ')
      const description = `Flowers: ${selectedFlowers} | Wrap: ${selectedWrapping}${selectedAddonNames ? ` | Extras: ${selectedAddonNames}` : ''}${message ? ` | Message: ${message}` : ''}`

      addItem({
        id: Date.now(),
        name: 'Custom Bouquet',
        category: 'Custom Bouquet',
        price: total,
        description,
      })

      setSuccess(true)
    }
  }

  const cardStyle = (active: boolean) => ({
    borderRadius: '4px', cursor: 'pointer',
    border: `1px solid ${active ? 'var(--gold-dark)' : 'var(--cream-dark)'}`,
    background: active ? 'var(--gold-light)' : 'var(--white)',
    transition: 'all 0.2s', overflow: 'hidden',
  })

  const sectionTitle = (text: string) => (
    <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>{text}</p>
  )

  if (success) return (
    <div style={{ background: 'var(--cream)', border: '1px solid var(--gold)', borderRadius: '4px', padding: '40px', textAlign: 'center', margin: '32px 0' }}>
      <p style={{ fontFamily: 'var(--font-script)', fontSize: '36px', color: 'var(--gold-dark)', marginBottom: '12px' }}>Added to Cart!</p>
      <p style={{ color: 'var(--brown-soft)', fontSize: '14px' }}>Your custom bouquet has been added. 🌸</p>
      <button className="btn-outline" style={{ marginTop: '24px' }} onClick={() => {
        setSuccess(false)
        setFlowerQty({ rose: 0, sunflower: 0, lavender: 0, daisy: 0 })
        setWrapping(''); setSelectedAddons([]); setMessage('')
      }}>Build Another</button>
    </div>
  )

  return (
    <div style={{ background: 'var(--cream)', border: '1px solid var(--gold-light)', borderRadius: '4px', padding: '32px', margin: '32px 0', textAlign: 'left' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--charcoal)', marginBottom: '8px' }}>Build Your Bouquet</h2>
      <p style={{ fontSize: '13px', color: 'var(--brown-soft)', marginBottom: '32px' }}>Min. 4 flowers required. Wrapping is mandatory.</p>

      {/* Flowers */}
      {sectionTitle(`Flowers (${totalFlowers} selected)`)}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {flowers.map(f => (
          <div key={f.id} style={cardStyle(flowerQty[f.id] > 0)}>
            <div style={{ width: '100%', aspectRatio: '1/1', background: 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-script)', fontSize: '14px', color: 'rgba(201,169,110,0.5)' }}>{f.name}</span>
            </div>
            <div style={{ padding: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--charcoal)' }}>{f.name}</span>
                <span style={{ fontSize: '12px', color: 'var(--gold-dark)' }}>₹{f.price}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => setFlowerQty(prev => ({ ...prev, [f.id]: Math.max(0, (prev[f.id] || 0) - 1) }))}
                  style={{ width: '26px', height: '26px', border: '1px solid var(--cream-dark)', background: 'var(--white)', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <span style={{ fontSize: '14px', fontWeight: 500, minWidth: '16px', textAlign: 'center' }}>{flowerQty[f.id]}</span>
                <button onClick={() => setFlowerQty(prev => ({ ...prev, [f.id]: (prev[f.id] || 0) + 1 }))}
                  style={{ width: '26px', height: '26px', border: '1px solid var(--cream-dark)', background: 'var(--white)', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Wrapping */}
      {sectionTitle('Wrapping Paper (required)')}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {wrappings.map(w => (
          <div key={w.id} onClick={() => setWrapping(w.id)} style={cardStyle(wrapping === w.id)}>
            <div style={{ width: '100%', aspectRatio: '1/1', background: 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-script)', fontSize: '14px', color: 'rgba(201,169,110,0.5)' }}>{w.name}</span>
            </div>
            <div style={{ padding: '10px' }}>
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--charcoal)' }}>{w.name}</p>
              <p style={{ fontSize: '12px', color: 'var(--gold-dark)' }}>₹{w.price}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Addons */}
      {sectionTitle('Add-ons (optional)')}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {addons.map(a => (
          <div key={a.id} onClick={() => toggleAddon(a.id)} style={cardStyle(selectedAddons.includes(a.id))}>
            <div style={{ width: '100%', aspectRatio: '1/1', background: 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-script)', fontSize: '14px', color: 'rgba(201,169,110,0.5)' }}>{a.name}</span>
            </div>
            <div style={{ padding: '10px' }}>
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--charcoal)' }}>{a.name}</p>
              <p style={{ fontSize: '12px', color: 'var(--gold-dark)' }}>₹{a.price}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Message */}
      {sectionTitle('Message Card (optional)')}
      <textarea value={message} onChange={e => setMessage(e.target.value)}
        placeholder="Write a heartfelt message..."
        style={{
          width: '100%', padding: '12px 16px', fontSize: '14px',
          border: '1px solid var(--cream-dark)', borderRadius: '4px',
          background: 'var(--white)', color: 'var(--charcoal)',
          fontFamily: 'var(--font-body)', resize: 'vertical', minHeight: '80px',
          marginBottom: '32px', outline: 'none',
        }} />

      {errors.length > 0 && (
        <div style={{ background: '#FFF0F0', border: '1px solid #FFCCCC', borderRadius: '4px', padding: '12px 16px', marginBottom: '24px' }}>
          {errors.map((e, i) => <p key={i} style={{ fontSize: '13px', color: '#CC4444' }}>• {e}</p>)}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid var(--cream-dark)', paddingTop: '24px' }}>
        <div>
          <p style={{ fontSize: '12px', color: 'var(--brown-soft)', letterSpacing: '1px', textTransform: 'uppercase' }}>Total</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--charcoal)' }}>₹ {total}</p>
        </div>
        <button className="btn-primary" onClick={handleSubmit}>Add Custom Bouquet to Cart →</button>
      </div>
    </div>
  )
}