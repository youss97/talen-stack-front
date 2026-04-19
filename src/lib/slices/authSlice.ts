import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User } from '@/types/auth';
import { authApi } from '../services/authApi';
import { userApi } from '../services/userApi';

const initialState: AuthState = {
  isAuth: null,
  user: null,
  token: null,
  refresh_token: null,
  permissionsReady: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string; refresh_token?: string }>
    ) => {
      state.isAuth = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refresh_token = action.payload.refresh_token || null;
      // Ne pas réinitialiser permissionsReady si déjà true
      if (!state.permissionsReady && action.payload.user.features) {
        state.permissionsReady = true;
      }
    },
    setTokens: (
      state,
      action: PayloadAction<{ token: string; refresh_token: string }>
    ) => {
      state.token = action.payload.token;
      state.refresh_token = action.payload.refresh_token;
    },
    updateUserImage: (
      state,
      action: PayloadAction<string>
    ) => {
      if (state.user) {
        state.user.photo_path = action.payload;
      }
    },
    logout: (state) => {
      state.isAuth = null;
      state.user = null;
      state.token = null;
      state.refresh_token = null;
      state.permissionsReady = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
      }
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      authApi.endpoints.verifyUser.matchFulfilled,
      (state, { payload }) => {
        const { access_token, ...userProps } = payload;
        state.user = {
          id: userProps.id,
          email: userProps.email,
          first_name: userProps.first_name,
          last_name: userProps.last_name,
          status: userProps.status,
          photo_path: userProps.photo_path,
          role: userProps.role,
          company: userProps.company,
          features: userProps.features || [],
        };
        state.token = access_token;
        state.isAuth = true;
        state.permissionsReady = true;
      }
    );
    builder.addMatcher(
      authApi.endpoints.login.matchFulfilled,
      (state, { payload }) => {
        state.user = payload.user;
        state.token = payload.access_token;
        state.refresh_token = payload.refresh_token || null;
        state.isAuth = true;
        state.permissionsReady = true;
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', payload.access_token);
          if (payload.refresh_token) {
            localStorage.setItem('refresh_token', payload.refresh_token);
          }
        }
      }
    );
    // Mettre à jour l'utilisateur quand le profil est modifié
    builder.addMatcher(
      userApi.endpoints.updateProfile.matchFulfilled,
      (state, { payload }) => {
        if (state.user && payload.user) {
          // Mettre à jour les informations utilisateur dans le state
          state.user = {
            ...state.user,
            ...payload.user,
            // S'assurer que photo_path est mise à jour correctement
            photo_path: payload.user.photo_path || state.user.photo_path,
          } as any;
        }
      }
    );
  },
});

export const { setCredentials, setTokens, updateUserImage, logout } = authSlice.actions;
export default authSlice.reducer;
