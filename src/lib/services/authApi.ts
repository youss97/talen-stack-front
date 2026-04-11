import { createApi } from '@reduxjs/toolkit/query/react';
import type { LoginRequest, LoginResponse, VerifyUserResponse } from '@/types/auth';
import { baseQueryWithReauth } from './baseQueryWithReauth';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth'],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),
    verifyUser: builder.query<VerifyUserResponse, void>({
      query: () => ({
        url: '/auth/me',
        method: 'GET',
      }),
      providesTags: ['Auth'],
    }),

    // POST /auth/logout - Logout user
    logout: builder.mutation<void, { refresh_token?: string }>({
      query: (body) => ({
        url: '/auth/logout',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),
    
    // POST /auth/refresh - Refresh access token
    refresh: builder.mutation<LoginResponse, { refresh_token: string }>({
      query: (body) => ({
        url: '/auth/refresh',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useLoginMutation, useVerifyUserQuery, useLogoutMutation, useRefreshMutation } = authApi;
