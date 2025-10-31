import { apiSlice } from "../../ApiSlice";

export interface BalanceSheetData {
  cashInSafes: number;
  cashInBanks: number;
  receivables: number;
  inventory: number;
  totalAssets: number;
  payables: number;
  vatPayable: number;
  totalLiabilities: number;
  capital: number;
  partnersBalance: number;
  retainedEarnings: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
}

export interface BalanceSheetQuery {
  endDate: string;
}

export const balanceSheetApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBalanceSheet: builder.query<BalanceSheetData, BalanceSheetQuery>({
      query: ({ endDate }) => ({
        url: "balance-sheet",
        params: { endDate },
      }),
      transformResponse: (response: { data: BalanceSheetData }) =>
        response.data,
      providesTags: [{ type: "BalanceSheet", id: "GLOBAL" }],
    }),
  }),
});

export const { useGetBalanceSheetQuery } = balanceSheetApiSlice;
