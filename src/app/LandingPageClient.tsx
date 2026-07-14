"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';
import { useVerifyUserQuery } from '@/lib/services/authApi';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Stats from '@/components/landing/Stats';
import Testimonials from '@/components/landing/Testimonials';
import Partners from '@/components/landing/Partners';
import Pricing from '@/components/landing/Pricing';
import Contact from '@/components/landing/Contact';
import CTA from '@/components/landing/CTA';
import Footer from '@/components/landing/Footer';
import Navbar from '@/components/landing/Navbar';

const LANDING_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function shadeColor(hex: string, percent: number): string {
  const h = (hex || "").replace("#", "");
  if (h.length !== 6) return hex;
  const num = parseInt(h, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(255 * percent)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round(255 * percent)));
  const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round(255 * percent)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// Génère la surcharge des tokens --color-brand-* à partir de la couleur de config
function brandScaleVars(brand: string): React.CSSProperties {
  return {
    ["--color-brand-25" as string]: shadeColor(brand, 0.86),
    ["--color-brand-50" as string]: shadeColor(brand, 0.78),
    ["--color-brand-100" as string]: shadeColor(brand, 0.62),
    ["--color-brand-200" as string]: shadeColor(brand, 0.45),
    ["--color-brand-300" as string]: shadeColor(brand, 0.28),
    ["--color-brand-400" as string]: shadeColor(brand, 0.12),
    ["--color-brand-500" as string]: brand,
    ["--color-brand-600" as string]: shadeColor(brand, -0.1),
    ["--color-brand-700" as string]: shadeColor(brand, -0.22),
    ["--color-brand-800" as string]: shadeColor(brand, -0.34),
    ["--color-brand-900" as string]: shadeColor(brand, -0.46),
    ["--color-brand-950" as string]: shadeColor(brand, -0.6),
  } as React.CSSProperties;
}

export default function LandingPageClient() {
  const router = useRouter();
  const { isAuth, user } = useAppSelector((state) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);
  const [content, setContent] = useState<Record<string, unknown> | null>(null);
  // Mode aperçu : permet au super admin connecté de voir la landing sans redirection
  const isPreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("preview");

  // Contenu éditable de la landing (géré par le super admin)
  useEffect(() => {
    fetch(`${LANDING_API}/public/landing`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setContent)
      .catch(() => setContent({}));
  }, []);
  
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
    // En mode aperçu, ne pas rediriger (le super admin veut voir la landing)
    if (isPreview) return;
    // Attendre que l'initialisation soit terminée et que la vérification soit faite
    if (isInitialized && !isVerifying && isAuth && user) {
      console.log('🔄 Utilisateur connecté détecté, redirection vers l\'application...');

      // Page d'accueil = Statistiques pour tous les rôles, SAUF l'espace client
      // qui n'a pas accès aux statistiques (voir usePermissions.ts::canAccessPath).
      const u = user as unknown as {
        company?: { parent_company_id?: string | null };
        client_id?: string | null;
        role?: { code?: string };
      };
      const isClientSpace =
        !!u?.company?.parent_company_id ||
        !!u?.client_id ||
        (u?.role?.code || "").toUpperCase().startsWith("CLIENT_MANAGER");
      router.push(isClientSpace ? '/my-requests' : '/statistics');
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

  // Si l'utilisateur est connecté, afficher un loader de redirection (sauf en mode aperçu)
  if (isAuth && user && !isPreview) {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = (content || {}) as any;
  const brand = c.brandColor || "#8AB925";
  return (
    <div className="landing-page min-h-screen bg-white" style={brandScaleVars(brand)}>
      <Navbar logoUrl={c.logoUrl} siteName={c.siteName} />
      <Hero title={c.hero?.title} subtitle={c.hero?.subtitle} brand={brand} />
      <Features />
      <Stats />
      <Pricing plans={c.pricing} brand={brand} />
      <Testimonials items={c.testimonials} brand={brand} />
      <Partners items={c.partners} />
      <Contact contact={c.contact} brand={brand} />
      <CTA />
      <Footer />
    </div>
  );
}