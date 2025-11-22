import { apiSlice } from "../../ApiSlice";

export interface Bank {
  id: string;
  code: string;
  name: string;
  accountNumber: string;
  iban: string;
  openingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBankRequest {
  name: string;
  accountNumber: string;
  iban: string;
  openingBalance?: number;
}

export interface UpdateBankRequest {
  name?: string;
  accountNumber?: string;
  iban?: string;
  openingBalance?: number;
}

export const bankApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBanks: builder.query<Bank[], string | void>({
      query: (search) => ({
        url: "banks",
        params: search ? { search } : undefined,
      }),
      transformResponse: (response: { data: Bank[] }) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Bank" as const, id })),
              { type: "Bank", id: "LIST" },
            ]
          : [{ type: "Bank", id: "LIST" }],
    }),
    getBankById: builder.query<Bank, string>({
      query: (id) => `banks/${id}`,
      transformResponse: (response: { data: Bank }) => response.data,
      providesTags: (result, error, id) => [{ type: "Bank", id }],
    }),
    createBank: builder.mutation<Bank, CreateBankRequest>({
      query: (data) => ({
        url: "banks",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: Bank }) => response.data,
      invalidatesTags: [
        { type: "Bank", id: "LIST" },
        "SalesInvoice",
        "SalesReturn",
        "PurchaseInvoice",
        "PurchaseReturn",
        "PaymentVoucher",
        "ReceiptVoucher",
        "InternalTransfer",
      ],
    }),
    updateBank: builder.mutation<Bank, { id: string; data: UpdateBankRequest }>(
      {
        query: ({ id, data }) => ({
          url: `banks/${id}`,
          method: "PATCH",
          body: data,
        }),
        transformResponse: (response: { data: Bank }) => response.data,
        invalidatesTags: (result, error, { id }) => [
          { type: "Bank", id },
          { type: "Bank", id: "LIST" },
          "SalesInvoice",
          "SalesReturn",
          "PurchaseInvoice",
          "PurchaseReturn",
          "PaymentVoucher",
          "ReceiptVoucher",
          "InternalTransfer",
        ],
      },
    ),
    deleteBank: builder.mutation<void, string>({
      query: (id) => ({
        url: `banks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Bank", id },
        { type: "Bank", id: "LIST" },
        "SalesInvoice",
        "SalesReturn",
        "PurchaseInvoice",
        "PurchaseReturn",
        "PaymentVoucher",
        "ReceiptVoucher",
        "InternalTransfer",
      ],
    }),
  }),
});

export const {
  useGetBanksQuery,
  useGetBankByIdQuery,
  useCreateBankMutation,
  useUpdateBankMutation,
  useDeleteBankMutation,
} = bankApiSlice;
