import { apiSlice } from "../ApiSlice";

// ==================== Receipt Voucher Types ====================

export interface ReceiptVoucher {
  id: string;
  code: string;
  date: string;
  entityType: string;
  entityName: string;
  amount: number;
  description?: string | null;
  paymentMethod: string;
  safeId?: string | null;
  bankId?: string | null;
  customerId?: string | null;
  supplierId?: string | null;
  currentAccountId?: string | null;
  receivableAccountId?: string | null;
  payableAccountId?: string | null;
  userId: string;
  branchId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReceiptVoucherRequest {
  date: string;
  entityType: string;
  amount: number;
  description?: string;
  paymentMethod: string;
  safeId?: string;
  bankId?: string;
  customerId?: string;
  supplierId?: string;
  currentAccountId?: string;
  receivableAccountId?: string;
  payableAccountId?: string;
  branchId?: string;
}

export interface UpdateReceiptVoucherRequest {
  date?: string;
  entityType?: string;
  amount?: number;
  description?: string;
  paymentMethod?: string;
  safeId?: string;
  bankId?: string;
  customerId?: string;
  supplierId?: string;
  currentAccountId?: string;
  receivableAccountId?: string;
  payableAccountId?: string;
  branchId?: string;
}

export const receiptVoucherApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReceiptVouchers: builder.query<ReceiptVoucher[], string | void>({
      query: (search) => ({
        url: "receipt-vouchers",
        params: search ? { search } : undefined,
      }),
      transformResponse: (response: { data: ReceiptVoucher[] }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "ReceiptVoucher" as const,
                id,
              })),
              { type: "ReceiptVoucher", id: "LIST" },
            ]
          : [{ type: "ReceiptVoucher", id: "LIST" }],
    }),
    getReceiptVoucherById: builder.query<ReceiptVoucher, string>({
      query: (id) => `receipt-vouchers/${id}`,
      transformResponse: (response: { data: ReceiptVoucher }) => response.data,
      providesTags: (result, error, id) => [{ type: "ReceiptVoucher", id }],
    }),
    createReceiptVoucher: builder.mutation<
      ReceiptVoucher,
      CreateReceiptVoucherRequest
    >({
      query: (data) => ({
        url: "receipt-vouchers",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: ReceiptVoucher }) => response.data,
      invalidatesTags: [
        { type: "ReceiptVoucher", id: "LIST" },
        "Safe",
        "Bank",
        "CurrentAccount",
        { type: "DashboardStats", id: "GLOBAL" },
        { type: "MonthlyStats", id: "GLOBAL" },
        { type: "IncomeStatement", id: "GLOBAL" },
        { type: "BalanceSheet", id: "GLOBAL" },
      ],
    }),
    updateReceiptVoucher: builder.mutation<
      ReceiptVoucher,
      { id: string; data: UpdateReceiptVoucherRequest }
    >({
      query: ({ id, data }) => ({
        url: `receipt-vouchers/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: ReceiptVoucher }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "ReceiptVoucher", id },
        { type: "ReceiptVoucher", id: "LIST" },
        "Safe",
        "Bank",
        "CurrentAccount",
        { type: "DashboardStats", id: "GLOBAL" },
        { type: "MonthlyStats", id: "GLOBAL" },
        { type: "IncomeStatement", id: "GLOBAL" },
        { type: "BalanceSheet", id: "GLOBAL" },
      ],
    }),
    deleteReceiptVoucher: builder.mutation<void, string>({
      query: (id) => ({
        url: `receipt-vouchers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "ReceiptVoucher", id },
        { type: "ReceiptVoucher", id: "LIST" },
        "Safe",
        "Bank",
        "CurrentAccount",
        { type: "DashboardStats", id: "GLOBAL" },
        { type: "MonthlyStats", id: "GLOBAL" },
        { type: "IncomeStatement", id: "GLOBAL" },
        { type: "BalanceSheet", id: "GLOBAL" },
      ],
    }),
  }),
});

export const {
  useGetReceiptVouchersQuery,
  useGetReceiptVoucherByIdQuery,
  useCreateReceiptVoucherMutation,
  useUpdateReceiptVoucherMutation,
  useDeleteReceiptVoucherMutation,
} = receiptVoucherApiSlice;
