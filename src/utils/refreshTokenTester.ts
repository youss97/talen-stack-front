/**
 * Utilitaire pour tester le système de refresh token en développement
 * À utiliser uniquement en mode développement pour valider le fonctionnement
 */

export const refreshTokenTester = {
  /**
   * Simule l'expiration d'un token en le modifiant
   * Utile pour tester le refresh automatique
   */
  expireCurrentToken() {
    if (typeof window === 'undefined') return;
    
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
      // Modifier légèrement le token pour le rendre invalide
      const expiredToken = currentToken.slice(0, -5) + 'EXPIRED';
      localStorage.setItem('token', expiredToken);
      console.log('🧪 Token artificially expired for testing');
    }
  },

  /**
   * Corrompt le refresh token pour tester la déconnexion automatique
   */
  corruptRefreshToken() {
    if (typeof window === 'undefined') return;
    
    const currentRefreshToken = localStorage.getItem('refresh_token');
    if (currentRefreshToken) {
      localStorage.setItem('refresh_token', 'CORRUPTED_TOKEN');
      console.log('🧪 Refresh token corrupted for testing');
    }
  },

  /**
   * Affiche les informations des tokens actuels
   */
  showTokenInfo() {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    console.log('🔍 Current tokens info:');
    console.log('Access Token:', token ? `${token.substring(0, 20)}...` : 'None');
    console.log('Refresh Token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'None');
  },

  /**
   * Nettoie tous les tokens (simule une déconnexion manuelle)
   */
  clearAllTokens() {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    console.log('🧹 All tokens cleared');
  }
};

// Exposer l'utilitaire globalement en mode développement
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).refreshTokenTester = refreshTokenTester;
  console.log('🧪 Refresh Token Tester available at window.refreshTokenTester');
}