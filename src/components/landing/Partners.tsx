"use client";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface Partner { name?: string; logoUrl: string }

export default function Partners({ items }: { items?: Partner[] }) {
  const t = useTranslations('landing.partners');
  const partners = (items || []).filter((p) => p && p.logoUrl);
  if (partners.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="landing-container">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-sm font-semibold uppercase tracking-wider text-gray-400 mb-8"
        >
          {t('heading')}
        </motion.h2>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {partners.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              title={p.name || ""}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.logoUrl}
                alt={p.name || t('defaultAlt')}
                className="h-10 md:h-12 w-auto object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
