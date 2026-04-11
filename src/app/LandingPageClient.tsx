"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';
import { useVerifyUserQuery } from '@/lib/services/authApi';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Stats from '@/components/landing/Stats';
import Testimonials from '@/components/landing/Testimonials';
import CTA from '@/components/landing/CTA';
import Footer from '@/components/landing/Footer';
import Navbar from '@/components/landing/Navbar';

export default function LandingPageClient() {
  const router = useRouter();
  const { isAuth, user } = useAppSelector((state) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Vérifier l'authentification au chargement
  const { isLoading: isVerifying } = useVerifyUserQuery(undefined, {
    skip: typeof window === 'undefined'
  });

  useEffect(() => {
    // Marquer comme initialisé après le premier rendu
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    // Attendre que l'initialisation soit terminée et que la vérification soit faite
    if (isInitialized && !isVerifying && isAuth && user) {
      console.log('🔄 Utilisateur connecté détecté, redirection vers l\'application...');
      
      const userRoleCode = user.role?.code;
      if (userRoleCode?.startsWith('CLIENT_MANAGER_')) {
        router.push('/my-requests');
        return;
      }

      const firstFeaturePath = user.features?.[0]?.pages?.[0]?.path;
      const redirectPath = firstFeaturePath || "/dashboard";
      router.push(redirectPath);
    }
  }, [isInitialized, isVerifying, isAuth, user, router]);

  // Afficher un loader pendant la vérification initiale
  if (!isInitialized || isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur est connecté, afficher un loader de redirection
  if (isAuth && user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Redirection vers l'application...
          </p>
        </div>
      </div>
    );
  }

  // Afficher la landing page pour les utilisateurs non connectés
  return (
    <div className="landing-page min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <Stats />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}