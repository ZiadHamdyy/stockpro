import { apiSlice } from "../../ApiSlice";

export interface ReturnItem {
  id: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
  taxAmount?: number;
  total?: number;
}

export interface SalesReturn {
  id: string;
  code: string;
  date: string;
  customerId?: string;
  customer?: {
    id: string;
    name: string;
    code: string;
  };
  items: ReturnItem[];
  subtotal: number;
  discount: number;
  tax: number;
  net: number;
  paymentMethod: 'cash' | 'credit';
  paymentTargetType?: 'safe' | 'bank';
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

export interface CreateSalesReturnRequest {
  customerId?: string;
  date?: string;
  items: ReturnItem[];
  discount?: number;
  paymentMethod: 'cash' | 'credit';
  paymentTargetType?: 'safe' | 'bank';
  paymentTargetId?: string;
  notes?: string;
}

export interface UpdateSalesReturnRequest {
  customerId?: string;
  date?: string;
  items?: ReturnItem[];
  discount?: number;
  paymentMethod?: 'cash' | 'credit';
  paymentTargetType?: 'safe' | 'bank';
  paymentTargetId?: string;
  notes?: string;
}

export const salesReturnApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSalesReturns: builder.query<SalesReturn[], string | void>({
      query: (search) => ({
        url: "sales-returns",
        params: search ? { search } : undefined,
      }),
      transformResponse: (response: { data: SalesReturn[] }) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "SalesReturn" as const, id })),
              { type: "SalesReturn", id: "LIST" },
            ]
          : [{ type: "SalesReturn", id: "LIST" }],
    }),
    getSalesReturnById: builder.query<SalesReturn, string>({
      query: (id) => `sales-returns/${id}`,
      transformResponse: (response: { data: SalesReturn }) => response.data,
      providesTags: (result, error, id) => [{ type: "SalesReturn", id }],
    }),
    createSalesReturn: builder.mutation<SalesReturn, CreateSalesReturnRequest>({
      query: (data) => ({
        url: "sales-returns",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: SalesReturn }) => response.data,
      invalidatesTags: [{ type: "SalesReturn", id: "LIST" }],
    }),
    updateSalesReturn: builder.mutation<
      SalesReturn,
      { id: string; data: UpdateSalesReturnRequest }
    >({
      query: ({ id, data }) => ({
        url: `sales-returns/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: SalesReturn }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "SalesReturn", id },
        { type: "SalesReturn", id: "LIST" },
      ],
    }),
    deleteSalesReturn: builder.mutation<void, string>({
      query: (id) => ({
        url: `sales-returns/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "SalesReturn", id },
        { type: "SalesReturn", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetSalesReturnsQuery,
  useGetSalesReturnByIdQuery,
  useCreateSalesReturnMutation,
  useUpdateSalesReturnMutation,
  useDeleteSalesReturnMutation,
} = salesReturnApiSlice;

