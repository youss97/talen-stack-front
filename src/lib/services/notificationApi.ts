import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationsResponse {
  data: AppNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const notificationApi = createApi({
  reducerPath: "notificationApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Notification", "UnreadCount"],
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationsResponse, { page?: number; limit?: number } | void>({
      query: (params) => ({
        url: "/notifications",
        method: "GET",
        params: { page: params?.page || 1, limit: params?.limit || 20 },
      }),
      providesTags: ["Notification"],
    }),
    getUnreadCount: builder.query<{ count: number }, void>({
      query: () => ({ url: "/notifications/unread-count", method: "GET" }),
      providesTags: ["UnreadCount"],
    }),
    markNotificationRead: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Notification", "UnreadCount"],
    }),
    markAllNotificationsRead: builder.mutation<{ success: boolean }, void>({
      query: () => ({ url: "/notifications/read-all", method: "PATCH" }),
      invalidatesTags: ["Notification", "UnreadCount"],
    }),
    deleteNotification: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/notifications/${id}`, method: "DELETE" }),
      invalidatesTags: ["Notification", "UnreadCount"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} = notificationApi;
