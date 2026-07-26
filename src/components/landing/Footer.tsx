import { Link } from '@/i18n/navigation';
import { Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.114 20.452H3.558V9h3.556v11.452z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Footer() {
  const t = useTranslations('landing.footer');
  return (
    <footer id="contact" className="bg-gray-900 text-white">
      <div className="landing-container">
        {/* Main Footer */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-[var(--color-brand-500)] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">TS</span>
                </div>
                <span className="text-xl font-bold">Talent Stack</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                {t('tagline')}
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-[var(--color-brand-500)] transition-colors">
                  <Mail size={16} strokeWidth={1.8} className="icon-glow text-gray-300" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-[var(--color-brand-500)] transition-colors">
                  <LinkedinIcon className="icon-glow text-gray-300" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-[var(--color-brand-500)] transition-colors">
                  <TwitterIcon className="icon-glow text-gray-300" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-lg font-semibold mb-6">{t('product.heading')}</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#features" className="text-gray-400 hover:text-white transition-colors">
                    {t('product.features')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    {t('product.pricing')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    {t('product.integrations')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    {t('product.api')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    {t('product.security')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-semibold mb-6">{t('support.heading')}</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    {t('support.helpCenter')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    {t('support.documentation')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    {t('support.guides')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    {t('support.webinars')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    {t('support.contact')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="py-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h3 className="text-lg font-semibold mb-2">{t('newsletter.heading')}</h3>
              <p className="text-gray-400">
                {t('newsletter.text')}
              </p>
            </div>
            <div className="flex w-full md:w-auto">
              <input
                type="email"
                placeholder={t('newsletter.placeholder')}
                className="flex-1 md:w-64 px-4 py-3 bg-gray-800 border border-gray-700 rounded-s-lg focus:outline-none focus:border-[var(--color-brand-500)] text-white placeholder-gray-400"
              />
              <button className="px-6 py-3 bg-[var(--color-brand-500)] text-white rounded-e-lg hover:bg-[var(--color-brand-600)] transition-colors font-medium">
                {t('newsletter.submit')}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="py-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              {t('copyright', { year: new Date().getFullYear() })}
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                {t('privacy')}
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                {t('terms')}
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                {t('cookies')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
