import Razorpay from 'razorpay'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

type CartItem = { id: number; qty: number }

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const items: CartItem[] = body.items

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 })
    }

    for (const item of items) {
      if (typeof item.id !== 'number' || typeof item.qty !== 'number' || item.qty < 1) {
        return NextResponse.json({ error: 'Invalid items' }, { status: 400 })
      }
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const ids = items.map(i => i.id)
    const { data: products, error } = await supabase
      .from('products')
      .select('id, price')
      .in('id', ids)

    if (error || !products || products.length !== ids.length) {
      return NextResponse.json({ error: 'One or more products not found' }, { status: 400 })
    }

    const priceMap = new Map(products.map((p: { id: number; price: number }) => [p.id, p.price]))
    let subtotal = 0
    for (const item of items) {
      subtotal += (priceMap.get(item.id) ?? 0) * item.qty
    }
    const shipping = subtotal > 999 ? 0 : 99
    const total = subtotal + shipping

    const order = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    })

    return NextResponse.json(order)
  } catch {
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 })
  }
}
