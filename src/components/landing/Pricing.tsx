"use client";
import { motion } from "framer-motion";

function shade(hex: string, percent: number): string {
  const h = (hex || "").replace("#", "");
  if (h.length !== 6) return hex;
  const num = parseInt(h, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(255 * percent)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round(255 * percent)));
  const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round(255 * percent)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

interface Plan { name: string; price: string; currency?: string; cycle?: string; period?: string; features: string[]; highlighted?: boolean; ctaText?: string }

export default function Pricing({ plans, brand = "var(--color-brand-500)" }: { plans?: Plan[]; brand?: string }) {
  if (!plans || plans.length === 0) return null;
  const brandDark = shade(brand, -0.2);
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="landing-container">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Tarifs simples et transparents</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Choisissez l&apos;offre adaptée à votre équipe.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-2xl bg-white p-8 ${p.highlighted ? "border-2 shadow-lg" : "border border-gray-100 shadow-sm"}`}
              style={p.highlighted ? { borderColor: brand } : {}}
            >
              {p.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: brand }}>Populaire</span>
              )}
              <h3 className="text-lg font-semibold text-gray-900">{p.name}</h3>
              <p className="mt-3">
                <span className="text-4xl font-bold text-gray-900">{p.price}{p.currency ? ` ${p.currency}` : ""}</span>
                {(p.cycle || p.period) && <span className="text-gray-400"> {p.cycle || p.period}</span>}
              </p>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                {(p.features || []).map((feat, j) => (
                  <li key={j} className="flex items-center gap-2">
                    <span style={{ color: brand }}>✓</span> {feat}
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className={`mt-8 block rounded-lg px-4 py-3 text-center text-sm font-semibold transition-colors ${p.highlighted ? "text-white" : "border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                style={p.highlighted ? { background: brand } : { color: brandDark }}
              >
                {p.ctaText || "Choisir"}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
