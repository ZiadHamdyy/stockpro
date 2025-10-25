import { apiSlice } from "../../ApiSlice";

export interface Store {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  description?: string;
  branchId: string;
  userId: string;
  branch?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoreDto {
  name: string;
  address?: string;
  phone?: string;
  description?: string;
  branchId: string;
  userId: string;
}

export interface UpdateStoreDto extends Partial<CreateStoreDto> {}

export const storeApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStores: builder.query<Store[], void>({
      query: () => "stores",
      transformResponse: (response: { data: Store[] }) => response.data,
      providesTags: ["Store"],
    }),
    getStore: builder.query<Store, string>({
      query: (id) => `stores/${id}`,
      transformResponse: (response: { data: Store }) => response.data,
      providesTags: (result, error, id) => [{ type: "Store", id }],
    }),
    createStore: builder.mutation<Store, CreateStoreDto>({
      query: (data) => ({
        url: "stores",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: Store }) => response.data,
      invalidatesTags: ["Store"],
    }),
    updateStore: builder.mutation<Store, { id: string; data: UpdateStoreDto }>({
      query: ({ id, data }) => ({
        url: `stores/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: Store }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "Store", id },
        "Store",
      ],
    }),
    deleteStore: builder.mutation<void, string>({
      query: (id) => ({
        url: `stores/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Store", id }, "Store"],
    }),
  }),
});

export const {
  useGetStoresQuery,
  useGetStoreQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
  useDeleteStoreMutation,
} = storeApi;
