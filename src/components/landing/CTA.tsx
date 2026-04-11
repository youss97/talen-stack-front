import Link from 'next/link';
import Button from '@/components/ui/button/Button';

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="landing-container">
        <div className="text-center">
          {/* Main CTA */}
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Prêt à transformer votre recrutement ?
          </h2>
          
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Rejoignez des centaines d'entreprises qui ont déjà révolutionné leur processus RH. 
            Commencez votre essai gratuit dès maintenant, aucune carte de crédit requise.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/signin">
              <Button 
                size="lg" 
                className="px-8 py-4 text-lg bg-white text-blue-600 hover:bg-gray-50 font-semibold"
              >
                🚀 Commencer l'essai gratuit
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-blue-600 font-semibold"
            >
              📞 Parler à un expert
            </Button>
          </div>

          {/* Features highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white font-medium">14 jours d'essai gratuit</span>
            </div>
            
            <div className="flex items-center justify-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white font-medium">Configuration en 24h</span>
            </div>
            
            <div className="flex items-center justify-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white font-medium">Support dédié inclus</span>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 pt-8 border-t border-white/20">
            <p className="text-blue-100 text-sm mb-6">
              Ils nous font déjà confiance
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
              {/* Placeholder company logos */}
              <div className="bg-white/20 px-6 py-3 rounded-lg">
                <span className="text-white font-semibold">TechCorp</span>
              </div>
              <div className="bg-white/20 px-6 py-3 rounded-lg">
                <span className="text-white font-semibold">InnovateLab</span>
              </div>
              <div className="bg-white/20 px-6 py-3 rounded-lg">
                <span className="text-white font-semibold">GlobalTech</span>
              </div>
              <div className="bg-white/20 px-6 py-3 rounded-lg">
                <span className="text-white font-semibold">ScaleUp Inc</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}