import { createHmac } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Razorpay from 'razorpay'
import { Resend } from 'resend'

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

const resend = new Resend(process.env.RESEND_API_KEY)

type OrderItem = { id: number; name: string; qty: number; price: number }

export async function POST(req: Request) {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      customerData,
      items,
    } = await req.json()

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment data' }, { status: 400 })
    }
    if (!customerData || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing order data' }, { status: 400 })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const hmacBody = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSignature = createHmac('sha256', secret).update(hmacBody).digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Fetch the authoritative order amount from Razorpay — never trust client-provided total.
    const rzpOrder = await razorpay.orders.fetch(razorpay_order_id)
    const verifiedTotal = (rzpOrder.amount as number) / 100
    const verifiedSubtotal = verifiedTotal > 999 + 99 ? verifiedTotal : verifiedTotal - 99

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
        subtotal: verifiedSubtotal,
        shipping: verifiedTotal - verifiedSubtotal,
        total: verifiedTotal,
        status: 'confirmed',
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
    }

    for (const item of items as OrderItem[]) {
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

    // Send confirmation email from server — not callable by client.
    try {
      const itemsList = (items as OrderItem[])
        .map(i => `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #F0EBE1">${i.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #F0EBE1;text-align:center">${i.qty}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #F0EBE1;text-align:right">₹${i.price * i.qty}</td>
        </tr>`)
        .join('')

      await resend.emails.send({
        from: 'Crochetinggg <orders@cozycrochets.site>',
        to: customerData.email,
        subject: `Order Confirmed #${orderData.id} — Crochetinggg`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF7F2;padding:40px 24px">
            <h1 style="font-family:Georgia,serif;color:#1A1A1A;font-size:32px;margin-bottom:8px">Order Confirmed!</h1>
            <p style="color:#C9A96E;font-size:12px;letter-spacing:2px;text-transform:uppercase">Order #${orderData.id}</p>
            <p style="color:#6B5344;margin:24px 0">Hi ${customerData.name}, thank you for your order! We'll start crafting it with love. 🌸</p>
            <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:4px;overflow:hidden">
              <thead>
                <tr style="background:#1A1A1A;color:#FAF7F2">
                  <th style="padding:10px 12px;text-align:left;font-size:11px;letter-spacing:1px">Item</th>
                  <th style="padding:10px 12px;text-align:center;font-size:11px;letter-spacing:1px">Qty</th>
                  <th style="padding:10px 12px;text-align:right;font-size:11px;letter-spacing:1px">Price</th>
                </tr>
              </thead>
              <tbody>${itemsList}</tbody>
            </table>
            <div style="text-align:right;margin-top:16px">
              <p style="font-family:Georgia,serif;font-size:22px;color:#1A1A1A">Total: ₹${verifiedTotal}</p>
            </div>
            <p style="color:#6B5344;font-size:13px;margin-top:32px;line-height:1.8">
              We'll notify you once your order is dispatched.<br/>
              Questions? Reply to this email anytime.
            </p>
            <p style="font-family:Georgia,serif;color:#C9A96E;font-size:24px;margin-top:32px">crochetinggg</p>
          </div>
        `,
      })
    } catch {
      // Email failure is non-fatal — order is already confirmed.
    }

    return NextResponse.json({ success: true, orderId: orderData.id })
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
