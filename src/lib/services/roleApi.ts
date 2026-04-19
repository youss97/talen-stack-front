import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  Role,
  RolePaginationParams,
  Feature,
  RoleWithFeatures,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignActionsRequest,
} from "@/types/role";
import type { PaginatedResponse } from "@/types/company";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import { authApi } from "./authApi"; // Import pour invalider le cache des permissions

type RolesPageParam = {
  page: number;
  limit: number;
};

export const roleApi = createApi({
  reducerPath: "roleApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Role", "Feature"],
  endpoints: (builder) => ({
    // GET /roles - Get all roles with pagination
    getRoles: builder.query<PaginatedResponse<Role>, RolePaginationParams>({
      query: (params) => ({
        url: "/roles",
        method: "GET",
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          ...(params.search && { search: params.search }),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "Role" as const,
                id,
              })),
              { type: "Role", id: "LIST" },
            ]
          : [{ type: "Role", id: "LIST" }],
    }),

    // Infinite query for roles (for select dropdowns)
    getRolesForSelect: builder.infiniteQuery<
      PaginatedResponse<Role>,
      { search?: string },
      RolesPageParam
    >({
      infiniteQueryOptions: {
        initialPageParam: {
          page: 1,
          limit: 10,
        },
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
          const currentPage = lastPage.pagination?.page ?? 1;
          const totalPages = lastPage.pagination?.totalPages ?? 1;
          if (currentPage >= totalPages) {
            return undefined;
          }
          return {
            ...lastPageParam,
            page: lastPageParam.page + 1,
          };
        },
        getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => {
          if (firstPageParam.page > 1) {
            return {
              ...firstPageParam,
              page: firstPageParam.page - 1,
            };
          }
          return undefined;
        },
      },
      query: ({ pageParam, queryArg }) => ({
        url: "/roles",
        method: "GET",
        params: {
          page: pageParam.page,
          limit: pageParam.limit,
          ...(queryArg?.search && { search: queryArg.search }),
        },
      }),
      providesTags: [{ type: "Role", id: "INFINITE_LIST" }],
    }),

    // Infinite query for roles suitable for user creation (excludes specialized roles)
    getRolesForUserCreation: builder.infiniteQuery<
      PaginatedResponse<Role>,
      { search?: string },
      RolesPageParam
    >({
      infiniteQueryOptions: {
        initialPageParam: {
          page: 1,
          limit: 10,
        },
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
          const currentPage = lastPage.pagination?.page ?? 1;
          const totalPages = lastPage.pagination?.totalPages ?? 1;
          if (currentPage >= totalPages) {
            return undefined;
          }
          return {
            ...lastPageParam,
            page: lastPageParam.page + 1,
          };
        },
        getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => {
          if (firstPageParam.page > 1) {
            return {
              ...firstPageParam,
              page: firstPageParam.page - 1,
            };
          }
          return undefined;
        },
      },
      query: ({ pageParam, queryArg }) => {
        // Essayer d'abord le nouvel endpoint, avec fallback vers l'ancien
        return {
          url: "/roles/for-user-creation",
          method: "GET",
          params: {
            page: pageParam.page,
            limit: pageParam.limit,
            ...(queryArg?.search && { search: queryArg.search }),
          },
        };
      },
      providesTags: [{ type: "Role", id: "USER_CREATION_LIST" }],
      // Transformation côté client pour filtrer les rôles Manager/Client Manager
      transformResponse: (response: PaginatedResponse<Role>) => {
        const filteredData = response.data?.filter(role => 
          role.name !== 'Manager' && 
          role.name !== 'Client Manager' && 
          !role.code?.startsWith('CLIENT_MANAGER_')
        ) || [];
        
        return {
          ...response,
          data: filteredData,
          total: filteredData.length
        };
      },
    }),

    // Fallback query using the regular roles endpoint with client-side filtering
    getRolesForUserCreationFallback: builder.infiniteQuery<
      PaginatedResponse<Role>,
      { search?: string },
      RolesPageParam
    >({
      infiniteQueryOptions: {
        initialPageParam: {
          page: 1,
          limit: 10,
        },
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
          const currentPage = lastPage.pagination?.page ?? 1;
          const totalPages = lastPage.pagination?.totalPages ?? 1;
          if (currentPage >= totalPages) {
            return undefined;
          }
          return {
            ...lastPageParam,
            page: lastPageParam.page + 1,
          };
        },
        getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => {
          if (firstPageParam.page > 1) {
            return {
              ...firstPageParam,
              page: firstPageParam.page - 1,
            };
          }
          return undefined;
        },
      },
      query: ({ pageParam, queryArg }) => ({
        url: "/roles",
        method: "GET",
        params: {
          page: pageParam.page,
          limit: pageParam.limit,
          ...(queryArg?.search && { search: queryArg.search }),
        },
      }),
      providesTags: [{ type: "Role", id: "USER_CREATION_FALLBACK_LIST" }],
      // Filtrage côté client des rôles Manager/Client Manager
      transformResponse: (response: PaginatedResponse<Role>) => {
        const filteredData = response.data?.filter(role => 
          role.name !== 'Manager' && 
          role.name !== 'Client Manager' && 
          !role.code?.startsWith('CLIENT_MANAGER_')
        ) || [];
        
        return {
          ...response,
          data: filteredData,
          total: filteredData.length
        };
      },
    }),

    // GET /roles/:id - Get role by ID with features
    getRoleById: builder.query<RoleWithFeatures, string>({
      query: (id) => ({
        url: `/roles/${id}`,
        method: "GET",
      }),
      providesTags: (_r, _e, id) => [{ type: "Role", id }],
    }),

    // POST /roles - Create a new role
    createRole: builder.mutation<Role, CreateRoleRequest>({
      query: (body) => ({
        url: "/roles",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Role", id: "LIST" }, { type: "Role", id: "INFINITE_LIST" }, { type: "Role", id: "USER_CREATION_LIST" }],
    }),

    // PATCH /roles/:id - Update a role
    updateRole: builder.mutation<Role, { id: string; data: UpdateRoleRequest }>({
      query: ({ id, data }) => ({
        url: `/roles/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Role", id },
        { type: "Role", id: "LIST" },
        { type: "Role", id: "INFINITE_LIST" },
        { type: "Role", id: "USER_CREATION_LIST" },
      ],
      // Mise à jour optimiste pour une meilleure UX
      async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
        // Mise à jour optimiste de la liste
        const patchResult = dispatch(
          roleApi.util.updateQueryData('getRoles', { page: 1, limit: 10 }, (draft) => {
            const role = draft.data.find((r) => r.id === id);
            if (role) {
              Object.assign(role, data);
            }
          })
        );
        
        try {
          await queryFulfilled;
          
          // IMPORTANT: Invalider les données utilisateur pour rafraîchir les permissions
          // Cela force le refetch de /auth/me qui contient les nouvelles permissions
          dispatch(authApi.util.invalidateTags(['Auth']));
          
          console.log(`✅ Role ${id} updated and user permissions cache invalidated`);
        } catch {
          patchResult.undo();
        }
      },
    }),

    // DELETE /roles/:id - Delete a role
    deleteRole: builder.mutation<void, string>({
      query: (id) => ({
        url: `/roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Role", id: "LIST" }, { type: "Role", id: "INFINITE_LIST" }, { type: "Role", id: "USER_CREATION_LIST" }],
    }),

    // GET /roles/features/all - Get all features with pages and actions
    getFeatures: builder.query<Feature[], void>({
      query: () => ({
        url: "/roles/features/all",
        method: "GET",
      }),
      providesTags: [{ type: "Feature", id: "ALL" }],
    }),

    // POST /roles/:id/actions - Assign actions to role
    assignActionsToRole: builder.mutation<void, { id: string; data: AssignActionsRequest }>({
      query: ({ id, data }) => ({
        url: `/roles/${id}/actions`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Role", id },
        { type: "Role", id: "LIST" },
        { type: "Role", id: "INFINITE_LIST" },
        { type: "Role", id: "USER_CREATION_LIST" },
        { type: "Role", id: `ACTIONS_${id}` },
      ],
      // Forcer le refetch du rôle et des permissions utilisateur après assignation des actions
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Forcer le refetch du rôle pour s'assurer que les permissions sont à jour
          dispatch(roleApi.util.invalidateTags([{ type: "Role", id }]));
          
          // IMPORTANT: Invalider les données utilisateur pour rafraîchir les permissions
          // Cela force le refetch de /auth/me qui contient les nouvelles permissions
          dispatch(authApi.util.invalidateTags(['Auth']));
          
          console.log(`✅ Actions assigned and cache invalidated for role ${id}`);
          console.log(`🔄 User permissions cache invalidated - will refetch on next access`);
        } catch (error) {
          console.error(`❌ Error assigning actions to role ${id}:`, error);
        }
      },
    }),

    // GET /roles/:id/actions - Get role actions
    getRoleActions: builder.query<string[], string>({
      query: (id) => ({
        url: `/roles/${id}/actions`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Role", id: `ACTIONS_${id}` }],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRolesForSelectInfiniteQuery,
  useGetRolesForUserCreationInfiniteQuery,
  useGetRolesForUserCreationFallbackInfiniteQuery,
  useGetRoleByIdQuery,
  useLazyGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetFeaturesQuery,
  useAssignActionsToRoleMutation,
  useGetRoleActionsQuery,
} = roleApi;
