import { apiSlice, getCompanyCode } from "../ApiSlice";
import type { Subscription, PlanLimits, UsageStats } from "../../../types";

interface UpdateSubscriptionRequest {
  planType: 'BASIC' | 'GROWTH' | 'BUSINESS';
}

export const subscriptionApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentSubscription: builder.query<Subscription, void>({
      query: () => '/subscriptions/current',
      transformResponse: (response: { data: Subscription }): Subscription => {
        // NestJS wraps responses in { code, success, message, data }
        return response.data;
      },
      providesTags: (result, error, arg, meta) => {
        // Include company code in tags so cache is company-specific
        const companyCode = getCompanyCode();
        return companyCode 
          ? [{ type: 'Subscription', id: `current-${companyCode}` }, 'Subscription']
          : ['Subscription'];
      },
      // Force refetch when company code changes by using code as part of query key
      keepUnusedDataFor: 0, // Don't cache across company switches
    }),

    getPlanLimits: builder.query<PlanLimits, void>({
      query: () => '/subscriptions/limits',
      transformResponse: (response: { data: PlanLimits }): PlanLimits => {
        // NestJS wraps responses in { code, success, message, data }
        return response.data;
      },
      providesTags: (result, error, arg, meta) => {
        const companyCode = getCompanyCode();
        return companyCode 
          ? [{ type: 'Subscription', id: `limits-${companyCode}` }, 'Subscription']
          : ['Subscription'];
      },
      keepUnusedDataFor: 0,
    }),

    getUsageStats: builder.query<UsageStats, void>({
      query: () => '/subscriptions/usage',
      transformResponse: (response: { data: UsageStats }): UsageStats => {
        // NestJS wraps responses in { code, success, message, data }
        return response.data;
      },
      providesTags: (result, error, arg, meta) => {
        const companyCode = getCompanyCode();
        return companyCode 
          ? [{ type: 'Subscription', id: `usage-${companyCode}` }, 'Subscription']
          : ['Subscription'];
      },
      keepUnusedDataFor: 0,
    }),

    upgradePlan: builder.mutation<Subscription, UpdateSubscriptionRequest>({
      query: (data) => ({
        url: '/subscriptions/upgrade',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Subscription'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCurrentSubscriptionQuery,
  useGetPlanLimitsQuery,
  useGetUsageStatsQuery,
  useUpgradePlanMutation,
} = subscriptionApiSlice;

