import { apiSlice } from "../../ApiSlice";

// ==================== Income Statement Types ====================

export interface IncomeStatementData {
  totalSales: number;
  totalSalesReturns: number;
  netSales: number;
  beginningInventory: number;
  totalPurchases: number;
  totalPurchaseReturns: number;
  netPurchases: number;
  endingInventory: number;
  cogs: number;
  grossProfit: number;
  expensesByType: Record<string, number>;
  totalExpenses: number;
  netProfit: number;
}

export interface IncomeStatementQuery {
  startDate: string;
  endDate: string;
}

export const incomeStatementApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getIncomeStatement: builder.query<
      IncomeStatementData,
      IncomeStatementQuery
    >({
      query: ({ startDate, endDate }) => ({
        url: "income-statement",
        params: { startDate, endDate },
      }),
      transformResponse: (response: { data: IncomeStatementData }) =>
        response.data,
      providesTags: [{ type: "IncomeStatement", id: "GLOBAL" }],
    }),
  }),
});

export const { useGetIncomeStatementQuery } = incomeStatementApiSlice;
