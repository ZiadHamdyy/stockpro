import { apiSlice } from "../../ApiSlice";
import { showApiErrorToast } from "../../../../utils/errorToast";

export interface PurchaseReturnItem {
  id: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
  taxAmount?: number;
  total?: number;
}

export interface PurchaseReturn {
  id: string;
  code: string;
  date: string;
  supplierId?: string;
  supplier?: {
    id: string;
    code: string;
    name: string;
    commercialReg: string;
    taxNumber: string;
    nationalAddress: string;
    phone: string;
    openingBalance: number;
  };
  items: PurchaseReturnItem[];
  subtotal: number;
  discount: number;
  tax: number;
  net: number;
  paymentMethod: "cash" | "credit";
  paymentTargetType?: "safe" | "bank";
  paymentTargetId?: string;
  safeId?: string;
  safe?: {
    id: string;
    name: string;
  } | null;
  bankId?: string;
  bank?: {
    id: string;
    name: string;
  } | null;
  notes?: string;
  userId: string;
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  };
  branchId?: string;
  branch?: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseReturnRequest {
  supplierId?: string;
  date?: string;
  items: PurchaseReturnItem[];
  discount?: number;
  paymentMethod: "cash" | "credit";
  paymentTargetType?: "safe" | "bank";
  paymentTargetId?: string;
  notes?: string;
}

export interface UpdatePurchaseReturnRequest {
  supplierId?: string;
  date?: string;
  items?: PurchaseReturnItem[];
  discount?: number;
  paymentMethod?: "cash" | "credit";
  paymentTargetType?: "safe" | "bank";
  paymentTargetId?: string;
  notes?: string;
}

export const purchaseReturnApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPurchaseReturns: builder.query<PurchaseReturn[], void>({
      query: () => "/purchase-returns",
      transformResponse: (response: { data: PurchaseReturn[] }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "PurchaseReturn" as const, id })),
              { type: "PurchaseReturn", id: "LIST" },
            ]
          : [{ type: "PurchaseReturn", id: "LIST" }],
    }),
    getPurchaseReturnById: builder.query<PurchaseReturn, string>({
      query: (id) => `/purchase-returns/${id}`,
      transformResponse: (response: { data: PurchaseReturn }) => response.data,
      providesTags: (result, error, id) => [{ type: "PurchaseReturn", id }],
    }),
    createPurchaseReturn: builder.mutation<
      PurchaseReturn,
      CreatePurchaseReturnRequest
    >({
      query: (data) => ({
        url: "/purchase-returns",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: PurchaseReturn }) => response.data,
      invalidatesTags: [
        { type: "PurchaseReturn", id: "LIST" },
        "Item",
        "Safe",
        "Bank",
        "CurrentAccount",
        { type: "DashboardStats", id: "GLOBAL" },
        { type: "MonthlyStats", id: "GLOBAL" },
        { type: "SalesByItemGroup", id: "GLOBAL" },
        { type: "IncomeStatement", id: "GLOBAL" },
        { type: "BalanceSheet", id: "GLOBAL" },
      ],
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch ({ error }) {
          showApiErrorToast(error);
        }
      },
    }),
    updatePurchaseReturn: builder.mutation<
      PurchaseReturn,
      { id: string; data: UpdatePurchaseReturnRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase-returns/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: PurchaseReturn }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "PurchaseReturn", id },
        { type: "PurchaseReturn", id: "LIST" },
        "Item",
        "Safe",
        "Bank",
        "CurrentAccount",
        { type: "DashboardStats", id: "GLOBAL" },
        { type: "MonthlyStats", id: "GLOBAL" },
        { type: "SalesByItemGroup", id: "GLOBAL" },
        { type: "IncomeStatement", id: "GLOBAL" },
        { type: "BalanceSheet", id: "GLOBAL" },
      ],
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch ({ error }) {
          showApiErrorToast(error);
        }
      },
    }),
    deletePurchaseReturn: builder.mutation<void, string>({
      query: (id) => ({
        url: `/purchase-returns/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "PurchaseReturn", id: "LIST" },
        "Item",
        "Safe",
        "Bank",
        "CurrentAccount",
        { type: "DashboardStats", id: "GLOBAL" },
        { type: "MonthlyStats", id: "GLOBAL" },
        { type: "SalesByItemGroup", id: "GLOBAL" },
        { type: "IncomeStatement", id: "GLOBAL" },
        { type: "BalanceSheet", id: "GLOBAL" },
      ],
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch ({ error }) {
          showApiErrorToast(error);
        }
      },
    }),
  }),
});

export const {
  useGetPurchaseReturnsQuery,
  useGetPurchaseReturnByIdQuery,
  useCreatePurchaseReturnMutation,
  useUpdatePurchaseReturnMutation,
  useDeletePurchaseReturnMutation,
} = purchaseReturnApiSlice;
