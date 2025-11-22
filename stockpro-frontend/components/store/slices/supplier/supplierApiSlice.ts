import { apiSlice } from "../../ApiSlice";

export interface Supplier {
  id: string;
  code: string;
  name: string;
  commercialReg: string;
  taxNumber: string;
  nationalAddress: string;
  phone: string;
  openingBalance: number;
  currentBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  commercialReg: string;
  taxNumber: string;
  nationalAddress: string;
  phone: string;
  openingBalance?: number;
}

export interface UpdateSupplierRequest {
  name?: string;
  commercialReg?: string;
  taxNumber?: string;
  nationalAddress?: string;
  phone?: string;
  openingBalance?: number;
}

export const supplierApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<Supplier[], string | void>({
      query: (search) => ({
        url: "suppliers",
        params: search ? { search } : undefined,
      }),
      transformResponse: (response: { data: Supplier[] }) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Supplier" as const, id })),
              { type: "Supplier", id: "LIST" },
            ]
          : [{ type: "Supplier", id: "LIST" }],
    }),
    getSupplierById: builder.query<Supplier, string>({
      query: (id) => `suppliers/${id}`,
      transformResponse: (response: { data: Supplier }) => response.data,
      providesTags: (result, error, id) => [{ type: "Supplier", id }],
    }),
    createSupplier: builder.mutation<Supplier, CreateSupplierRequest>({
      query: (data) => ({
        url: "suppliers",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: Supplier }) => response.data,
      invalidatesTags: [
        { type: "Supplier", id: "LIST" },
        "PurchaseInvoice",
        "PurchaseReturn",
        "PaymentVoucher",
        "ReceiptVoucher",
      ],
    }),
    updateSupplier: builder.mutation<
      Supplier,
      { id: string; data: UpdateSupplierRequest }
    >({
      query: ({ id, data }) => ({
        url: `suppliers/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: Supplier }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "Supplier", id },
        { type: "Supplier", id: "LIST" },
        "PurchaseInvoice",
        "PurchaseReturn",
        "PaymentVoucher",
        "ReceiptVoucher",
      ],
    }),
    deleteSupplier: builder.mutation<void, string>({
      query: (id) => ({
        url: `suppliers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Supplier", id },
        { type: "Supplier", id: "LIST" },
        "PurchaseInvoice",
        "PurchaseReturn",
        "PaymentVoucher",
        "ReceiptVoucher",
      ],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useGetSupplierByIdQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} = supplierApiSlice;
