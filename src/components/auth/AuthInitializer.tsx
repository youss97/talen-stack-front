"use client";

import { useEffect } from 'react';
import { useAppDispatch } from '@/lib/hooks';
import { setCredentials } from '@/lib/slices/authSlice';

// Importer l'utilitaire de test en développement
if (process.env.NODE_ENV === 'development') {
  import('@/utils/refreshTokenTester');
}

export default function AuthInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialiser l'auth au démarrage de l'application
    const initializeAuth = () => {
      if (typeof window === 'undefined') return;

      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (token && refreshToken) {
        // Si nous avons des tokens, le système de refresh token
        // se chargera automatiquement de vérifier leur validité
        // via useVerifyUserQuery dans AuthGuard
        console.log('🔄 Tokens trouvés, initialisation de l\'auth...');
      }
    };

    initializeAuth();
  }, [dispatch]);

  return null; // Ce composant ne rend rien
}