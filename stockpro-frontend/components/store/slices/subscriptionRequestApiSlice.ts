import { apiSlice } from "../ApiSlice";

export type SubscriptionRequestStatus = 'PENDING' | 'CONTACTED' | 'APPROVED' | 'REJECTED';

export type SubscriptionRequestType = 'SUBSCRIPTION' | 'TRIAL';

export type PlanType = 'basic' | 'pro' | 'enterprise';

export interface SubscriptionRequest {
  id: string;
  type: SubscriptionRequestType;
  plan: PlanType | null;
  name: string;
  email: string;
  phone: string;
  companyName: string | null;
  status: SubscriptionRequestStatus;
  trialDurationDays: number | null;
  trialStartDate: string | null;
  trialEndDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionRequestRequest {
  type?: SubscriptionRequestType;
  plan?: PlanType;
  name: string;
  email: string;
  phone: string;
  companyName?: string;
}

export interface CreateTrialRequestRequest {
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

    getSubscriptionRequests: builder.query<SubscriptionRequest[], { status?: SubscriptionRequestStatus; type?: SubscriptionRequestType } | void>({
      query: (params) => {
        if (!params || typeof params !== 'object') {
          return '/subscription-requests';
        }
        const queryParams: string[] = [];
        if (params.status) queryParams.push(`status=${params.status}`);
        if (params.type) queryParams.push(`type=${params.type}`);
        return `/subscription-requests${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`;
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
        { type: 'SubscriptionRequest', id: 'TRIAL_LIST' },
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
        { type: 'SubscriptionRequest', id: 'TRIAL_LIST' },
      ],
    }),

    createTrialRequest: builder.mutation<SubscriptionRequest, CreateTrialRequestRequest>({
      query: (data) => ({
        url: '/subscription-requests',
        method: 'POST',
        body: {
          ...data,
          type: 'TRIAL' as SubscriptionRequestType,
        },
      }),
      transformResponse: (response: { data: SubscriptionRequest }): SubscriptionRequest => {
        return response.data;
      },
      invalidatesTags: ['SubscriptionRequest', { type: 'SubscriptionRequest', id: 'TRIAL_LIST' }],
    }),

    getTrialRequests: builder.query<SubscriptionRequest[], { status?: SubscriptionRequestStatus } | void>({
      query: (params) => {
        const statusParam = params && typeof params === 'object' && 'status' in params && params.status ? `status=${params.status}` : '';
        const typeParam = 'type=TRIAL';
        const queryParams = [typeParam];
        if (statusParam) queryParams.push(statusParam);
        return `/subscription-requests?${queryParams.join('&')}`;
      },
      transformResponse: (response: { data: SubscriptionRequest[] }): SubscriptionRequest[] => {
        return response.data || [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'SubscriptionRequest' as const, id })),
              { type: 'SubscriptionRequest', id: 'TRIAL_LIST' },
            ]
          : [{ type: 'SubscriptionRequest', id: 'TRIAL_LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateSubscriptionRequestMutation,
  useCreateTrialRequestMutation,
  useGetSubscriptionRequestsQuery,
  useGetTrialRequestsQuery,
  useGetSubscriptionRequestQuery,
  useUpdateSubscriptionRequestStatusMutation,
  useDeleteSubscriptionRequestMutation,
} = subscriptionRequestApiSlice;

