"use client";
import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/button/Button';
import { motion } from 'framer-motion';

export default function Navbar({ logoUrl, siteName = "Talent Stack" }: { logoUrl?: string; siteName?: string } = {}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50"
    >
      <div className="landing-container">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={siteName} className="h-9 max-w-[160px] object-contain" />
              ) : (
                <>
                  <div className="w-8 h-8 bg-[var(--color-brand-500)] rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">TS</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">{siteName}</span>
                </>
              )}
            </Link>
          </div>

          {/* Navigation Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            {[
              { href: "#features", label: "Fonctionnalités" },
              { href: "#stats", label: "Statistiques" },
              { href: "#testimonials", label: "Témoignages" },
              { href: "#contact", label: "Contact" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-[var(--color-brand-500)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/signin">
              <Button variant="outline" size="sm">Se connecter</Button>
            </Link>
            <Link href="/signin">
              <Button size="sm">Commencer</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-[var(--color-brand-500)] focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-100">
              {[
                { href: "#features", label: "Fonctionnalités" },
                { href: "#stats", label: "Statistiques" },
                { href: "#testimonials", label: "Témoignages" },
                { href: "#contact", label: "Contact" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 text-gray-600 hover:text-[var(--color-brand-500)]"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col space-y-2 px-3 pt-4">
                <Link href="/signin">
                  <Button variant="outline" size="sm" className="w-full">Se connecter</Button>
                </Link>
                <Link href="/signin">
                  <Button size="sm" className="w-full">Commencer</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
