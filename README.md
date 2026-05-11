# Crochetinggg — You Dream We Crochet

> Handcrafted crochet pieces made with love. Every stitch tells a story.

🌐 **Live Site:** [cozycrochets.site](https://www.cozycrochets.site/)

---

## About

Crochetinggg is a full stack e-commerce website built for a real handmade 
crochet business based in Mumbai. It allows customers to browse products 
by category, add items to cart, place orders via Razorpay, and submit 
custom crochet order requests. Built and deployed by Stackwork.

---

## Pages

- **Home** — Hero, best sellers, shop by category, testimonials
- **Shop** — Full product listing with category filters
- **Bouquet** — Dedicated bouquet collection page
- **About** — Brand story
- **Product Detail** — Individual product with add to cart
- **Cart & Checkout** — Cart management and Razorpay payment flow
- **Custom Orders** — Form for submitting custom crochet requests

---

## Key Features

- Full e-commerce flow from browsing to payment
- Razorpay payment integration (test mode)
- Product filtering by category
- Custom order request form
- Fully responsive across mobile, tablet, and desktop
- Deployed on a custom domain

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 14 | Framework |
| Tailwind CSS v4 | Styling |
| Supabase | Database and product management |
| Razorpay | Payment gateway |
| Vercel | Deployment |
| Custom Domain | cozycrochets.site |

---

## Running Locally

```bash
git clone https://github.com/AftabAhmed-max/cozycrochets.git
cd cozycrochets
npm install
npm run dev
```

Add your environment variables to .env.local:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

---

## Built By

**[Stackwork](https://stackwork.vercel.app/)** — Digital agency serving 
businesses across India and the Gulf.
