import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { name, email, items, total, orderId } = await req.json()

  const itemsList = items.map((i: any) => `<tr>
    <td style="padding:8px 12px;border-bottom:1px solid #F0EBE1">${i.name}</td>
    <td style="padding:8px 12px;border-bottom:1px solid #F0EBE1;text-align:center">${i.qty}</td>
    <td style="padding:8px 12px;border-bottom:1px solid #F0EBE1;text-align:right">₹${i.price * i.qty}</td>
  </tr>`).join('')

  try {
    const result = await resend.emails.send({
      from: 'Crochetinggg <orders@cozycrochets.site>',
      to: email,
      subject: `Order Confirmed #${orderId} — Crochetinggg`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF7F2;padding:40px 24px">
          <h1 style="font-family:Georgia,serif;color:#1A1A1A;font-size:32px;margin-bottom:8px">Order Confirmed!</h1>
          <p style="color:#C9A96E;font-size:12px;letter-spacing:2px;text-transform:uppercase">Order #${orderId}</p>
          <p style="color:#6B5344;margin:24px 0">Hi ${name}, thank you for your order! We'll start crafting it with love. 🌸</p>
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
            <p style="font-family:Georgia,serif;font-size:22px;color:#1A1A1A">Total: ₹${total}</p>
          </div>
          <p style="color:#6B5344;font-size:13px;margin-top:32px;line-height:1.8">
            We'll notify you once your order is dispatched.<br/>
            Questions? Reply to this email anytime.
          </p>
          <p style="font-family:Georgia,serif;color:#C9A96E;font-size:24px;margin-top:32px">crochetinggg</p>
        </div>
      `,
    })
    console.log('Email result:', result)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Email error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}