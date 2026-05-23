"use client";
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-[#f5fae8]">
      <div className="landing-container">
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight"
          >
            Prêt à transformer{' '}
            <span className="text-[#8AB925]">votre recrutement ?</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Rejoignez des centaines d&apos;entreprises qui ont déjà révolutionné leur processus RH.
            Commencez votre essai gratuit dès maintenant, aucune carte de crédit requise.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link href="/signin">
              <button className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold rounded-xl bg-[#8AB925] text-white hover:bg-[#739c1e] transition-colors shadow-lg shadow-[#8AB925]/30">
                🚀 Commencer l&apos;essai gratuit
              </button>
            </Link>
            <a href="tel:+212500000000">
              <button className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold rounded-xl bg-[#8AB925] text-white hover:bg-[#739c1e] transition-colors shadow-lg shadow-[#8AB925]/30">
                📞 Parler à un expert
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
            {["14 jours d'essai gratuit", "Configuration en 24h", "Support dédié inclus"].map((item, i) => (
              <div key={i} className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-[#8AB925]/15 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#8AB925]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
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
              className="flex items-center gap-3 bg-white border border-[#8AB925]/30 hover:border-[#8AB925] hover:bg-[#f5fae8] transition-colors px-5 py-3 rounded-xl"
            >
              <div className="w-9 h-9 bg-[#8AB925]/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-[#8AB925]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-gray-800 font-medium">contact@talentstack.ma</span>
            </a>
            <a
              href="tel:+212500000000"
              className="flex items-center gap-3 bg-white border border-[#8AB925]/30 hover:border-[#8AB925] hover:bg-[#f5fae8] transition-colors px-5 py-3 rounded-xl"
            >
              <div className="w-9 h-9 bg-[#8AB925]/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-[#8AB925]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
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
            <p className="text-gray-500 text-sm mb-6">Ils nous font déjà confiance</p>
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
