import { apiSlice } from "../../ApiSlice";

// ==================== Item Profitability Report Types ====================

export interface ItemProfitabilityItem {
  id: string;
  code: string;
  name: string;
  group: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  reorderLimit: number;
  netQty: number;
  netRevenue: number;
  cogs: number;
  grossProfit: number;
  marginPercent: number;
}

export interface ItemProfitabilityReportQuery {
  startDate: string;
  endDate: string;
}

export const itemProfitabilityApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getItemProfitabilityReport: builder.query<
      ItemProfitabilityItem[],
      ItemProfitabilityReportQuery
    >({
      query: (params) => {
        const queryParams: Record<string, string> = {
          startDate: params.startDate,
          endDate: params.endDate,
        };
        return {
          url: "item-profitability-report",
          params: queryParams,
        };
      },
      transformResponse: (response: ItemProfitabilityItem[] | { data: ItemProfitabilityItem[] }) => {
        // Handle both direct response and wrapped response
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      },
      providesTags: [{ type: "ItemProfitabilityReport", id: "GLOBAL" }],
    }),
  }),
});

export const { useGetItemProfitabilityReportQuery } = itemProfitabilityApiSlice;

