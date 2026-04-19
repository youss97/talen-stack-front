import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  Client,
  CreateClientRequest,
  UpdateClientRequest,
  ClientPaginationParams,
  Manager,
} from "@/types/client";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

interface ClientPaginatedResponse {
  data: Client[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ManagerPaginatedResponse {
  data: Manager[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

type ClientsPageParam = {
  page: number;
  limit: number;
};

export const clientApi = createApi({
  reducerPath: "clientApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Client"],
  endpoints: (builder) => ({
    // GET /clients - Get all clients with pagination
    getClients: builder.query<ClientPaginatedResponse, ClientPaginationParams>({
      query: (params) => ({
        url: "/clients",
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
                type: "Client" as const,
                id,
              })),
              { type: "Client", id: "LIST" },
            ]
          : [{ type: "Client", id: "LIST" }],
    }),

    // Infinite query for clients (for select dropdowns)
    getClientsForSelect: builder.infiniteQuery<
      ClientPaginatedResponse,
      { search?: string },
      ClientsPageParam
    >({
      infiniteQueryOptions: {
        initialPageParam: {
          page: 1,
          limit: 10,
        },
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
          const currentPage = lastPage.pagination.page;
          const totalPages = lastPage.pagination.totalPages;
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
        url: "/clients",
        method: "GET",
        params: {
          page: pageParam.page,
          limit: pageParam.limit,
          ...(queryArg?.search && { search: queryArg.search }),
        },
      }),
      providesTags: [{ type: "Client", id: "INFINITE_LIST" }],
    }),

    // GET /clients/:id - Get client by ID
    getClientById: builder.query<Client, string>({
      query: (id) => ({
        url: `/clients/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Client", id }],
    }),

    // POST /clients - Create a new client with admin
    createClient: builder.mutation<Client, CreateClientRequest>({
      query: (body) => ({
        url: "/clients",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Client", id: "LIST" }, { type: "Client", id: "INFINITE_LIST" }],
    }),

    // PATCH /clients/:id - Update a client
    updateClient: builder.mutation<Client, { id: string; data: UpdateClientRequest }>({
      query: ({ id, data }) => ({
        url: `/clients/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Client", id },
        { type: "Client", id: "LIST" },
        { type: "Client", id: "INFINITE_LIST" },
      ],
    }),

    // DELETE /clients/:id - Delete a client
    deleteClient: builder.mutation<void, string>({
      query: (id) => ({
        url: `/clients/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Client", id: "LIST" }, { type: "Client", id: "INFINITE_LIST" }],
    }),

    // PATCH /clients/:id/toggle-status - Toggle client status
    toggleClientStatus: builder.mutation<any, string>({
      query: (id) => ({
        url: `/clients/${id}/toggle-status`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Client", id },
        { type: "Client", id: "LIST" },
        { type: "Client", id: "INFINITE_LIST" },
      ],
    }),

    // GET /clients/:id/managers - Get managers of a client with pagination
    getClientManagers: builder.query<
      ManagerPaginatedResponse,
      { clientId: string; page?: number; limit?: number; search?: string; status?: string }
    >({
      query: ({ clientId, ...params }) => ({
        url: `/clients/${clientId}/managers`,
        method: "GET",
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          ...(params.search && { search: params.search }),
          ...(params.status && { status: params.status }),
        },
      }),
      transformResponse: (response: any) => {
        // The API returns data with nested manager object
        // Transform to extract manager details and add displayName
        const transformedData = response.data.map((item: any) => {
          const mgr = item.manager;
          return {
            id: mgr.id,
            firstName: mgr.first_name,
            lastName: mgr.last_name,
            email: mgr.email,
            position: mgr.position,
            status: mgr.status,
            displayName: `${mgr.first_name} ${mgr.last_name}${mgr.position ? ` - ${mgr.position}` : ''}`,
          };
        });
        return {
          ...response,
          data: transformedData,
        };
      },
      providesTags: (_result, _error, { clientId }) => [{ type: "Client", id: `MANAGERS_${clientId}` }],
    }),

    // Infinite query for client managers (for select dropdowns)
    getClientManagersForSelect: builder.infiniteQuery<
      ManagerPaginatedResponse,
      { clientId: string; search?: string },
      ClientsPageParam
    >({
      infiniteQueryOptions: {
        initialPageParam: {
          page: 1,
          limit: 10,
        },
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
          const currentPage = lastPage.pagination.page;
          const totalPages = lastPage.pagination.totalPages;
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
        url: `/clients/${queryArg.clientId}/managers`,
        method: "GET",
        params: {
          page: pageParam.page,
          limit: pageParam.limit,
          ...(queryArg?.search && { search: queryArg.search }),
        },
      }),
      transformResponse: (response: any) => {
        // The API returns data with nested manager object
        // Transform to extract manager details and add displayName
        const transformedData = response.data.map((item: any) => {
          const mgr = item.manager;
          return {
            id: mgr.id,
            firstName: mgr.first_name,
            lastName: mgr.last_name,
            email: mgr.email,
            position: mgr.position,
            displayName: `${mgr.first_name} ${mgr.last_name}${mgr.position ? ` - ${mgr.position}` : ''}`,
          };
        });
        return {
          ...response,
          data: transformedData,
        };
      },
      providesTags: (_result, _error, { clientId }) => [{ type: "Client", id: `MANAGERS_INFINITE_${clientId}` }],
    }),

    // POST /clients/:id/managers/create - Create a new manager for a client
    createManagerForClient: builder.mutation<
      any,
      { clientId: string; managerData: FormData }
    >({
      query: ({ clientId, managerData }) => ({
        url: `/clients/${clientId}/managers/create`,
        method: "POST",
        body: managerData,
      }),
      invalidatesTags: (_result, _error, { clientId }) => [
        { type: "Client", id: clientId },
        { type: "Client", id: `MANAGERS_${clientId}` },
        { type: "Client", id: `MANAGERS_INFINITE_${clientId}` },
      ],
    }),

    // PUT /clients/:id/managers/:managerId - Update a manager
    updateManager: builder.mutation<
      any,
      { clientId: string; managerId: string; managerData: FormData }
    >({
      query: ({ clientId, managerId, managerData }) => ({
        url: `/clients/${clientId}/managers/${managerId}`,
        method: "PUT",
        body: managerData,
      }),
      invalidatesTags: (_result, _error, { clientId }) => [
        { type: "Client", id: clientId },
        { type: "Client", id: `MANAGERS_${clientId}` },
        { type: "Client", id: `MANAGERS_INFINITE_${clientId}` },
      ],
    }),

    // POST /clients/:id/managers - Assign existing manager to client
    assignManagerToClient: builder.mutation<
      any,
      { clientId: string; manager_id: string }
    >({
      query: ({ clientId, manager_id }) => ({
        url: `/clients/${clientId}/managers`,
        method: "POST",
        body: { manager_id },
      }),
      invalidatesTags: (_result, _error, { clientId }) => [
        { type: "Client", id: clientId },
        { type: "Client", id: `MANAGERS_${clientId}` },
        { type: "Client", id: `MANAGERS_INFINITE_${clientId}` },
      ],
    }),

    // DELETE /clients/:id/managers/:managerId - Remove manager from client
    removeManagerFromClient: builder.mutation<
      void,
      { clientId: string; managerId: string }
    >({
      query: ({ clientId, managerId }) => ({
        url: `/clients/${clientId}/managers/${managerId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { clientId }) => [
        { type: "Client", id: clientId },
        { type: "Client", id: `MANAGERS_${clientId}` },
        { type: "Client", id: `MANAGERS_INFINITE_${clientId}` },
      ],
    }),

    // PATCH /clients/:id/managers/:managerId/toggle-status - Toggle manager status
    toggleManagerStatus: builder.mutation<
      any,
      { clientId: string; managerId: string }
    >({
      query: ({ clientId, managerId }) => ({
        url: `/clients/${clientId}/managers/${managerId}/toggle-status`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, { clientId }) => [
        { type: "Client", id: clientId },
        { type: "Client", id: `MANAGERS_${clientId}` },
        { type: "Client", id: `MANAGERS_INFINITE_${clientId}` },
      ],
    }),
  }),
});

export const {
  useGetClientsQuery,
  useGetClientsForSelectInfiniteQuery,
  useGetClientByIdQuery,
  useLazyGetClientByIdQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useToggleClientStatusMutation,
  useGetClientManagersQuery,
  useGetClientManagersForSelectInfiniteQuery,
  useCreateManagerForClientMutation,
  useUpdateManagerMutation,
  useAssignManagerToClientMutation,
  useRemoveManagerFromClientMutation,
  useToggleManagerStatusMutation,
} = clientApi;
