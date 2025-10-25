import { apiSlice } from "../../ApiSlice";

export interface StoreReceiptVoucherItem {
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

export interface StoreReceiptVoucher {
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
  items: StoreReceiptVoucherItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoreReceiptVoucherDto {
  storeId: string;
  userId: string;
  notes?: string;
  items: Omit<StoreReceiptVoucherItem, "id">[];
}

export interface UpdateStoreReceiptVoucherDto
  extends Partial<CreateStoreReceiptVoucherDto> {}

export const storeReceiptVoucherApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStoreReceiptVouchers: builder.query<StoreReceiptVoucher[], void>({
      query: () => "store-receipt-vouchers",
      transformResponse: (response: { data: StoreReceiptVoucher[] }) =>
        response.data,
      providesTags: ["StoreReceiptVoucher"],
    }),
    getStoreReceiptVoucher: builder.query<StoreReceiptVoucher, string>({
      query: (id) => `store-receipt-vouchers/${id}`,
      transformResponse: (response: { data: StoreReceiptVoucher }) =>
        response.data,
      providesTags: (result, error, id) => [
        { type: "StoreReceiptVoucher", id },
      ],
    }),
    createStoreReceiptVoucher: builder.mutation<
      StoreReceiptVoucher,
      CreateStoreReceiptVoucherDto
    >({
      query: (data) => ({
        url: "store-receipt-vouchers",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: StoreReceiptVoucher }) =>
        response.data,
      invalidatesTags: ["StoreReceiptVoucher"],
    }),
    updateStoreReceiptVoucher: builder.mutation<
      StoreReceiptVoucher,
      { id: string; data: UpdateStoreReceiptVoucherDto }
    >({
      query: ({ id, data }) => ({
        url: `store-receipt-vouchers/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: StoreReceiptVoucher }) =>
        response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "StoreReceiptVoucher", id },
        "StoreReceiptVoucher",
      ],
    }),
    deleteStoreReceiptVoucher: builder.mutation<void, string>({
      query: (id) => ({
        url: `store-receipt-vouchers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "StoreReceiptVoucher", id },
        "StoreReceiptVoucher",
      ],
    }),
  }),
});

export const {
  useGetStoreReceiptVouchersQuery,
  useGetStoreReceiptVoucherQuery,
  useCreateStoreReceiptVoucherMutation,
  useUpdateStoreReceiptVoucherMutation,
  useDeleteStoreReceiptVoucherMutation,
} = storeReceiptVoucherApi;
