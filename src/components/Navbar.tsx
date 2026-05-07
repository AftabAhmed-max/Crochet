'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, User, Menu, X } from 'lucide-react'
import { useCart } from '@/context/CartContext'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { totalItems } = useCart()

  useEffect(() => {
    setMounted(true)
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const links = [['Home', '/'], ['Shop', '/shop'], ['Bouquet', '/bouquet'], ['About', '/about']]

  if (!mounted) return <nav style={{ background: 'var(--cream)', borderBottom: '1px solid var(--gold-light)', height: '70px', position: 'sticky', top: 0, zIndex: 100 }} />

  return (
    <nav style={{ background: 'var(--cream)', borderBottom: '1px solid var(--gold-light)', position: 'sticky', top: 0, zIndex: 100, fontFamily: 'var(--font-body)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>

        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-script)', fontSize: '28px', color: 'var(--gold-dark)' }}>crochetinggg</span>
        </Link>

        {/* Desktop Links */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: '40px', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            {links.map(([label, href]) => (
              <Link key={label} href={href} style={{ textDecoration: 'none', color: 'var(--charcoal)', fontSize: '13px', letterSpacing: '1.5px', textTransform: 'uppercase' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--charcoal)')}
              >{label}</Link>
            ))}
          </div>
        )}

        {/* Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/account" style={{ color: 'var(--charcoal)' }}><User size={20} /></Link>
          <Link href="/cart" style={{ color: 'var(--charcoal)', position: 'relative' }}>
            <ShoppingCart size={20} />
            <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--gold)', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{totalItems}</span>
          </Link>
          {isMobile && (
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--charcoal)' }}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isMobile && menuOpen && (
        <div style={{ background: 'var(--cream)', borderTop: '1px solid var(--gold-light)', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {links.map(([label, href]) => (
            <Link key={label} href={href} onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--charcoal)', fontSize: '13px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{label}</Link>
          ))}
        </div>
      )}
    </nav>
  )
}