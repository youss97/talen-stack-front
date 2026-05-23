"use client";
import { motion } from 'framer-motion';

const stats = [
  {
    number: "95%",
    label: "Réduction du temps de recrutement",
    description: "Nos clients recrutent 95% plus rapidement qu'avec leurs anciens outils"
  },
  {
    number: "500+",
    label: "Entreprises satisfaites",
    description: "De la startup à la grande entreprise, ils nous font confiance"
  },
  {
    number: "50k+",
    label: "Candidatures traitées",
    description: "Plus de 50 000 candidatures gérées avec succès chaque mois"
  },
  {
    number: "24h",
    label: "Mise en place",
    description: "Déployez Talent Stack en moins de 24 heures dans votre organisation"
  },
  {
    number: "99.9%",
    label: "Disponibilité",
    description: "Infrastructure robuste avec une disponibilité garantie"
  },
  {
    number: "4.9/5",
    label: "Satisfaction client",
    description: "Note moyenne basée sur plus de 1000 avis clients"
  }
];

export default function Stats() {
  return (
    <section id="stats" className="py-20 bg-gradient-to-br from-[#8AB925] to-[#476211]">
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
            Des résultats qui parlent d'eux-mêmes
          </h2>
          <p className="text-xl text-[#d8ecaa] max-w-3xl mx-auto">
            Rejoignez des centaines d'entreprises qui ont transformé leur processus de recrutement avec Talent Stack.
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
              <h3 className="text-lg font-semibold text-[#edf5d2] mb-3">
                {stat.label}
              </h3>
              <p className="text-[#d8ecaa] text-sm leading-relaxed">
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
            {[
              { icon: "🏆", title: "Leader du marché", sub: "Reconnu par les experts RH" },
              { icon: "🔒", title: "Sécurité garantie", sub: "Certifié ISO 27001" },
              { icon: "⚡", title: "Support 24/7", sub: "Équipe dédiée" },
            ].map((item, i) => (
              <div key={i} className="flex items-center space-x-3">
                {i > 0 && <div className="hidden md:block w-px h-12 bg-white/20 mr-8" />}
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">{item.icon}</span>
                </div>
                <div className="text-left">
                  <div className="text-white font-semibold">{item.title}</div>
                  <div className="text-[#d8ecaa] text-sm">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
