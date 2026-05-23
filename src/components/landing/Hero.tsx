"use client";
import Link from 'next/link';
import Button from '@/components/ui/button/Button';
import { motion, type Transition } from 'framer-motion';
import dynamic from 'next/dynamic';

const ThreeParticles = dynamic(() => import('@/components/common/ThreeParticles'), { ssr: false });

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: "easeOut" } as Transition,
});

export default function Hero() {
  return (
    <section className="relative pt-20 pb-16 bg-gradient-to-br from-[#f5fae8] via-white to-[#edf5d2] overflow-hidden">
      <ThreeParticles color="#8AB925" count={50} opacity={0.35} />
      <div className="relative z-10 landing-container">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            {...fadeUp(0)}
            className="inline-flex items-center px-4 py-2 rounded-full bg-[#edf5d2] text-[#344a0c] text-sm font-medium mb-8"
          >
            <span className="w-2 h-2 bg-[#8AB925] rounded-full mr-2 animate-pulse"></span>
            Nouvelle génération de recrutement
          </motion.div>

          {/* Titre principal */}
          <motion.h1
            {...fadeUp(0.1)}
            className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight"
          >
            Révolutionnez votre
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8AB925] to-[#5c7d17]">
              {" "}processus de recrutement
            </span>
          </motion.h1>

          {/* Sous-titre */}
          <motion.p
            {...fadeUp(0.2)}
            className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Talent Stack simplifie la gestion des candidatures, optimise les entretiens et
            accélère les intégrations. Une plateforme complète pour les équipes RH modernes.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            {...fadeUp(0.3)}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link href="/signin">
              <Button size="lg" className="px-8 py-4 text-lg">
                🚀 Commencer gratuitement
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
              📹 Voir la démo
            </Button>
          </motion.div>

          {/* Stats rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { value: "95%", label: "Temps de recrutement réduit", color: "#8AB925" },
              { value: "500+", label: "Entreprises nous font confiance", color: "#739c1e" },
              { value: "24h", label: "Mise en place moyenne", color: "#5c7d17" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                {...fadeUp(0.4 + i * 0.1)}
                className="text-center"
              >
                <div className="text-3xl font-bold mb-2" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Illustration/Dashboard Preview */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
        className="relative z-10 landing-container mt-16"
      >
        <div className="relative">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-[#8AB925] rounded-full"></div>
                <div className="ml-4 text-sm text-gray-600">talent-stack.com/dashboard</div>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#f5fae8] p-6 rounded-xl">
                  <div className="text-2xl font-bold text-[#8AB925] mb-2">127</div>
                  <div className="text-gray-600 text-sm">Candidatures actives</div>
                </div>
                <div className="bg-[#edf5d2] p-6 rounded-xl">
                  <div className="text-2xl font-bold text-[#739c1e] mb-2">23</div>
                  <div className="text-gray-600 text-sm">Entretiens planifiés</div>
                </div>
                <div className="bg-[#d8ecaa] p-6 rounded-xl">
                  <div className="text-2xl font-bold text-[#5c7d17] mb-2">8</div>
                  <div className="text-gray-600 text-sm">Intégrations en cours</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#edf5d2] rounded-full flex items-center justify-center">
                      <span className="text-[#8AB925] font-semibold">JD</span>
                    </div>
                    <div>
                      <div className="font-medium">John Doe</div>
                      <div className="text-sm text-gray-500">Développeur Full Stack</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-[#edf5d2] text-[#344a0c] rounded-full text-sm">Entretien</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-500">Aujourd'hui 14h</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#d8ecaa] rounded-full flex items-center justify-center">
                      <span className="text-[#5c7d17] font-semibold">SM</span>
                    </div>
                    <div>
                      <div className="font-medium">Sarah Martin</div>
                      <div className="text-sm text-gray-500">Designer UX/UI</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-[#f5fae8] text-[#476211] rounded-full text-sm">Nouvelle</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-500">Il y a 2h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating elements */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-4 -right-4 w-20 h-20 bg-[#edf5d2] rounded-full opacity-60"
          />
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-4 -left-4 w-16 h-16 bg-[#d8ecaa] rounded-full opacity-60"
          />
        </div>
      </motion.div>
    </section>
  );
}
