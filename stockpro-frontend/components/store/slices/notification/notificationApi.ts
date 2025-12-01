import { apiSlice } from "../../ApiSlice";

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  relatedId?: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  storeTransferVoucher?: {
    id: string;
    voucherNumber: string;
    fromStore?: {
      id: string;
      name: string;
    };
    toStore?: {
      id: string;
      name: string;
    };
  };
}

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<Notification[], void>({
      query: () => "notifications",
      transformResponse: (response: { data: Notification[] }) => response.data,
      providesTags: ["Notification"],
    }),
    getUnreadCount: builder.query<number, void>({
      query: () => "notifications/unread-count",
      transformResponse: (response: { data: number }) => response.data,
      providesTags: ["Notification"],
    }),
    markAsRead: builder.mutation<void, string>({
      query: (id) => ({
        url: `notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),
    markAllAsRead: builder.mutation<void, void>({
      query: () => ({
        url: "notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} = notificationApi;


