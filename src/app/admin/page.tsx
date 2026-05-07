'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const ADMIN_PASSWORD = 'crochet2026'

type Product = { id: number; name: string; category: string; price: number; stock: number; tag: string | null; description: string | null }
type Order = {
  id: number
  customer_name: string
  customer_email: string
  customer_phone: string
  address: string
  total: number
  status: string
  created_at: string
  items: any
}

const categories = ['Bouquet', 'Amigurumi', 'Home Décor', 'Custom']
const statuses = ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled']

export default function AdminPage() {
  const [auth, setAuth] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('adminAuth') === 'true'
    return false
  })
  const [pass, setPass] = useState('')
  const [tab, setTab] = useState<'products' | 'orders'>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'Bouquet', price: '', stock: '', tag: '', description: '' })
  const [msg, setMsg] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => { if (auth) { 
    fetchProducts()
    fetchOrders() 
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  } }, [auth])

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (data) setProducts(data)
  }

  async function fetchOrders() {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (data) setOrders(data)
  }


  async function addProduct() {
    if (!form.name || !form.price || !form.stock) return setMsg('Name, price and stock are required.')
    setLoading(true)
    let imageUrl = null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const filename = `${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('products').upload(filename, imageFile)
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('products').getPublicUrl(filename)
        imageUrl = urlData.publicUrl
      }
    }

    const { error } = await supabase.from('products').insert({
      name: form.name, category: form.category,
      price: Number(form.price), stock: Number(form.stock),
      tag: form.tag || null, description: form.description || null,
      images: imageUrl ? [imageUrl] : [],
    })
    if (error) setMsg('Error adding product.')
    else { setMsg('Product added successfully!'); setForm({ name: '', category: 'Bouquet', price: '', stock: '', tag: '', description: '' }); setImageFile(null); fetchProducts() }
    setLoading(false)
  }

  async function deleteProduct(id: number) {
    if (!confirm('Delete this product?')) return
    await supabase.from('products').delete().eq('id', id)
    fetchProducts()
  }

  async function updateStock(id: number, stock: number) {
    await supabase.from('products').update({ stock }).eq('id', id)
    fetchProducts()
  }

  async function updateOrderStatus(id: number, status: string) {
    await supabase.from('orders').update({ status }).eq('id', id)
    fetchOrders()
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', fontSize: '13px',
    border: '1px solid var(--cream-dark)', borderRadius: '4px',
    background: 'var(--white)', color: 'var(--charcoal)',
    fontFamily: 'var(--font-body)', outline: 'none',
  }

  const statusColor: Record<string, string> = {
    pending: '#F59E0B', confirmed: '#3B82F6',
    dispatched: '#8B5CF6', delivered: '#10B981', cancelled: '#EF4444',
  }

  if (!auth) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--charcoal)' }}>
      <div style={{ background: 'var(--cream)', padding: '48px', borderRadius: '4px', width: '100%', maxWidth: '360px', textAlign: 'center' }}>
        <span style={{ fontFamily: 'var(--font-script)', fontSize: '32px', color: 'var(--gold-dark)' }}>Admin</span>
        <p style={{ fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--brown-soft)', margin: '16px 0 24px' }}>Enter Password</p>
        <input type="password" value={pass} onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && pass === ADMIN_PASSWORD ? (localStorage.setItem('adminAuth', 'true'), setAuth(true)) : setMsg('Wrong password')}
          style={inputStyle} placeholder="Password" />
        {msg && <p style={{ color: '#EF4444', fontSize: '13px', marginTop: '12px' }}>{msg}</p>}
        <button className="btn-primary" style={{ width: '100%', marginTop: '16px' }}
          onClick={() => pass === ADMIN_PASSWORD ? (localStorage.setItem('adminAuth', 'true'), setAuth(true)) : setMsg('Wrong password')}>
          Login
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Header */}
      <div style={{ background: 'var(--charcoal)', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-script)', fontSize: '28px', color: 'var(--gold)' }}>crochetinggg — Admin</span>
        <button onClick={() => { localStorage.removeItem('adminAuth'); setAuth(false) }} style={{ background: 'none', border: '1px solid rgba(250,247,242,0.3)', color: 'var(--cream)', padding: '6px 16px', cursor: 'pointer', fontSize: '12px', borderRadius: '4px' }}>Logout</button>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--cream-dark)', padding: '0 32px', background: 'var(--white)' }}>
        {(['products', 'orders'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '16px 24px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '13px', letterSpacing: '1.5px', textTransform: 'uppercase',
            color: tab === t ? 'var(--gold-dark)' : 'var(--brown-soft)',
            borderBottom: tab === t ? '2px solid var(--gold-dark)' : '2px solid transparent',
            marginBottom: '-1px',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px' }}>

        {/* Products Tab */}
        {tab === 'products' && (
          <>
            {/* Add Product Form */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '28px', marginBottom: '40px' }}>
              <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '20px' }}>Add New Product</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <input style={inputStyle} placeholder="Product name*" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                <select style={inputStyle} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
                <input style={inputStyle} placeholder="Price (₹)*" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
                <input style={inputStyle} placeholder="Stock*" type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} />
                <input style={inputStyle} placeholder="Tag (optional)" value={form.tag} onChange={e => setForm(p => ({ ...p, tag: e.target.value }))} />
              </div>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '70px', marginBottom: '12px' }}
                placeholder="Description (optional)" value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              {msg && <p style={{ fontSize: '13px', color: msg.includes('Error') || msg.includes('error') ? '#EF4444' : '#10B981', marginBottom: '12px' }}>{msg}</p>}
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'inline-block', padding: '8px 16px',
                  border: '1px solid var(--gold)', borderRadius: '4px',
                  cursor: 'pointer', fontSize: '12px', letterSpacing: '1px',
                  color: 'var(--gold-dark)', transition: 'all 0.2s',
                  background: imageFile != null ? 'var(--gold-light)' : 'transparent',
                }}>
                  {imageFile != null ? `✓ ${(imageFile as File).name}` : 'Choose Image'}
                  <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)}
                    style={{ display: 'none' }} />
                </label>
              </div>
              <button className="btn-primary" onClick={addProduct} disabled={loading}>
                {loading ? 'Adding...' : 'Add Product'}
              </button>
            </div>

            {/* Products Table */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: 'var(--cream-dark)' }}>
                      {['Name', 'Category', 'Price', 'Stock', 'Tag', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--brown-soft)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--cream-dark)' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-display)', color: 'var(--charcoal)' }}>{p.name}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--gold)', fontSize: '12px' }}>{p.category}</td>
                        <td style={{ padding: '12px 16px' }}>₹{p.price}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button onClick={() => updateStock(p.id, Math.max(0, p.stock - 1))}
                              style={{ width: '24px', height: '24px', border: '1px solid var(--cream-dark)', background: 'var(--cream)', borderRadius: '50%', cursor: 'pointer', fontSize: '14px' }}>−</button>
                            <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 500 }}>{p.stock}</span>
                            <button onClick={() => updateStock(p.id, p.stock + 1)}
                              style={{ width: '24px', height: '24px', border: '1px solid var(--cream-dark)', background: 'var(--cream)', borderRadius: '50%', cursor: 'pointer', fontSize: '14px' }}>+</button>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--brown-soft)' }}>{p.tag || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={() => deleteProduct(p.id)}
                            style={{ background: 'none', border: '1px solid #EF4444', color: '#EF4444', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '4px', overflow: 'hidden' }}>
            {orders.length === 0 && <p style={{ padding: '32px', color: 'var(--brown-soft)', fontSize: '14px' }}>No orders yet.</p>}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                {orders.length > 0 && (
                  <thead>
                    <tr style={{ background: 'var(--cream-dark)' }}>
                      {['ID', 'Customer', 'Total', 'Items', 'Address', 'Status', 'Date'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--brown-soft)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid var(--cream-dark)' }}>
                      <td style={{ padding: '12px 16px', color: 'var(--brown-soft)', fontSize: '12px' }}>#{o.id}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <p style={{ fontWeight: 500, color: 'var(--charcoal)' }}>{o.customer_name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--brown-soft)' }}>{o.customer_email}</p>
                        <p style={{ fontSize: '12px', color: 'var(--brown-soft)' }}>{o.customer_phone}</p>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>₹{o.total}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--brown-soft)', maxWidth: '200px' }}>
                        {Array.isArray(o.items) ? o.items.map((i: any) => `${i.name} x${i.qty}`).join(', ') : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--brown-soft)' }}>{o.address}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}
                          style={{ padding: '4px 8px', fontSize: '12px', border: `1px solid ${statusColor[o.status]}`, borderRadius: '4px', color: statusColor[o.status], background: 'var(--white)', cursor: 'pointer' }}>
                          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--brown-soft)' }}>
                        {new Date(o.created_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}