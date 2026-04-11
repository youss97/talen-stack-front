import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { Mutex } from 'async-mutex';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Mutex pour éviter les appels simultanés de refresh
const mutex = new Mutex();

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Attendre que le mutex soit libéré si un refresh est en cours
  await mutex.waitForUnlock();
  
  let result = await baseQuery(args, api, extraOptions);

  // Si on reçoit une erreur 401, essayer de rafraîchir le token
  if (result.error && result.error.status === 401) {
    // Vérifier si le mutex n'est pas déjà verrouillé
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      
      try {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
        
        if (!refreshToken) {
          // Pas de refresh token, déconnecter l'utilisateur
          console.log('🚫 Pas de refresh token disponible, déconnexion...');
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
          }
          api.dispatch({ type: 'auth/logout' });
          return result;
        }

        console.log('🔄 Token expiré, tentative de refresh...');
        
        // Appeler l'endpoint de refresh
        const refreshResult = await baseQuery(
          {
            url: '/auth/refresh',
            method: 'POST',
            body: { refresh_token: refreshToken },
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          const data = refreshResult.data as {
            access_token: string;
            refresh_token: string;
            user: any;
          };
          
          console.log('✅ Token rafraîchi avec succès');
          
          // Sauvegarder les nouveaux tokens
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
          }
          
          // Mettre à jour le store Redux
          api.dispatch({
            type: 'auth/setTokens',
            payload: {
              token: data.access_token,
              refresh_token: data.refresh_token,
            },
          });
          
          // Rejouer la requête originale avec le nouveau token
          result = await baseQuery(args, api, extraOptions);
        } else {
          // Le refresh a échoué, déconnecter l'utilisateur
          console.log('❌ Refresh token invalide ou expiré, déconnexion...');
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
          }
          api.dispatch({ type: 'auth/logout' });
        }
      } catch (error) {
        // Erreur lors du refresh, déconnecter l'utilisateur
        console.error('❌ Erreur lors du refresh token:', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
        }
        api.dispatch({ type: 'auth/logout' });
      } finally {
        release();
      }
    } else {
      // Attendre que le refresh en cours se termine
      await mutex.waitForUnlock();
      // Rejouer la requête avec le token potentiellement rafraîchi
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};
