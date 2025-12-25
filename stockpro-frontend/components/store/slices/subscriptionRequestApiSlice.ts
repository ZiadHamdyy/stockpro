import { apiSlice } from "../ApiSlice";

export type SubscriptionRequestStatus = 'PENDING' | 'CONTACTED' | 'APPROVED' | 'REJECTED';

export type PlanType = 'basic' | 'pro' | 'enterprise';

export interface SubscriptionRequest {
  id: string;
  plan: PlanType;
  name: string;
  email: string;
  phone: string;
  companyName: string | null;
  status: SubscriptionRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionRequestRequest {
  plan: PlanType;
  name: string;
  email: string;
  phone: string;
  companyName?: string;
}

export interface UpdateSubscriptionRequestStatusRequest {
  status: SubscriptionRequestStatus;
}

export const subscriptionRequestApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createSubscriptionRequest: builder.mutation<SubscriptionRequest, CreateSubscriptionRequestRequest>({
      query: (data) => ({
        url: '/subscription-requests',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { data: SubscriptionRequest }): SubscriptionRequest => {
        return response.data;
      },
      invalidatesTags: ['SubscriptionRequest'],
    }),

    getSubscriptionRequests: builder.query<SubscriptionRequest[], { status?: SubscriptionRequestStatus } | void>({
      query: (params) => {
        const queryParams = params && typeof params === 'object' && 'status' in params && params.status ? `?status=${params.status}` : '';
        return `/subscription-requests${queryParams}`;
      },
      transformResponse: (response: { data: SubscriptionRequest[] }): SubscriptionRequest[] => {
        return response.data || [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'SubscriptionRequest' as const, id })),
              { type: 'SubscriptionRequest', id: 'LIST' },
            ]
          : [{ type: 'SubscriptionRequest', id: 'LIST' }],
    }),

    getSubscriptionRequest: builder.query<SubscriptionRequest, string>({
      query: (id) => `/subscription-requests/${id}`,
      transformResponse: (response: { data: SubscriptionRequest }): SubscriptionRequest => {
        return response.data;
      },
      providesTags: (result, error, id) => [{ type: 'SubscriptionRequest', id }],
    }),

    updateSubscriptionRequestStatus: builder.mutation<
      SubscriptionRequest,
      { id: string; data: UpdateSubscriptionRequestStatusRequest }
    >({
      query: ({ id, data }) => ({
        url: `/subscription-requests/${id}/status`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: { data: SubscriptionRequest }): SubscriptionRequest => {
        return response.data;
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'SubscriptionRequest', id },
        { type: 'SubscriptionRequest', id: 'LIST' },
      ],
    }),

    deleteSubscriptionRequest: builder.mutation<void, string>({
      query: (id) => ({
        url: `/subscription-requests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'SubscriptionRequest', id },
        { type: 'SubscriptionRequest', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateSubscriptionRequestMutation,
  useGetSubscriptionRequestsQuery,
  useGetSubscriptionRequestQuery,
  useUpdateSubscriptionRequestStatusMutation,
  useDeleteSubscriptionRequestMutation,
} = subscriptionRequestApiSlice;

