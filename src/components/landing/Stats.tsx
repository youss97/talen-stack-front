"use client";
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

const statKeys = [
  { key: "speed", number: "95%" },
  { key: "companies", number: "500+" },
  { key: "applications", number: "50k+" },
  { key: "setup", number: "24h" },
  { key: "uptime", number: "99.9%" },
  { key: "satisfaction", number: "4.9/5" },
];

const badgeKeys = [
  { key: "leader", icon: "🏆" },
  { key: "security", icon: "🔒" },
  { key: "support", icon: "⚡" },
];

export default function Stats() {
  const t = useTranslations('landing.stats');
  const stats = statKeys.map(({ key, number }) => ({
    number,
    label: t(`items.${key}.label`),
    description: t(`items.${key}.description`),
  }));
  return (
    <section id="stats" className="py-20 bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-800)]">
      <div className="landing-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('heading')}
          </h2>
          <p className="text-xl text-[var(--color-brand-100)] max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="text-center p-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {stat.number}
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-brand-50)] mb-3">
                {stat.label}
              </h3>
              <p className="text-[var(--color-brand-100)] text-sm leading-relaxed">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center space-x-8 p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
            {badgeKeys.map((item, i) => (
              <div key={i} className="flex items-center space-x-3">
                {i > 0 && <div className="hidden md:block w-px h-12 bg-white/20 me-8" />}
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">{item.icon}</span>
                </div>
                <div className="text-start">
                  <div className="text-white font-semibold">{t(`badges.${item.key}.title`)}</div>
                  <div className="text-[var(--color-brand-100)] text-sm">{t(`badges.${item.key}.sub`)}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
