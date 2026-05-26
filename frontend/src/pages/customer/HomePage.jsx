import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Star, Zap, Shield, Truck, RefreshCw } from 'lucide-react'
import { fetchFeaturedProducts, selectProducts } from '../../redux/slices/productSlice'
import ProductCard from '../../components/common/ProductCard'
import SectionLoader from '../../components/common/SectionLoader'

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }

const brands = [
  { name: 'Nike', bg: '#f5f5f5' },
  { name: 'Adidas', bg: '#000' },
  { name: 'Jordan', bg: '#e63946' },
  { name: 'New Balance', bg: '#cf6f2e' },
  { name: 'Puma', bg: '#111' },
  { name: 'Converse', bg: '#1a1a2e' },
  { name: 'Vans', bg: '#ee4035' },
  { name: 'Reebok', bg: '#0066cc' },
]

const testimonials = [
  { name: 'Priya S.', city: 'Mumbai', rating: 5, text: "The AI feature is insane! It recommended Jordans that matched my outfit perfectly. Wearing them to every event now!" },
  { name: 'Rohan M.', city: 'Bangalore', rating: 5, text: "Best sneaker shopping experience I've had online. Premium quality, fast delivery. FitKicks is the real deal." },
  { name: 'Anjali K.', city: 'Delhi', rating: 5, text: "Finally a shoe store that understands fashion. The AI matched my saree look with heeled sneakers. Mind blown!" },
]

export default function HomePage() {
  const dispatch = useDispatch()
  const { featured, isLoading } = useSelector(selectProducts)

  useEffect(() => {
    dispatch(fetchFeaturedProducts())
  }, [])

  return (
    <div className="pt-16">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-dark to-accent/5" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-accent/5 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            initial="hidden" animate="visible"
            className="space-y-8"
          >
            <motion.div variants={fadeUp}>
              <span className="badge-primary inline-flex mb-4">
                <Sparkles size={12} /> AI-Powered Shoe Matching
              </span>
              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-display font-bold leading-[1.05] tracking-tight">
                Your Outfit,<br />
                <span className="text-primary">Perfect Kicks.</span>
              </h1>
            </motion.div>
            <motion.p variants={fadeUp} className="text-gray-400 text-xl leading-relaxed max-w-lg">
              Upload a photo of your outfit and our AI finds the perfect shoes for you. Style-matched, occasion-perfect, exclusively yours.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Link to="/ai-style" className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
                <Sparkles size={18} /> Try AI Match
              </Link>
              <Link to="/products" className="btn-outline flex items-center gap-2 text-lg px-8 py-4">
                Shop Now <ArrowRight size={18} />
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="flex gap-8">
              {[
                { value: '50K+', label: 'Customers' },
                { value: '500+', label: 'Styles' },
                { value: '4.9', label: 'Rating' },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-primary/20 to-accent/10 backdrop-blur-sm border border-white/10" />
              {/* Floating product cards */}
              <div className="absolute -top-6 -left-6 card-glass p-3 rounded-2xl shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                    <Sparkles size={16} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">AI Match Found!</div>
                    <div className="text-xs text-gray-400">98% compatibility</div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 card-glass p-3 rounded-2xl shadow-lg">
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <div>
                    <div className="text-xs font-semibold">4.9★ Rated</div>
                    <div className="text-xs text-gray-400">50K+ reviews</div>
                  </div>
                </div>
              </div>
              {/* Big shoe image placeholder */}
              <div className="absolute inset-8 flex items-center justify-center text-8xl select-none">
                👟
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
          <span className="text-xs text-gray-500">Scroll to explore</span>
          <div className="w-0.5 h-8 bg-gradient-to-b from-gray-500 to-transparent" />
        </div>
      </section>

      {/* ── USPs ──────────────────────────────────────────────────── */}
      <section className="py-10 border-y border-white/5 bg-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹999' },
              { icon: RefreshCw, title: 'Easy Returns', desc: '7-day hassle-free returns' },
              { icon: Shield, title: '100% Authentic', desc: 'All products verified' },
              { icon: Zap, title: 'AI Matching', desc: 'Outfit-based recommendations' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Banner ─────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-dark-200 to-accent/10 border border-primary/20 p-8 sm:p-12"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="badge-primary mb-4 inline-flex">✨ New Feature</div>
                <h2 className="section-title mb-4">
                  Let AI Style<br />Your Footwear
                </h2>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Upload any outfit photo. Our advanced AI analyzes colors, style, and occasion — then recommends the perfect shoes from our collection with match scores and style explanations.
                </p>
                <div className="flex flex-wrap gap-3 mb-6 text-sm text-gray-400">
                  {['Color Analysis', 'Style Detection', 'Occasion Matching', 'Match Score', 'Why It Works'].map(f => (
                    <span key={f} className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" /> {f}
                    </span>
                  ))}
                </div>
                <Link to="/ai-style" className="btn-primary flex items-center gap-2 w-fit">
                  <Sparkles size={16} /> Try AI Style Match Free
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { icon: '👗', label: 'Upload Outfit', desc: 'Any photo works' },
                  { icon: '🤖', label: 'AI Analyzes', desc: 'Colors, style, occasion' },
                  { icon: '👟', label: 'Get Matches', desc: 'Ranked with scores' },
                ].map(({ icon, label, desc }) => (
                  <div key={label} className="flex items-center gap-4 card-glass p-4 rounded-2xl">
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <div className="text-sm font-semibold">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Trending ──────────────────────────────────────────────── */}
      <ProductSection title="Trending Now" emoji="🔥" products={featured.trending} loading={isLoading} href="/products?isTrending=true" />

      {/* ── New Arrivals ───────────────────────────────────────────── */}
      <ProductSection title="New Arrivals" emoji="✨" products={featured.newArrivals} loading={isLoading} href="/products?isNewArrival=true" />

      {/* ── Best Sellers ───────────────────────────────────────────── */}
      <ProductSection title="Best Sellers" emoji="⭐" products={featured.bestSellers} loading={isLoading} href="/products?isBestSeller=true" />

      {/* ── Limited Edition ────────────────────────────────────────── */}
      {featured.limitedEdition?.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="section-title">💎 Limited Edition</h2>
                <p className="text-gray-400 mt-1">Exclusive drops. Get them before they're gone.</p>
              </div>
              <Link to="/products?isLimitedEdition=true" className="btn-outline text-sm py-2 px-4">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {featured.limitedEdition.slice(0, 4).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Brands ────────────────────────────────────────────────── */}
      <section className="py-16 bg-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Featured Brands</h2>
            <p className="text-gray-400 mt-2">Shop from 50+ premium global brands</p>
          </div>
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-4">
            {brands.map(({ name }) => (
              <Link key={name} to={`/products?brand=${name.toLowerCase().replace(' ', '-')}`}
                className="flex items-center justify-center p-4 rounded-2xl bg-dark-200 hover:bg-dark-300 border border-white/5 hover:border-primary/20 transition-all duration-200 group">
                <span className="text-xs font-bold text-gray-500 group-hover:text-white transition-colors text-center">
                  {name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="section-title">What Our Customers Say</h2>
            <div className="flex items-center justify-center gap-1 mt-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
              ))}
              <span className="text-gray-400 text-sm ml-2">4.9 from 50,000+ reviews</span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="card p-6">
                <div className="flex items-center gap-0.5 mb-3">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={13} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.city}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function ProductSection({ title, emoji, products = [], loading, href }) {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-10">
          <h2 className="section-title">{emoji} {title}</h2>
          <Link to={href} className="btn-ghost text-sm flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => <SectionLoader key={i} />)}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {products.slice(0, 8).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">No products found</div>
        )}
      </div>
    </section>
  )
}

