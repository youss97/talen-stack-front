"use client";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useVerifyUserQuery } from "@/lib/services/authApi";
import type { RootState } from "@/lib/store";

/**
 * Composant qui rafraîchit automatiquement les permissions utilisateur
 * quand les rôles sont modifiés
 */
export default function PermissionsRefresher() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { refetch } = useVerifyUserQuery();

  useEffect(() => {
    // Écouter les événements personnalisés de modification de rôles
    const handleRoleUpdate = () => {
      console.log('🔄 Role updated event received - refreshing user permissions');
      refetch();
    };

    // Écouter l'événement personnalisé
    window.addEventListener('roleUpdated', handleRoleUpdate);
    window.addEventListener('rolePermissionsUpdated', handleRoleUpdate);

    return () => {
      window.removeEventListener('roleUpdated', handleRoleUpdate);
      window.removeEventListener('rolePermissionsUpdated', handleRoleUpdate);
    };
  }, [refetch]);

  // Pas de rafraîchissement automatique périodique - c'est dangereux et inutile
  // Les permissions sont rafraîchies uniquement quand nécessaire via les événements

  return null; // Ce composant ne rend rien
}

// Fonctions utilitaires pour déclencher les événements
export const triggerRoleUpdateEvent = () => {
  window.dispatchEvent(new CustomEvent('roleUpdated'));
};

export const triggerRolePermissionsUpdateEvent = () => {
  window.dispatchEvent(new CustomEvent('rolePermissionsUpdated'));
};