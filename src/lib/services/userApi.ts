import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserPaginationParams,
  UpdateProfileRequest,
} from "@/types/user";
import type { PaginatedResponse } from "@/types/company";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["User"],
  endpoints: (builder) => ({
    // GET /users - Get all users with pagination
    getUsers: builder.query<PaginatedResponse<User>, UserPaginationParams>({
      query: (params) => ({
        url: "/users",
        method: "GET",
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          ...(params.search && { search: params.search }),
          ...(params.status && { status: params.status }),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "User" as const,
                id,
              })),
              { type: "User", id: "LIST" },
            ]
          : [{ type: "User", id: "LIST" }],
    }),

    // Infinite query for users (for select dropdowns)
    getUsersInfinite: builder.infiniteQuery<
      PaginatedResponse<User>,
      UserPaginationParams,
      number
    >({
      query: ({ queryArg, pageParam }) => ({
        url: "/users",
        method: "GET",
        params: {
          page: pageParam,
          limit: queryArg.limit || 10,
          ...(queryArg.search && { search: queryArg.search }),
          ...(queryArg.status && { status: queryArg.status }),
        },
      }),
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
          if (lastPage.meta.page < lastPage.meta.totalPages) {
            return lastPage.meta.page + 1;
          }
          return undefined;
        },
      },
      providesTags: [{ type: "User", id: "INFINITE_LIST" }],
    }),

    // Infinite query for users (compatible with MultiInfiniteSelect)
    getUsersForSelect: builder.infiniteQuery<
      PaginatedResponse<User>,
      { search?: string },
      { page: number; limit: number }
    >({
      infiniteQueryOptions: {
        initialPageParam: {
          page: 1,
          limit: 10,
        },
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
          const currentPage = lastPage.meta.page;
          const totalPages = lastPage.meta.totalPages;
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
        url: "/users",
        method: "GET",
        params: {
          page: pageParam.page,
          limit: pageParam.limit,
          ...(queryArg?.search && { search: queryArg.search }),
        },
      }),
      providesTags: [{ type: "User", id: "INFINITE_SELECT_LIST" }],
    }),

    // GET /users/:id - Get user by ID
    getUserById: builder.query<User, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),

    // POST /users - Create a new user
    createUser: builder.mutation<User, CreateUserRequest>({
      query: (body) => ({
        url: "/users",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }, { type: "User", id: "INFINITE_LIST" }],
    }),

    // PATCH /users/:id - Update a user
    updateUser: builder.mutation<User, { id: string; data: UpdateUserRequest }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
        { type: "User", id: "INFINITE_LIST" },
      ],
    }),

    // DELETE /users/:id - Delete a user
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }, { type: "User", id: "INFINITE_LIST" }],
    }),

    // PATCH /users/:id/toggle-status - Toggle user status (active/inactive)
    toggleUserStatus: builder.mutation<{ message: string; user: any }, string>({
      query: (id) => ({
        url: `/users/${id}/toggle-status`,
        method: "PATCH",
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }, { type: "User", id: "INFINITE_LIST" }],
    }),

    // GET /users/profile - Get current user profile
    getProfile: builder.query<User, void>({
      query: () => ({
        url: "/users/profile",
        method: "GET",
      }),
      providesTags: [{ type: "User", id: "PROFILE" }],
    }),

    // PATCH /users/profile - Update current user profile
    updateProfile: builder.mutation<{ message: string; user: User }, FormData>({
      query: (data) => ({
        url: "/users/profile",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [
        { type: "User", id: "PROFILE" },
        { type: "User", id: "LIST" },
        { type: "User", id: "INFINITE_LIST" }
      ],
    }),

    // PATCH /users/change-password - Change user password
    changePassword: builder.mutation<{ message: string }, { current_password: string; new_password: string }>({
      query: (data) => ({
        url: "/users/change-password",
        method: "PATCH",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUsersInfiniteQuery,
  useGetUsersForSelectInfiniteQuery,
  useGetUserByIdQuery,
  useLazyGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useToggleUserStatusMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = userApi;
