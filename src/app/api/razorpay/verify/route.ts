import { createHmac } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      customerData,
      items,
      subtotal,
      shipping,
      total,
    } = await req.json()

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment data' }, { status: 400 })
    }
    if (!customerData || !items || typeof total !== 'number') {
      return NextResponse.json({ error: 'Missing order data' }, { status: 400 })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSignature = createHmac('sha256', secret).update(body).digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: customerData.name,
        customer_email: customerData.email,
        customer_phone: customerData.phone,
        address: `${customerData.address}, ${customerData.city}, ${customerData.state} - ${customerData.pincode}`,
        items,
        subtotal,
        shipping,
        total,
        status: 'confirmed',
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
    }

    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.id)
        .single()
      if (product) {
        await supabase
          .from('products')
          .update({ stock: Math.max(0, product.stock - item.qty) })
          .eq('id', item.id)
      }
    }

    return NextResponse.json({ success: true, orderId: orderData.id })
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
