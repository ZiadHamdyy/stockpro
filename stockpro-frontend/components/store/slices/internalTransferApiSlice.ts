import { apiSlice } from "../ApiSlice";

// ==================== Internal Transfer Types ====================

export interface InternalTransfer {
  id: string;
  code: string;
  date: string;
  amount: number;
  description?: string | null;
  fromType: string;
  fromSafeId?: string | null;
  fromBankId?: string | null;
  toType: string;
  toSafeId?: string | null;
  toBankId?: string | null;
  userId: string;
  branchId?: string | null;
  fromSafe?: {
    id: string;
    name: string;
  } | null;
  fromBank?: {
    id: string;
    name: string;
  } | null;
  toSafe?: {
    id: string;
    name: string;
  } | null;
  toBank?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInternalTransferRequest {
  date: string;
  fromType: string;
  fromSafeId?: string;
  fromBankId?: string;
  toType: string;
  toSafeId?: string;
  toBankId?: string;
  amount: number;
  description?: string;
  branchId?: string;
}

export interface UpdateInternalTransferRequest {
  date?: string;
  fromType?: string;
  fromSafeId?: string;
  fromBankId?: string;
  toType?: string;
  toSafeId?: string;
  toBankId?: string;
  amount?: number;
  description?: string;
  branchId?: string;
}

export const internalTransferApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInternalTransfers: builder.query<InternalTransfer[], string | void>({
      query: (search) => ({
        url: "internal-transfers",
        params: search ? { search } : undefined,
      }),
      transformResponse: (response: { data: InternalTransfer[] }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "InternalTransfer" as const,
                id,
              })),
              { type: "InternalTransfer", id: "LIST" },
            ]
          : [{ type: "InternalTransfer", id: "LIST" }],
    }),
    getInternalTransferById: builder.query<InternalTransfer, string>({
      query: (id) => `internal-transfers/${id}`,
      transformResponse: (response: { data: InternalTransfer }) => response.data,
      providesTags: (result, error, id) => [{ type: "InternalTransfer", id }],
    }),
    createInternalTransfer: builder.mutation<
      InternalTransfer,
      CreateInternalTransferRequest
    >({
      query: (data) => ({
        url: "internal-transfers",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: InternalTransfer }) => response.data,
      invalidatesTags: [
        { type: "InternalTransfer", id: "LIST" },
        "Safe",
        "Bank",
      ],
    }),
    updateInternalTransfer: builder.mutation<
      InternalTransfer,
      { id: string; data: UpdateInternalTransferRequest }
    >({
      query: ({ id, data }) => ({
        url: `internal-transfers/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: InternalTransfer }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "InternalTransfer", id },
        { type: "InternalTransfer", id: "LIST" },
        "Safe",
        "Bank",
      ],
    }),
    deleteInternalTransfer: builder.mutation<void, string>({
      query: (id) => ({
        url: `internal-transfers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "InternalTransfer", id },
        { type: "InternalTransfer", id: "LIST" },
        "Safe",
        "Bank",
      ],
    }),
  }),
});

export const {
  useGetInternalTransfersQuery,
  useGetInternalTransferByIdQuery,
  useCreateInternalTransferMutation,
  useUpdateInternalTransferMutation,
  useDeleteInternalTransferMutation,
} = internalTransferApiSlice;

