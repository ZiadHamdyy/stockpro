import { apiSlice } from "../../ApiSlice";

export interface DashboardStats {
  totalSales: number;
  totalReturns: number;
  netSales: number;
  totalPurchases: number;
  totalItems: number;
  totalCustomers: number;
}

export interface MonthlyStats {
  months: Array<{
    month: number;
    netSales: number;
    netPurchases: number;
  }>;
}

export interface SalesByItemGroup {
  itemGroups: Array<{
    groupId: string;
    groupName: string;
    totalSales: number;
    percentage: number;
  }>;
}

export const dashboardApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => "dashboard/stats",
      transformResponse: (response: { data: DashboardStats }) => response.data,
    }),
    getMonthlyStats: builder.query<MonthlyStats, void>({
      query: () => "dashboard/monthly-stats",
      transformResponse: (response: { data: MonthlyStats }) => response.data,
    }),
    getSalesByItemGroup: builder.query<SalesByItemGroup, void>({
      query: () => "dashboard/sales-by-item-group",
      transformResponse: (response: { data: SalesByItemGroup }) => response.data,
    }),
  }),
});

export const { 
  useGetDashboardStatsQuery, 
  useGetMonthlyStatsQuery,
  useGetSalesByItemGroupQuery 
} = dashboardApiSlice;

