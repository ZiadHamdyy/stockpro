import { apiSlice } from "../../ApiSlice";
import { showApiErrorToast } from "../../../../utils/errorToast";

export interface InvoiceItem {
  id: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
  taxAmount?: number;
  total?: number;
}

export interface SalesInvoice {
  id: string;
  code: string;
  date: string;
  customerId?: string;
  customer?: {
    id: string;
    name: string;
    code: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  net: number;
  paymentMethod: "cash" | "credit";
  paymentTargetType?: "safe" | "bank";
  paymentTargetId?: string;
  notes?: string;
  userId: string;
  user?: {
    id: string;
    name: string;
  };
  branchId?: string;
  branch?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalesInvoiceRequest {
  customerId?: string;
  date?: string;
  items: InvoiceItem[];
  discount?: number;
  paymentMethod: "cash" | "credit";
  paymentTargetType?: "safe" | "bank";
  paymentTargetId?: string;
  notes?: string;
}

export interface UpdateSalesInvoiceRequest {
  customerId?: string;
  date?: string;
  items?: InvoiceItem[];
  discount?: number;
  paymentMethod?: "cash" | "credit";
  paymentTargetType?: "safe" | "bank";
  paymentTargetId?: string;
  notes?: string;
}

export const salesInvoiceApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSalesInvoices: builder.query<SalesInvoice[], string | void>({
      query: (search) => ({
        url: "sales-invoices",
        params: search ? { search } : undefined,
      }),
      transformResponse: (response: { data: SalesInvoice[] }) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "SalesInvoice" as const,
                id,
              })),
              { type: "SalesInvoice", id: "LIST" },
            ]
          : [{ type: "SalesInvoice", id: "LIST" }],
    }),
    getSalesInvoiceById: builder.query<SalesInvoice, string>({
      query: (id) => `sales-invoices/${id}`,
      transformResponse: (response: { data: SalesInvoice }) => response.data,
      providesTags: (result, error, id) => [{ type: "SalesInvoice", id }],
    }),
    createSalesInvoice: builder.mutation<
      SalesInvoice,
      CreateSalesInvoiceRequest
    >({
      query: (data) => ({
        url: "sales-invoices",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: SalesInvoice }) => response.data,
      invalidatesTags: [
        { type: "SalesInvoice", id: "LIST" },
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
    updateSalesInvoice: builder.mutation<
      SalesInvoice,
      { id: string; data: UpdateSalesInvoiceRequest }
    >({
      query: ({ id, data }) => ({
        url: `sales-invoices/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: SalesInvoice }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "SalesInvoice", id },
        { type: "SalesInvoice", id: "LIST" },
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
    deleteSalesInvoice: builder.mutation<void, string>({
      query: (id) => ({
        url: `sales-invoices/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "SalesInvoice", id },
        { type: "SalesInvoice", id: "LIST" },
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
  useGetSalesInvoicesQuery,
  useGetSalesInvoiceByIdQuery,
  useCreateSalesInvoiceMutation,
  useUpdateSalesInvoiceMutation,
  useDeleteSalesInvoiceMutation,
} = salesInvoiceApiSlice;
