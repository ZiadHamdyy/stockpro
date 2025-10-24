import { apiSlice } from "../../ApiSlice";

export interface StoreIssueVoucherItem {
  id?: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  item?: {
    id: string;
    code: string;
    name: string;
    unit: {
      name: string;
    };
    group: {
      name: string;
    };
  };
}

export interface StoreIssueVoucher {
  id: string;
  voucherNumber: string;
  date: string;
  notes?: string;
  totalAmount: number;
  storeId: string;
  userId: string;
  store?: {
    id: string;
    name: string;
    branch: {
      id: string;
      name: string;
    };
  };
  user?: {
    id: string;
    name: string;
  };
  items: StoreIssueVoucherItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoreIssueVoucherDto {
  storeId: string;
  userId: string;
  notes?: string;
  items: Omit<StoreIssueVoucherItem, 'id'>[];
}

export interface UpdateStoreIssueVoucherDto extends Partial<CreateStoreIssueVoucherDto> {}

export const storeIssueVoucherApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStoreIssueVouchers: builder.query<StoreIssueVoucher[], void>({
      query: () => "store-issue-vouchers",
      transformResponse: (response: { data: StoreIssueVoucher[] }) => response.data,
      providesTags: ["StoreIssueVoucher"],
    }),
    getStoreIssueVoucher: builder.query<StoreIssueVoucher, string>({
      query: (id) => `store-issue-vouchers/${id}`,
      transformResponse: (response: { data: StoreIssueVoucher }) => response.data,
      providesTags: (result, error, id) => [{ type: "StoreIssueVoucher", id }],
    }),
    createStoreIssueVoucher: builder.mutation<StoreIssueVoucher, CreateStoreIssueVoucherDto>({
      query: (data) => ({
        url: "store-issue-vouchers",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: StoreIssueVoucher }) => response.data,
      invalidatesTags: ["StoreIssueVoucher"],
    }),
    updateStoreIssueVoucher: builder.mutation<StoreIssueVoucher, { id: string; data: UpdateStoreIssueVoucherDto }>({
      query: ({ id, data }) => ({
        url: `store-issue-vouchers/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: StoreIssueVoucher }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "StoreIssueVoucher", id },
        "StoreIssueVoucher",
      ],
    }),
    deleteStoreIssueVoucher: builder.mutation<void, string>({
      query: (id) => ({
        url: `store-issue-vouchers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "StoreIssueVoucher", id },
        "StoreIssueVoucher",
      ],
    }),
  }),
});

export const {
  useGetStoreIssueVouchersQuery,
  useGetStoreIssueVoucherQuery,
  useCreateStoreIssueVoucherMutation,
  useUpdateStoreIssueVoucherMutation,
  useDeleteStoreIssueVoucherMutation,
} = storeIssueVoucherApi;

