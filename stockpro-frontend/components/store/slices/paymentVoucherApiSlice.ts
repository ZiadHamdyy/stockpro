import { apiSlice } from "../ApiSlice";

// ==================== Payment Voucher Types ====================

export interface PaymentVoucher {
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
  expenseCodeId?: string | null;
  userId: string;
  branchId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentVoucherRequest {
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
  expenseCodeId?: string;
  branchId?: string;
}

export interface UpdatePaymentVoucherRequest {
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
  expenseCodeId?: string;
  branchId?: string;
}

export const paymentVoucherApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentVouchers: builder.query<PaymentVoucher[], string | void>({
      query: (search) => ({
        url: "payment-vouchers",
        params: search ? { search } : undefined,
      }),
      transformResponse: (response: { data: PaymentVoucher[] }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "PaymentVoucher" as const,
                id,
              })),
              { type: "PaymentVoucher", id: "LIST" },
            ]
          : [{ type: "PaymentVoucher", id: "LIST" }],
    }),
    getExpensePaymentVouchers: builder.query<PaymentVoucher[], void>({
      query: () => "payment-vouchers/expenses",
      transformResponse: (response: { data: PaymentVoucher[] }) =>
        response.data,
      providesTags: [{ type: "PaymentVoucher", id: "EXPENSE_LIST" }],
    }),
    getPaymentVoucherById: builder.query<PaymentVoucher, string>({
      query: (id) => `payment-vouchers/${id}`,
      transformResponse: (response: { data: PaymentVoucher }) => response.data,
      providesTags: (result, error, id) => [{ type: "PaymentVoucher", id }],
    }),
    createPaymentVoucher: builder.mutation<
      PaymentVoucher,
      CreatePaymentVoucherRequest
    >({
      query: (data) => ({
        url: "payment-vouchers",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: PaymentVoucher }) => response.data,
      invalidatesTags: [
        { type: "PaymentVoucher", id: "LIST" },
        { type: "PaymentVoucher", id: "EXPENSE_LIST" },
        "Safe",
        "Bank",
        "CurrentAccount",
        { type: "DashboardStats", id: "GLOBAL" },
        { type: "MonthlyStats", id: "GLOBAL" },
        { type: "IncomeStatement", id: "GLOBAL" },
        { type: "BalanceSheet", id: "GLOBAL" },
      ],
    }),
    updatePaymentVoucher: builder.mutation<
      PaymentVoucher,
      { id: string; data: UpdatePaymentVoucherRequest }
    >({
      query: ({ id, data }) => ({
        url: `payment-vouchers/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: PaymentVoucher }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "PaymentVoucher", id },
        { type: "PaymentVoucher", id: "LIST" },
        { type: "PaymentVoucher", id: "EXPENSE_LIST" },
        "Safe",
        "Bank",
        "CurrentAccount",
        { type: "DashboardStats", id: "GLOBAL" },
        { type: "MonthlyStats", id: "GLOBAL" },
        { type: "IncomeStatement", id: "GLOBAL" },
        { type: "BalanceSheet", id: "GLOBAL" },
      ],
    }),
    deletePaymentVoucher: builder.mutation<void, string>({
      query: (id) => ({
        url: `payment-vouchers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "PaymentVoucher", id },
        { type: "PaymentVoucher", id: "LIST" },
        { type: "PaymentVoucher", id: "EXPENSE_LIST" },
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
  useGetPaymentVouchersQuery,
  useGetExpensePaymentVouchersQuery,
  useGetPaymentVoucherByIdQuery,
  useCreatePaymentVoucherMutation,
  useUpdatePaymentVoucherMutation,
  useDeletePaymentVoucherMutation,
} = paymentVoucherApiSlice;
