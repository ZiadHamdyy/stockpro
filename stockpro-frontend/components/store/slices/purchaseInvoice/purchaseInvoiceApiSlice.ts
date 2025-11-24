import { apiSlice } from "../../ApiSlice";
import { showApiErrorToast } from "../../../../utils/errorToast";

export interface PurchaseInvoiceItem {
  id: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
  taxAmount?: number;
  total?: number;
}

export interface PurchaseInvoice {
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
  items: PurchaseInvoiceItem[];
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

export interface CreatePurchaseInvoiceRequest {
  supplierId?: string;
  date?: string;
  items: PurchaseInvoiceItem[];
  discount?: number;
  paymentMethod: "cash" | "credit";
  paymentTargetType?: "safe" | "bank";
  paymentTargetId?: string;
  notes?: string;
}

export interface UpdatePurchaseInvoiceRequest {
  supplierId?: string;
  date?: string;
  items?: PurchaseInvoiceItem[];
  discount?: number;
  paymentMethod?: "cash" | "credit";
  paymentTargetType?: "safe" | "bank";
  paymentTargetId?: string;
  notes?: string;
}

export const purchaseInvoiceApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPurchaseInvoices: builder.query<PurchaseInvoice[], void>({
      query: () => "/purchase-invoices",
      transformResponse: (response: { data: PurchaseInvoice[] }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "PurchaseInvoice" as const, id })),
              { type: "PurchaseInvoice", id: "LIST" },
            ]
          : [{ type: "PurchaseInvoice", id: "LIST" }],
    }),
    getPurchaseInvoiceById: builder.query<PurchaseInvoice, string>({
      query: (id) => `/purchase-invoices/${id}`,
      transformResponse: (response: { data: PurchaseInvoice }) => response.data,
      providesTags: (result, error, id) => [{ type: "PurchaseInvoice", id }],
    }),
    createPurchaseInvoice: builder.mutation<
      PurchaseInvoice,
      CreatePurchaseInvoiceRequest
    >({
      query: (data) => ({
        url: "/purchase-invoices",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: PurchaseInvoice }) => response.data,
      invalidatesTags: (result) => [
        { type: "PurchaseInvoice", id: "LIST" },
        "Item",
        "Safe",
        "Bank",
        "CurrentAccount",
        { type: "Supplier", id: "LIST" },
        ...(result?.supplierId ? [{ type: "Supplier" as const, id: result.supplierId }] : []),
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
    updatePurchaseInvoice: builder.mutation<
      PurchaseInvoice,
      { id: string; data: UpdatePurchaseInvoiceRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase-invoices/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: PurchaseInvoice }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "PurchaseInvoice", id },
        { type: "PurchaseInvoice", id: "LIST" },
        "Item",
        "Safe",
        "Bank",
        "CurrentAccount",
        { type: "Supplier", id: "LIST" },
        ...(result?.supplierId ? [{ type: "Supplier" as const, id: result.supplierId }] : []),
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
    deletePurchaseInvoice: builder.mutation<void, string>({
      query: (id) => ({
        url: `/purchase-invoices/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "PurchaseInvoice", id: "LIST" },
        "Item",
        "Safe",
        "Bank",
        "CurrentAccount",
        { type: "Supplier", id: "LIST" },
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
  useGetPurchaseInvoicesQuery,
  useGetPurchaseInvoiceByIdQuery,
  useCreatePurchaseInvoiceMutation,
  useUpdatePurchaseInvoiceMutation,
  useDeletePurchaseInvoiceMutation,
} = purchaseInvoiceApiSlice;
