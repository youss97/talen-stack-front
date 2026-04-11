export default function Features() {
  const features = [
    {
      icon: "👥",
      title: "Gestion des Candidatures",
      description: "Centralisez toutes vos candidatures, suivez leur progression et collaborez en équipe en temps réel.",
      benefits: ["Workflow personnalisable", "Notifications automatiques", "Historique complet"]
    },
    {
      icon: "📅",
      title: "Planification d'Entretiens",
      description: "Organisez vos entretiens facilement avec notre système de calendrier intégré et les notifications automatiques.",
      benefits: ["Calendrier synchronisé", "Invitations automatiques", "Rappels intelligents"]
    },
    {
      icon: "🔗",
      title: "Suivi des Intégrations",
      description: "Accompagnez vos nouvelles recrues avec un processus d'intégration structuré et personnalisé.",
      benefits: ["Checklist d'intégration", "Suivi de progression", "Évaluations périodiques"]
    },
    {
      icon: "📊",
      title: "Analytics & Reporting",
      description: "Analysez vos performances de recrutement avec des tableaux de bord détaillés et des métriques clés.",
      benefits: ["Métriques en temps réel", "Rapports personnalisés", "Insights prédictifs"]
    },
    {
      icon: "🤖",
      title: "Automatisation Intelligente",
      description: "Automatisez les tâches répétitives et concentrez-vous sur ce qui compte vraiment : les candidats.",
      benefits: ["Tri automatique", "Réponses prédéfinies", "Workflows intelligents"]
    },
    {
      icon: "🔒",
      title: "Sécurité & Conformité",
      description: "Protégez les données sensibles avec notre infrastructure sécurisée et conforme aux réglementations.",
      benefits: ["Chiffrement bout en bout", "RGPD compliant", "Audit trail complet"]
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="landing-container">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tout ce dont vous avez besoin pour recruter
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Une suite complète d'outils conçus pour moderniser et optimiser 
            chaque étape de votre processus de recrutement.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-8 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
            >
              {/* Icon */}
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
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
                    <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-blue-50 text-blue-800 text-sm font-medium">
            <span className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></span>
            Et bien plus encore à découvrir...
          </div>
        </div>
      </div>
    </section>
  );
}