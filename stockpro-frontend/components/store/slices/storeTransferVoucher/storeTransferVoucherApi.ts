import { apiSlice } from "../../ApiSlice";

export interface StoreTransferVoucherItem {
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

export interface StoreTransferVoucher {
  id: string;
  voucherNumber: string;
  date: string;
  notes?: string;
  totalAmount: number;
  fromStoreId: string;
  toStoreId: string;
  userId: string;
  fromStore?: {
    id: string;
    name: string;
    branch: {
      id: string;
      name: string;
    };
  };
  toStore?: {
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
  items: StoreTransferVoucherItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoreTransferVoucherDto {
  fromStoreId: string;
  toStoreId: string;
  userId: string;
  notes?: string;
  items: Omit<StoreTransferVoucherItem, "id">[];
}

export interface UpdateStoreTransferVoucherDto
  extends Partial<CreateStoreTransferVoucherDto> {}

export const storeTransferVoucherApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStoreTransferVouchers: builder.query<StoreTransferVoucher[], void>({
      query: () => "store-transfer-vouchers",
      transformResponse: (response: { data: StoreTransferVoucher[] }) =>
        response.data,
      providesTags: ["StoreTransferVoucher"],
    }),
    getStoreTransferVoucher: builder.query<StoreTransferVoucher, string>({
      query: (id) => `store-transfer-vouchers/${id}`,
      transformResponse: (response: { data: StoreTransferVoucher }) =>
        response.data,
      providesTags: (result, error, id) => [
        { type: "StoreTransferVoucher", id },
      ],
    }),
    createStoreTransferVoucher: builder.mutation<
      StoreTransferVoucher,
      CreateStoreTransferVoucherDto
    >({
      query: (data) => ({
        url: "store-transfer-vouchers",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: StoreTransferVoucher }) =>
        response.data,
      invalidatesTags: ["StoreTransferVoucher", "Item", "AuditLog"],
    }),
    updateStoreTransferVoucher: builder.mutation<
      StoreTransferVoucher,
      { id: string; data: UpdateStoreTransferVoucherDto }
    >({
      query: ({ id, data }) => ({
        url: `store-transfer-vouchers/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: StoreTransferVoucher }) =>
        response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "StoreTransferVoucher", id },
        "StoreTransferVoucher",
        "Item",
        "AuditLog",
      ],
    }),
    deleteStoreTransferVoucher: builder.mutation<void, string>({
      query: (id) => ({
        url: `store-transfer-vouchers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "StoreTransferVoucher", id },
        "StoreTransferVoucher",
        "Item",
        "AuditLog",
      ],
    }),
  }),
});

export const {
  useGetStoreTransferVouchersQuery,
  useGetStoreTransferVoucherQuery,
  useCreateStoreTransferVoucherMutation,
  useUpdateStoreTransferVoucherMutation,
  useDeleteStoreTransferVoucherMutation,
} = storeTransferVoucherApi;
