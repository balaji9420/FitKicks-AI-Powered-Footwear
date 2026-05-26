import { Outlet, Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-dark flex">
      {/* Left: branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-dark-100">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10" />
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-display font-bold text-lg">F</div>
            <span className="font-display font-bold text-2xl">FitKicks</span>
          </Link>
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-display font-bold leading-tight mb-6"
            >
              Step Into<br />
              <span className="text-primary">Your Style</span>
            </motion.h1>
            <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
              Upload your outfit and let our AI find the perfect shoes for you. Join 50,000+ style-conscious shoppers.
            </p>
            <div className="mt-8 flex gap-6">
              {[
                { value: '50K+', label: 'Happy Shoppers' },
                { value: '500+', label: 'Premium Shoes' },
                { value: '4.9★', label: 'App Rating' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <span>© 2024 FitKicks.</span>
            <span>All rights reserved.</span>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center font-display font-bold">F</div>
              <span className="font-display font-bold text-xl">FitKicks</span>
            </Link>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
