'use client'
import Image from 'next/image'
import Footer from '@/components/Footer'

const values = [
  { title: 'Handcrafted', desc: 'Every piece is made by hand, stitch by stitch, with patience and love.' },
  { title: 'Made to Order', desc: 'Nothing sits in a warehouse. We create fresh for every customer.' },
  { title: 'Sustainable', desc: 'We use eco-friendly yarns and minimal, recyclable packaging.' },
  { title: 'Personal', desc: 'From custom bouquets to personal messages — it\'s always made for you.' },
]

const team = [
  { name: 'Aisha K.', role: 'Founder & Lead Crafter' },
  { name: 'Priya M.', role: 'Design & Custom Orders' },
  { name: 'Riya S.', role: 'Packaging & Dispatch' },
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <div style={{ background: 'var(--charcoal)', padding: '80px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px' }}>Our Story</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 5vw, 64px)', color: 'var(--cream)', marginBottom: '24px' }}>Made with Every Stitch</h1>
        <p style={{ fontSize: '16px', color: 'rgba(250,247,242,0.6)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.8 }}>
          Crochetinggg started as a late-night hobby and grew into something beautiful — a small business built on dreams, yarn, and a whole lot of love.
        </p>
      </div>

      {/* Story Section */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '60px', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>How it began</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3vw, 40px)', color: 'var(--charcoal)', marginBottom: '20px' }}>A Hobby That Became a Dream</h2>
          <p style={{ fontSize: '15px', color: 'var(--brown-soft)', lineHeight: 1.9, marginBottom: '16px' }}>
            It started in 2021 with a single crochet flower gifted to a friend. The smile on her face said everything. Soon, more friends asked, then strangers, then the internet.
          </p>
          <p style={{ fontSize: '15px', color: 'var(--brown-soft)', lineHeight: 1.9 }}>
            Today, crochetinggg ships handcrafted pieces across India — each one unique, each one made with intention. We believe handmade is not just a product, it&apos;s a feeling.
          </p>
        </div>
        <div style={{ position: 'relative', width: '100%', minHeight: '400px' }}>
          <Image
            src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80"
            alt="Our Story"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: 'cover', borderRadius: '4px' }}
          />
        </div>
      </div>

      {/* Values */}
      <div style={{ background: 'var(--cream-dark)', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px' }}>What we stand for</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3vw, 42px)', color: 'var(--charcoal)' }}>Our Values</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            {values.map((v, i) => (
              <div key={i} className={`fade-up fade-up-${i + 1}`} style={{
                background: 'var(--white)', border: '1px solid var(--cream-dark)',
                borderRadius: '4px', padding: '32px 24px',
              }}>
                <div style={{ width: '36px', height: '2px', background: 'var(--gold)', marginBottom: '20px' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--charcoal)', marginBottom: '12px' }}>{v.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--brown-soft)', lineHeight: 1.8 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px' }}>The people behind it</p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3vw, 42px)', color: 'var(--charcoal)', marginBottom: '48px' }}>Meet the Team</h2>
        <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {team.map((t, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${t.name}&backgroundColor=e8d5b0&textColor=a8864e`}
                alt={t.name}
                style={{ width: '100px', height: '100px', borderRadius: '50%', border: '2px solid var(--gold-light)' }}
              />
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--charcoal)' }}>{t.name}</p>
              <p style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--gold)' }}>{t.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'var(--charcoal)', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-script)', fontSize: 'clamp(36px, 5vw, 60px)', color: 'var(--gold)', marginBottom: '16px' }}>You dream, we crochet.</h2>
        <p style={{ fontSize: '15px', color: 'rgba(250,247,242,0.6)', marginBottom: '32px' }}>Let&apos;s create something beautiful together.</p>
        <a href="/shop"><button className="btn-primary">Shop Now</button></a>
      </div>

      <Footer />
    </>
  )
}