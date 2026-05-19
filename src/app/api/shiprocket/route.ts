import { NextResponse } from 'next/server'

async function getToken() {
  const email = process.env.SHIPROCKET_EMAIL
  const password = process.env.SHIPROCKET_PASSWORD
  if (!email || !password) {
    throw new Error('Shiprocket credentials not configured')
  }
  const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  return data.token
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const token = await getToken()

    const res = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        order_id: body.order_id,
        order_date: new Date().toISOString().split('T')[0],
        pickup_location: 'Primary',
        billing_customer_name: body.name,
        billing_address: body.address,
        billing_city: body.city,
        billing_pincode: body.pincode,
        billing_state: body.state,
        billing_country: 'India',
        billing_email: body.email,
        billing_phone: body.phone,
        shipping_is_billing: true,
        order_items: body.items.map((i: { name: string; price: number; qty: number; id: number }) => ({
          name: i.name,
          selling_price: i.price,
          units: i.qty,
          sku: `SKU-${i.id}`,
        })),
        payment_method: 'Prepaid',
        sub_total: body.total,
        length: 10, breadth: 10, height: 10, weight: 0.5,
      }),
    })

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
