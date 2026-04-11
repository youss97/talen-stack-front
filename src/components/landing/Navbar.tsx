"use client";
import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/button/Button';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
      <div className="landing-container">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TS</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Talent Stack</span>
            </Link>
          </div>

          {/* Navigation Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Fonctionnalités
            </Link>
            <Link href="#stats" className="text-gray-600 hover:text-gray-900 transition-colors">
              Statistiques
            </Link>
            <Link href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">
              Témoignages
            </Link>
            <Link href="#contact" className="text-gray-600 hover:text-gray-900 transition-colors">
              Contact
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/signin">
              <Button variant="outline" size="sm">
                Se connecter
              </Button>
            </Link>
            <Link href="/signin">
              <Button size="sm">
                Commencer
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
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
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-100">
              <Link href="#features" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
                Fonctionnalités
              </Link>
              <Link href="#stats" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
                Statistiques
              </Link>
              <Link href="#testimonials" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
                Témoignages
              </Link>
              <Link href="#contact" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
                Contact
              </Link>
              <div className="flex flex-col space-y-2 px-3 pt-4">
                <Link href="/signin">
                  <Button variant="outline" size="sm" className="w-full">
                    Se connecter
                  </Button>
                </Link>
                <Link href="/signin">
                  <Button size="sm" className="w-full">
                    Commencer
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}