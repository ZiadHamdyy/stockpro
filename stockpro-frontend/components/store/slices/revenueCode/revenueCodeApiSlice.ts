import { apiSlice } from "../../ApiSlice";
import { showApiErrorToast } from "../../../../utils/errorToast";

// ==================== Revenue Code Types ====================

export interface RevenueCode {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRevenueCodeRequest {
  name: string;
}

export interface UpdateRevenueCodeRequest {
  name?: string;
}

export const revenueCodeApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRevenueCodes: builder.query<RevenueCode[], string | void>({
      query: (search) => ({
        url: "revenue-codes",
        params: search ? { search } : undefined,
      }),
      transformResponse: (response: { data: RevenueCode[] }) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "RevenueCode" as const, id })),
              { type: "RevenueCode", id: "LIST" },
            ]
          : [{ type: "RevenueCode", id: "LIST" }],
    }),
    getRevenueCodeById: builder.query<RevenueCode, string>({
      query: (id) => `revenue-codes/${id}`,
      transformResponse: (response: { data: RevenueCode }) => response.data,
      providesTags: (result, error, id) => [{ type: "RevenueCode", id }],
    }),
    createRevenueCode: builder.mutation<
      RevenueCode,
      CreateRevenueCodeRequest
    >({
      query: (data) => ({
        url: "revenue-codes",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: RevenueCode }) => response.data,
      invalidatesTags: [{ type: "RevenueCode", id: "LIST" }],
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch ({ error }) {
          showApiErrorToast(error);
        }
      },
    }),
    updateRevenueCode: builder.mutation<
      RevenueCode,
      { id: string; data: UpdateRevenueCodeRequest }
    >({
      query: ({ id, data }) => ({
        url: `revenue-codes/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: RevenueCode }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "RevenueCode", id },
        { type: "RevenueCode", id: "LIST" },
      ],
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch ({ error }) {
          showApiErrorToast(error);
        }
      },
    }),
    deleteRevenueCode: builder.mutation<void, string>({
      query: (id) => ({
        url: `revenue-codes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "RevenueCode", id },
        { type: "RevenueCode", id: "LIST" },
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
  useGetRevenueCodesQuery,
  useGetRevenueCodeByIdQuery,
  useCreateRevenueCodeMutation,
  useUpdateRevenueCodeMutation,
  useDeleteRevenueCodeMutation,
} = revenueCodeApiSlice;
