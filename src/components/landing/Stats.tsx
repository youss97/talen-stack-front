export default function Stats() {
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

  return (
    <section id="stats" className="py-20 bg-gradient-to-br from-blue-600 to-purple-700">
      <div className="landing-container">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Des résultats qui parlent d'eux-mêmes
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Rejoignez des centaines d'entreprises qui ont transformé leur processus de recrutement avec Talent Stack.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="text-center p-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              {/* Number */}
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {stat.number}
              </div>

              {/* Label */}
              <h3 className="text-lg font-semibold text-blue-100 mb-3">
                {stat.label}
              </h3>

              {/* Description */}
              <p className="text-blue-200 text-sm leading-relaxed">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-8 p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">🏆</span>
              </div>
              <div className="text-left">
                <div className="text-white font-semibold">Leader du marché</div>
                <div className="text-blue-200 text-sm">Reconnu par les experts RH</div>
              </div>
            </div>
            
            <div className="hidden md:block w-px h-12 bg-white/20"></div>
            
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">🔒</span>
              </div>
              <div className="text-left">
                <div className="text-white font-semibold">Sécurité garantie</div>
                <div className="text-blue-200 text-sm">Certifié ISO 27001</div>
              </div>
            </div>
            
            <div className="hidden md:block w-px h-12 bg-white/20"></div>
            
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">⚡</span>
              </div>
              <div className="text-left">
                <div className="text-white font-semibold">Support 24/7</div>
                <div className="text-blue-200 text-sm">Équipe dédiée</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}