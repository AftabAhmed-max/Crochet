import Hero from '@/components/Hero'
import BestProducts from '@/components/BestProducts'
import Categories from '@/components/Categories'
import Testimonials from '@/components/Testimonials'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Hero />
      <BestProducts />
      <Categories />
      <Testimonials />
      <Footer />
    </main>
  )
}