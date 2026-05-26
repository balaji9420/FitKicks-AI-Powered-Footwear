import { Link } from 'react-router-dom'
import { Instagram, Twitter, Facebook, Youtube, Mail, Phone, MapPin } from 'lucide-react'

const footerLinks = {
  Shop: [
    { label: 'Sneakers', href: '/products?shoeType=sneakers' },
    { label: 'Running Shoes', href: '/products?shoeType=running' },
    { label: 'Sports Shoes', href: '/products?shoeType=sports' },
    { label: 'Casual Shoes', href: '/products?shoeType=casual' },
    { label: 'Limited Edition', href: '/products?shoeType=limited-edition' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Blog', href: '/blog' },
  ],
  Support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Track Order', href: '/orders' },
    { label: 'Returns', href: '/returns' },
    { label: 'Size Guide', href: '/size-guide' },
    { label: 'Contact Us', href: '/contact' },
  ],
}

const socials = [
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Youtube, href: '#', label: 'YouTube' },
]

export default function Footer() {
  return (
    <footer className="bg-dark-100 border-t border-white/5 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center font-display font-bold text-lg">F</div>
              <span className="font-display font-bold text-xl">FitKicks</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-6">
              AI-powered footwear shopping. Upload your outfit, get the perfect shoe match. Premium brands, unbeatable style.
            </p>
            {/* Contact */}
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2"><Mail size={13} /><span>support@fitkicks.com</span></div>
              <div className="flex items-center gap-2"><Phone size={13} /><span>+91 98765 43210</span></div>
              <div className="flex items-center gap-2"><MapPin size={13} /><span>Mumbai, India</span></div>
            </div>
            {/* Socials */}
            <div className="flex gap-3 mt-6">
              {socials.map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary/20 transition-colors">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="font-semibold text-white text-sm mb-4">{section}</h3>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link to={href} className="text-sm text-gray-500 hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600">© 2024 FitKicks. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-gray-600">
            <Link to="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
            <Link to="/cookies" className="hover:text-gray-400 transition-colors">Cookie Policy</Link>
          </div>
          {/* Payment icons placeholder */}
          <div className="flex gap-2 text-xs text-gray-600">
            <span className="px-2 py-1 bg-white/5 rounded text-xs">Visa</span>
            <span className="px-2 py-1 bg-white/5 rounded text-xs">Mastercard</span>
            <span className="px-2 py-1 bg-white/5 rounded text-xs">UPI</span>
            <span className="px-2 py-1 bg-white/5 rounded text-xs">Razorpay</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
