import { apiSlice } from "../../ApiSlice";
import { showApiErrorToast } from "../../../../utils/errorToast";

export interface PriceQuotationItem {
  id: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
  taxAmount?: number;
  total?: number;
}

export interface PriceQuotationTotals {
  subtotal: number;
  discount: number;
  tax: number;
  net: number;
}

export interface PriceQuotation {
  id: string;
  code: string;
  date: string;
  expiryDate?: string | null;
  status: string;
  notes?: string | null;
  items: PriceQuotationItem[];
  totals: PriceQuotationTotals;
  customerId?: string | null;
  customerName?: string | null;
  customer?: { id: string; name: string } | null;
  userId: string;
  user?: { id: string; name: string } | null;
  branchId?: string | null;
  branch?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePriceQuotationRequest {
  customerId?: string;
  customerName?: string;
  date?: string;
  expiryDate?: string;
  items: PriceQuotationItem[];
  totals: PriceQuotationTotals;
  notes?: string;
  status?: string;
}

export interface UpdatePriceQuotationRequest {
  customerId?: string | null;
  customerName?: string | null;
  date?: string;
  expiryDate?: string;
  items?: PriceQuotationItem[];
  totals?: PriceQuotationTotals;
  notes?: string | null;
  status?: string;
}

export const priceQuotationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPriceQuotations: builder.query<PriceQuotation[], string | void>({
      query: (search) => ({
        url: "price-quotations",
        params: search ? { search } : undefined,
      }),
      transformResponse: (response: { data: PriceQuotation[] }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "PriceQuotation" as const,
                id,
              })),
              { type: "PriceQuotation", id: "LIST" },
            ]
          : [{ type: "PriceQuotation", id: "LIST" }],
    }),
    getPriceQuotationById: builder.query<PriceQuotation, string>({
      query: (id) => `price-quotations/${id}`,
      transformResponse: (response: { data: PriceQuotation }) => response.data,
      providesTags: (result, error, id) => [{ type: "PriceQuotation", id }],
    }),
    createPriceQuotation: builder.mutation<
      PriceQuotation,
      CreatePriceQuotationRequest
    >({
      query: (data) => ({
        url: "price-quotations",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: PriceQuotation }) => response.data,
      invalidatesTags: (result) => [
        { type: "PriceQuotation", id: "LIST" },
        ...(result?.customerId
          ? [{ type: "Customer" as const, id: result.customerId }]
          : []),
      ],
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch ({ error }) {
          showApiErrorToast(error);
        }
      },
    }),
    updatePriceQuotation: builder.mutation<
      PriceQuotation,
      { id: string; data: UpdatePriceQuotationRequest }
    >({
      query: ({ id, data }) => ({
        url: `price-quotations/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: PriceQuotation }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "PriceQuotation", id },
        { type: "PriceQuotation", id: "LIST" },
        ...(result?.customerId
          ? [{ type: "Customer" as const, id: result.customerId }]
          : []),
      ],
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch ({ error }) {
          showApiErrorToast(error);
        }
      },
    }),
    deletePriceQuotation: builder.mutation<void, string>({
      query: (id) => ({
        url: `price-quotations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "PriceQuotation", id },
        { type: "PriceQuotation", id: "LIST" },
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
  useGetPriceQuotationsQuery,
  useGetPriceQuotationByIdQuery,
  useCreatePriceQuotationMutation,
  useUpdatePriceQuotationMutation,
  useDeletePriceQuotationMutation,
} = priceQuotationApiSlice;
