import { apiSlice } from "../../ApiSlice";

export interface FiscalYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "OPEN" | "CLOSED";
  retainedEarnings: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFiscalYearRequest {
  name: string;
  startDate: string;
  endDate: string;
}

export interface UpdateFiscalYearRequest {
  name?: string;
  startDate?: string;
  endDate?: string;
}


export const fiscalYearApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFiscalYears: builder.query<FiscalYear[], void>({
      query: () => "fiscal-years",
      transformResponse: (response: { data: FiscalYear[] }) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "FiscalYear" as const, id })),
              { type: "FiscalYear", id: "LIST" },
            ]
          : [{ type: "FiscalYear", id: "LIST" }],
    }),
    getFiscalYearById: builder.query<FiscalYear, string>({
      query: (id) => `fiscal-years/${id}`,
      transformResponse: (response: { data: FiscalYear }) => response.data,
      providesTags: (result, error, id) => [{ type: "FiscalYear", id }],
    }),
    createFiscalYear: builder.mutation<FiscalYear, CreateFiscalYearRequest>({
      query: (data) => ({
        url: "fiscal-years",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: FiscalYear }) => response.data,
      invalidatesTags: [{ type: "FiscalYear", id: "LIST" }],
    }),
    updateFiscalYear: builder.mutation<
      FiscalYear,
      { id: string; data: UpdateFiscalYearRequest }
    >({
      query: ({ id, data }) => ({
        url: `fiscal-years/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: FiscalYear }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "FiscalYear", id },
        { type: "FiscalYear", id: "LIST" },
      ],
    }),
    closeFiscalYear: builder.mutation<FiscalYear, string>({
      query: (id) => ({
        url: `fiscal-years/${id}/close`,
        method: "POST",
      }),
      transformResponse: (response: { data: FiscalYear }) => response.data,
      invalidatesTags: (result, error, id) => [
        { type: "FiscalYear", id },
        { type: "FiscalYear", id: "LIST" },
        "BalanceSheet",
        "IncomeStatement",
      ],
    }),
    reopenFiscalYear: builder.mutation<FiscalYear, string>({
      query: (id) => ({
        url: `fiscal-years/${id}/reopen`,
        method: "POST",
      }),
      transformResponse: (response: { data: FiscalYear }) => response.data,
      invalidatesTags: (result, error, id) => [
        { type: "FiscalYear", id },
        { type: "FiscalYear", id: "LIST" },
        "BalanceSheet",
        "IncomeStatement",
      ],
    }),
  }),
});

export const {
  useGetFiscalYearsQuery,
  useGetFiscalYearByIdQuery,
  useCreateFiscalYearMutation,
  useUpdateFiscalYearMutation,
  useCloseFiscalYearMutation,
  useReopenFiscalYearMutation,
} = fiscalYearApiSlice;

