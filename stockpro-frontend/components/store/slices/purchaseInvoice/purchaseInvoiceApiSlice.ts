import { apiSlice } from '../../ApiSlice';

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
      query: () => '/purchase-invoices',
      transformResponse: (response: { data: PurchaseInvoice[] }) => response.data,
      providesTags: ['PurchaseInvoice'],
    }),
    getPurchaseInvoiceById: builder.query<PurchaseInvoice, string>({
      query: (id) => `/purchase-invoices/${id}`,
      transformResponse: (response: { data: PurchaseInvoice }) => response.data,
      providesTags: (result, error, id) => [{ type: 'PurchaseInvoice', id }],
    }),
    createPurchaseInvoice: builder.mutation<PurchaseInvoice, CreatePurchaseInvoiceRequest>({
      query: (data) => ({
        url: '/purchase-invoices',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { data: PurchaseInvoice }) => response.data,
      invalidatesTags: ['PurchaseInvoice'],
    }),
    updatePurchaseInvoice: builder.mutation<PurchaseInvoice, { id: string; data: UpdatePurchaseInvoiceRequest }>({
      query: ({ id, data }) => ({
        url: `/purchase-invoices/${id}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: { data: PurchaseInvoice }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: 'PurchaseInvoice', id },
        'PurchaseInvoice',
      ],
    }),
    deletePurchaseInvoice: builder.mutation<void, string>({
      query: (id) => ({
        url: `/purchase-invoices/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PurchaseInvoice'],
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
