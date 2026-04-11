export default function Testimonials() {
  const testimonials = [
    {
      name: "Marie Dubois",
      role: "Directrice RH",
      company: "TechCorp",
      avatar: "MD",
      content: "Talent Stack a révolutionné notre processus de recrutement. Nous avons réduit notre temps de recrutement de 60% et amélioré significativement l'expérience candidat.",
      rating: 5
    },
    {
      name: "Pierre Martin",
      role: "Responsable Talent Acquisition",
      company: "InnovateLab",
      avatar: "PM",
      content: "L'interface intuitive et les fonctionnalités d'automatisation nous font gagner un temps précieux. Notre équipe RH est maintenant plus efficace que jamais.",
      rating: 5
    },
    {
      name: "Sophie Laurent",
      role: "CEO",
      company: "StartupXYZ",
      avatar: "SL",
      content: "En tant que startup en croissance, nous avions besoin d'un outil scalable. Talent Stack s'adapte parfaitement à nos besoins et évolue avec nous.",
      rating: 5
    },
    {
      name: "Thomas Bernard",
      role: "Manager RH",
      company: "GlobalTech",
      avatar: "TB",
      content: "La fonctionnalité de suivi des intégrations est exceptionnelle. Nos nouveaux employés sont maintenant mieux accompagnés dès leur premier jour.",
      rating: 5
    },
    {
      name: "Amélie Rousseau",
      role: "Consultante RH",
      company: "HR Solutions",
      avatar: "AR",
      content: "Je recommande Talent Stack à tous mes clients. C'est l'outil le plus complet et le plus facile à utiliser que j'aie jamais vu dans le domaine RH.",
      rating: 5
    },
    {
      name: "Nicolas Petit",
      role: "Directeur des Opérations",
      company: "ScaleUp Inc",
      avatar: "NP",
      content: "L'analytics et le reporting nous donnent une visibilité complète sur nos performances de recrutement. Les insights sont précieux pour optimiser nos processus.",
      rating: 5
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="landing-container">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ce que disent nos clients
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez comment Talent Stack transforme le quotidien des équipes RH 
            dans des entreprises de toutes tailles.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
            >
              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Content */}
              <blockquote className="text-gray-700 mb-6 leading-relaxed">
                "{testimonial.content}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-semibold text-sm">
                    {testimonial.avatar}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonial.role} • {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-left mb-6 md:mb-0">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Rejoignez plus de 500 entreprises satisfaites
                </h3>
                <p className="text-gray-600">
                  Commencez votre essai gratuit dès aujourd'hui et découvrez la différence.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Essai gratuit 14 jours
                </button>
                <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  Demander une démo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}