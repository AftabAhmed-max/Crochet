'use client'

const categories = [
  {
    name: 'Bouquets',
    description: 'Everlasting floral arrangements',
    emoji: '💐',
    count: '24 designs',
    href: '/bouquet',
    bg: '#F5EFE6',
  },
  {
    name: 'Amigurumi',
    description: 'Cute handcrafted stuffed toys',
    emoji: '🧸',
    count: '18 designs',
    href: '/shop?category=Amigurumi',
    bg: '#EEF0F5',
  },
  {
    name: 'Home Décor',
    description: 'Cozy pieces for your space',
    emoji: '🏡',
    count: '15 designs',
    href: '/shop?category=Home Décor',
    bg: '#F0EEF5',
  },
  {
    name: 'Custom Orders',
    description: 'Your dream, our craft',
    emoji: '✨',
    count: 'Unlimited',
    href: '/shop?category=Custom',
    bg: '#F5EEF0',
  },
]

export default function Categories() {
  return (
    <section style={{ background: 'var(--cream-dark)', padding: '80px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <p style={{
            fontSize: '12px', letterSpacing: '3px',
            textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px',
          }}>Browse by</p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 4vw, 48px)',
            fontWeight: 500, color: 'var(--charcoal)',
          }}>Shop by Category</h2>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
        }}>
          {categories.map((cat, index) => (
            <a key={cat.name} href={cat.href} style={{ textDecoration: 'none' }}>
              <div
                className={`fade-up fade-up-${index + 1}`}
                style={{
                  background: cat.bg,
                  borderRadius: '4px',
                  padding: '36px 24px',
                  textAlign: 'center',
                  border: '1px solid transparent',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.border = '1px solid var(--gold-light)'
                  el.style.transform = 'translateY(-4px)'
                  el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.06)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.border = '1px solid transparent'
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = 'none'
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>{cat.emoji}</div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px', fontWeight: 500,
                  color: 'var(--charcoal)', marginBottom: '8px',
                }}>{cat.name}</h3>
                <p style={{
                  fontSize: '13px', color: 'var(--brown-soft)',
                  lineHeight: 1.6, marginBottom: '16px',
                }}>{cat.description}</p>
                <span style={{
                  fontSize: '11px', letterSpacing: '1.5px',
                  textTransform: 'uppercase', color: 'var(--gold)',
                }}>{cat.count}</span>
              </div>
            </a>
          ))}
        </div>

      </div>
    </section>
  )
}