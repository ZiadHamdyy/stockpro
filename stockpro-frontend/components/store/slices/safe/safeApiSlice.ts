import { apiSlice } from "../../ApiSlice";
import type { Safe } from "../../../../types";

export interface CreateSafeRequest {
  name: string;
  branchId: string;
  openingBalance?: number;
}

export interface UpdateSafeRequest {
  name?: string;
  branchId?: string;
  openingBalance?: number;
}

export const safeApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSafes: builder.query<Safe[], string | void>({
      query: (search) => ({
        url: "safes",
        params: search ? { search } : undefined,
      }),
      transformResponse: (response: { data: Safe[] }) => response.data,
      providesTags: (result: Safe[]) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Safe" as const, id })),
              { type: "Safe", id: "LIST" },
            ]
          : [{ type: "Safe", id: "LIST" }],
    }),
    getSafeById: builder.query<Safe, string>({
      query: (id) => `safes/${id}`,
      transformResponse: (response: { data: Safe }) => response.data,
      providesTags: (result, error, id) => [{ type: "Safe", id }],
    }),
    createSafe: builder.mutation<Safe, CreateSafeRequest>({
      query: (data) => ({
        url: "safes",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: Safe }) => response.data,
      invalidatesTags: [{ type: "Safe", id: "LIST" }],
    }),
    updateSafe: builder.mutation<Safe, { id: string; data: UpdateSafeRequest }>(
      {
        query: ({ id, data }) => ({
          url: `safes/${id}`,
          method: "PATCH",
          body: data,
        }),
        transformResponse: (response: { data: Safe }) => response.data,
        invalidatesTags: (result, error, { id }) => [
          { type: "Safe", id },
          { type: "Safe", id: "LIST" },
        ],
      },
    ),
    deleteSafe: builder.mutation<void, string>({
      query: (id) => ({
        url: `safes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Safe", id },
        { type: "Safe", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetSafesQuery,
  useGetSafeByIdQuery,
  useCreateSafeMutation,
  useUpdateSafeMutation,
  useDeleteSafeMutation,
} = safeApiSlice;
