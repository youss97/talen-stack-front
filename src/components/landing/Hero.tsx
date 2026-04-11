import Link from 'next/link';
import Button from '@/components/ui/button/Button';

export default function Hero() {
  return (
    <section className="pt-20 pb-16 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="landing-container">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
            Nouvelle génération de recrutement
          </div>

          {/* Titre principal */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Révolutionnez votre
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {" "}processus de recrutement
            </span>
          </h1>

          {/* Sous-titre */}
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Talent Stack simplifie la gestion des candidatures, optimise les entretiens et 
            accélère les intégrations. Une plateforme complète pour les équipes RH modernes.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/signin">
              <Button size="lg" className="px-8 py-4 text-lg">
                🚀 Commencer gratuitement
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
              📹 Voir la démo
            </Button>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">95%</div>
              <div className="text-gray-600">Temps de recrutement réduit</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">500+</div>
              <div className="text-gray-600">Entreprises nous font confiance</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">24h</div>
              <div className="text-gray-600">Mise en place moyenne</div>
            </div>
          </div>
        </div>
      </div>

      {/* Illustration/Dashboard Preview */}
      <div className="landing-container mt-16">
        <div className="relative">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <div className="ml-4 text-sm text-gray-600">talent-stack.com/dashboard</div>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600 mb-2">127</div>
                  <div className="text-gray-600 text-sm">Candidatures actives</div>
                </div>
                <div className="bg-green-50 p-6 rounded-xl">
                  <div className="text-2xl font-bold text-green-600 mb-2">23</div>
                  <div className="text-gray-600 text-sm">Entretiens planifiés</div>
                </div>
                <div className="bg-purple-50 p-6 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600 mb-2">8</div>
                  <div className="text-gray-600 text-sm">Intégrations en cours</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">JD</span>
                    </div>
                    <div>
                      <div className="font-medium">John Doe</div>
                      <div className="text-sm text-gray-500">Développeur Full Stack</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Entretien</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-500">Aujourd'hui 14h</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-semibold">SM</span>
                    </div>
                    <div>
                      <div className="font-medium">Sarah Martin</div>
                      <div className="text-sm text-gray-500">Designer UX/UI</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Nouvelle</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-500">Il y a 2h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Floating elements */}
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-100 rounded-full opacity-60"></div>
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-purple-100 rounded-full opacity-60"></div>
        </div>
      </div>
    </section>
  );
}