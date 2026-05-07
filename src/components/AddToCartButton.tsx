'use client'
import { useCart } from '@/context/CartContext'

type Props = {
  item: { id: number; name: string; category: string; price: number; stock?: number }
  small?: boolean
}

export default function AddToCartButton({ item, small }: Props) {
  const { items, addItem, updateQty } = useCart()
  const cartItem = items.find(i => i.id === item.id)
  const qty = cartItem?.qty || 0
  const outOfStock = item.stock !== undefined && item.stock === 0

  const btnStyle = {
    border: '1px solid var(--cream-dark)', background: 'var(--white)',
    borderRadius: '50%', cursor: 'pointer', fontSize: '16px',
    width: small ? '26px' : '30px', height: small ? '26px' : '30px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 as const,
  }

  if (outOfStock) return (
    <span style={{ fontSize: small ? '10px' : '12px', color: '#EF4444', letterSpacing: '1px', textTransform: 'uppercase' }}>Out of Stock</span>
  )

  if (qty === 0) return (
    <button className="btn-primary"
      style={{ padding: small ? '6px 14px' : '8px 16px', fontSize: small ? '10px' : '11px' }}
      onClick={() => addItem({...item})}>
      Add
    </button>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button style={btnStyle} onClick={() => updateQty(item.id, qty - 1)}>−</button>
      <span style={{ fontSize: '14px', fontWeight: 500, minWidth: '16px', textAlign: 'center' }}>{qty}</span>
      <button style={btnStyle} onClick={() => updateQty(item.id, qty + 1)}
        disabled={item.stock !== undefined && qty >= item.stock}>+</button>
    </div>
  )
}