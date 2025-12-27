import { apiSlice } from "../../ApiSlice";

export interface TrialBalanceEntry {
  id: string;
  accountCode: string;
  accountName: string;
  category: 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Expenses';
  openingBalanceDebit: number;
  openingBalanceCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingBalanceDebit: number;
  closingBalanceCredit: number;
}

export interface AuditTrialData {
  entries: TrialBalanceEntry[];
  currency: string;
}

export interface AuditTrialQuery {
  startDate: string;
  endDate: string;
}

export const auditTrialApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAuditTrial: builder.query<AuditTrialData, AuditTrialQuery>({
      query: ({ startDate, endDate }) => ({
        url: "audit-trial",
        params: { startDate, endDate },
      }),
      transformResponse: (response: { data: AuditTrialData }) =>
        response.data,
      providesTags: [{ type: "AuditTrial", id: "GLOBAL" }],
    }),
  }),
});

export const { useGetAuditTrialQuery } = auditTrialApiSlice;

