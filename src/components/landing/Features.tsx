"use client";
import { Check, Users, CalendarCheck2, Link2, BarChart3, Bot, ShieldCheck, type LucideIcon } from "lucide-react";
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

const featureKeys: Array<{ key: string; icon: LucideIcon }> = [
  { key: "applications", icon: Users },
  { key: "interviews", icon: CalendarCheck2 },
  { key: "onboarding", icon: Link2 },
  { key: "analytics", icon: BarChart3 },
  { key: "automation", icon: Bot },
  { key: "security", icon: ShieldCheck },
];

export default function Features() {
  const t = useTranslations('landing.features');
  const features = featureKeys.map(({ key, icon }) => ({
    icon,
    title: t(`items.${key}.title`),
    description: t(`items.${key}.description`),
    benefits: t.raw(`items.${key}.benefits`) as string[],
  }));
  return (
    <section id="features" className="py-20 bg-white">
      <div className="landing-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('heading')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-8 rounded-2xl border border-gray-100 hover:border-[var(--color-brand-500)]/40 hover:shadow-lg transition-all duration-300"
            >
              {/* Icon */}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-600 group-hover:scale-110 transition-transform duration-300">
                <feature.icon size={24} strokeWidth={1.7} className="icon-glow" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-4 leading-relaxed">
                {feature.description}
              </p>

              {/* Benefits */}
              <ul className="space-y-2">
                {feature.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center text-sm text-gray-500">
                    <Check
                      size={16}
                      strokeWidth={1.8}
                      className="icon-glow text-gray-500 me-2 flex-shrink-0"
                    />
                    {benefit}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-900)] text-sm font-medium">
            <span className="w-2 h-2 bg-[var(--color-brand-500)] rounded-full me-2 animate-pulse"></span>
            {t('bottomCta')}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
