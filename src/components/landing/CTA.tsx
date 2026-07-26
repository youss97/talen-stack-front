"use client";
import Link from 'next/link';
import { Check, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function CTA() {
  const t = useTranslations('landing.cta');
  const perks = t.raw('perks') as string[];
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-[var(--color-brand-25)]">
      <div className="landing-container">
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight"
          >
            {t('headingLine1')}{' '}
            <span className="text-[var(--color-brand-500)]">{t('headingHighlight')}</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            {t('subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link href="/signin">
              <button className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold rounded-xl bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)] transition-colors shadow-lg shadow-[var(--color-brand-500)]/30">
                {t('ctaPrimary')}
              </button>
            </Link>
            <a href="tel:+212500000000">
              <button className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold rounded-xl bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)] transition-colors shadow-lg shadow-[var(--color-brand-500)]/30">
                {t('ctaSecondary')}
              </button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            {perks.map((item, i) => (
              <div key={i} className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-[var(--color-brand-500)]/15 rounded-full flex items-center justify-center">
                  <Check className="icon-glow w-5 h-5 text-gray-500" size={20} strokeWidth={1.8} />
                </div>
                <span className="text-gray-700 font-medium">{item}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-10 mb-4"
          >
            <a
              href="mailto:contact@talentstack.ma"
              className="flex items-center gap-3 bg-white border border-[var(--color-brand-500)]/30 hover:border-[var(--color-brand-500)] hover:bg-[var(--color-brand-25)] transition-colors px-5 py-3 rounded-xl"
            >
              <div className="w-9 h-9 bg-[var(--color-brand-500)]/10 rounded-full flex items-center justify-center">
                <Mail className="icon-glow w-5 h-5 text-gray-500" size={20} strokeWidth={1.8} />
              </div>
              <span className="text-gray-800 font-medium">contact@talentstack.ma</span>
            </a>
            <a
              href="tel:+212500000000"
              className="flex items-center gap-3 bg-white border border-[var(--color-brand-500)]/30 hover:border-[var(--color-brand-500)] hover:bg-[var(--color-brand-25)] transition-colors px-5 py-3 rounded-xl"
            >
              <div className="w-9 h-9 bg-[var(--color-brand-500)]/10 rounded-full flex items-center justify-center">
                <Phone className="icon-glow w-5 h-5 text-gray-500" size={20} strokeWidth={1.8} />
              </div>
              <span className="text-gray-800 font-medium">+212 5 XX XX XX XX</span>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 pt-8 border-t border-gray-200"
          >
            <p className="text-gray-500 text-sm mb-6">{t('trustedTitle')}</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
              {["TechCorp", "InnovateLab", "GlobalTech", "ScaleUp Inc"].map((name) => (
                <div key={name} className="bg-gray-100 px-6 py-3 rounded-lg border border-gray-200">
                  <span className="text-gray-700 font-semibold">{name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
