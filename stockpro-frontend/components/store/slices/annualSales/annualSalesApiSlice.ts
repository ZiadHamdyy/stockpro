import { apiSlice } from "../../ApiSlice";

// ==================== Annual Sales Report Types ====================

export interface AnnualSalesReportMonth {
  month: number; // 1-12
  branchSales: Record<string, number>; // branchId -> sales amount
}

export interface AnnualSalesReportResponse {
  year: number;
  months: AnnualSalesReportMonth[];
}

export interface AnnualSalesReportQuery {
  year?: number;
  branchIds?: string[];
}

export const annualSalesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAnnualSalesReport: builder.query<
      AnnualSalesReportResponse,
      AnnualSalesReportQuery | void
    >({
      query: (params) => {
        const queryParams: Record<string, string> = {};
        if (params?.year) {
          queryParams.year = params.year.toString();
        }
        if (params?.branchIds && params.branchIds.length > 0) {
          queryParams.branchIds = params.branchIds.join(',');
        }
        return {
          url: "annual-sales-report",
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        };
      },
      transformResponse: (response: AnnualSalesReportResponse | { data: AnnualSalesReportResponse }) => {
        // Handle both direct response and wrapped response
        if ('data' in response) {
          return response.data;
        }
        return response;
      },
      providesTags: [{ type: "AnnualSalesReport", id: "GLOBAL" }],
    }),
  }),
});

export const { useGetAnnualSalesReportQuery } = annualSalesApiSlice;

