import { apiSlice } from "../../ApiSlice";

export interface InventoryCountItem {
  id: string;
  systemStock: number;
  actualStock: number;
  difference: number;
  cost: number;
  item: {
    id: string;
    code: string;
    barcode?: string;
    name: string;
    purchasePrice: number;
    initialPurchasePrice: number;
    salePrice: number;
    stock: number;
    reorderLimit: number;
    type: 'STOCKED' | 'SERVICE';
    group: {
      id: string;
      code: number;
      name: string;
      description?: string;
    };
    unit: {
      id: string;
      code: number;
      name: string;
      description?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface InventoryCount {
  id: string;
  code: string;
  date: string;
  status: 'PENDING' | 'POSTED';
  notes?: string;
  totalVarianceValue: number;
  store: {
    id: string;
    code: number;
    name: string;
    address?: string;
    phone?: string;
    description?: string;
    branch?: {
      id: string;
      code: number;
      name: string;
      address?: string;
      phone?: string;
      description?: string;
    };
  };
  user: {
    id: string;
    code: number;
    email: string;
    name?: string;
  };
  branch?: {
    id: string;
    code: number;
    name: string;
    address?: string;
    phone?: string;
    description?: string;
  };
  items: InventoryCountItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryCountItemDto {
  itemId: string;
  systemStock: number;
  actualStock: number;
  difference: number;
  cost: number;
}

export interface CreateInventoryCountDto {
  storeId: string;
  userId: string;
  branchId?: string;
  date?: string;
  notes?: string;
  items: CreateInventoryCountItemDto[];
}

export interface UpdateInventoryCountDto extends Partial<CreateInventoryCountDto> {}

export const inventoryCountApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInventoryCounts: builder.query<InventoryCount[], void>({
      query: () => "inventory-counts",
      transformResponse: (response: { data: InventoryCount[] }) => response.data,
      providesTags: ["InventoryCount"],
    }),
    getInventoryCount: builder.query<InventoryCount, string>({
      query: (id) => `inventory-counts/${id}`,
      transformResponse: (response: { data: InventoryCount }) => response.data,
      providesTags: (result, error, id) => [{ type: "InventoryCount", id }],
    }),
    createInventoryCount: builder.mutation<
      InventoryCount,
      CreateInventoryCountDto
    >({
      query: (data) => ({
        url: "inventory-counts",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: InventoryCount }) => response.data,
      invalidatesTags: ["InventoryCount"],
    }),
    updateInventoryCount: builder.mutation<
      InventoryCount,
      { id: string; data: UpdateInventoryCountDto }
    >({
      query: ({ id, data }) => ({
        url: `inventory-counts/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: InventoryCount }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "InventoryCount", id },
        "InventoryCount",
      ],
    }),
    postInventoryCount: builder.mutation<InventoryCount, string>({
      query: (id) => ({
        url: `inventory-counts/${id}/post`,
        method: "POST",
      }),
      transformResponse: (response: { data: InventoryCount }) => response.data,
      invalidatesTags: (result, error, id) => [
        { type: "InventoryCount", id },
        "InventoryCount",
        "StoreReceiptVoucher",
        "StoreIssueVoucher",
        "Item",
      ],
    }),
    deleteInventoryCount: builder.mutation<void, string>({
      query: (id) => ({
        url: `inventory-counts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "InventoryCount", id },
        "InventoryCount",
      ],
    }),
  }),
});

export const {
  useGetInventoryCountsQuery,
  useGetInventoryCountQuery,
  useCreateInventoryCountMutation,
  useUpdateInventoryCountMutation,
  usePostInventoryCountMutation,
  useDeleteInventoryCountMutation,
} = inventoryCountApi;

