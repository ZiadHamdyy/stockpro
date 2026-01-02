import { apiSlice } from "../../ApiSlice";
import { PricingConfig } from "../../../pages/settings/financial-system/types";

export const financialSettingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFinancialSettings: builder.query<PricingConfig, void>({
      query: () => "/company/financial-settings",
      providesTags: ["Company", "FinancialSettings"],
      transformResponse: (response: { data: PricingConfig }): PricingConfig => {
        return response.data;
      },
    }),
    updateFinancialSettings: builder.mutation<PricingConfig, PricingConfig>({
      query: (data) => ({
        url: "/company/financial-settings",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Company", "FinancialSettings"],
      transformResponse: (response: { data: PricingConfig }): PricingConfig => {
        return response.data;
      },
    }),
  }),
});

export const {
  useGetFinancialSettingsQuery,
  useUpdateFinancialSettingsMutation,
} = financialSettingsApi;


