import { apiSlice } from "../../ApiSlice";

export interface ItemGroup {
  id: string;
  code: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
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
  group: ItemGroup;
  unit: Unit;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemGroupRequest {
  name: string;
  description?: string;
}

export interface UpdateItemGroupRequest {
  name?: string;
  description?: string;
}

export interface CreateUnitRequest {
  name: string;
  description?: string;
}

export interface UpdateUnitRequest {
  name?: string;
  description?: string;
}

export interface CreateItemRequest {
  code: string;
  barcode?: string;
  name: string;
  purchasePrice: number;
  salePrice: number;
  stock?: number;
  reorderLimit?: number;
  groupId: string;
  unitId: string;
  type?: 'STOCKED' | 'SERVICE';
}

export interface UpdateItemRequest {
  code?: string;
  barcode?: string;
  name?: string;
  purchasePrice?: number;
  salePrice?: number;
  stock?: number;
  reorderLimit?: number;
  groupId?: string;
  unitId?: string;
  type?: 'STOCKED' | 'SERVICE';
}

export interface ImportItemsSummary {
  totalRows: number;
  importedCount: number;
  failedCount: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
}

export const itemsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Item Groups
    getItemGroups: builder.query({
      query: () => "item-groups",
      transformResponse: (response: any) => response.data || [],
      providesTags: ["ItemGroup"],
    }),
    createItemGroup: builder.mutation({
      query: (data) => ({
        url: "item-groups",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ItemGroup", "Item"],
    }),
    updateItemGroup: builder.mutation({
      query: ({ id, data }) => ({
        url: `item-groups/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["ItemGroup", "Item"],
    }),
    deleteItemGroup: builder.mutation({
      query: (id) => ({
        url: `item-groups/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ItemGroup", "Item"],
    }),

    // Units
    getUnits: builder.query({
      query: () => "units",
      transformResponse: (response: any) => response.data || [],
      providesTags: ["Unit"],
    }),
    createUnit: builder.mutation({
      query: (data) => ({
        url: "units",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Unit", "Item"],
    }),
    updateUnit: builder.mutation({
      query: ({ id, data }) => ({
        url: `units/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Unit", "Item"],
    }),
    deleteUnit: builder.mutation({
      query: (id) => ({
        url: `units/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Unit", "Item"],
    }),

    // Items
    getItems: builder.query({
      query: (params?: { storeId?: string }) => {
        const queryParams = new URLSearchParams();
        if (params?.storeId) {
          queryParams.append('storeId', params.storeId);
        }
        const queryString = queryParams.toString();
        return `items${queryString ? `?${queryString}` : ''}`;
      },
      transformResponse: (response: any) => response.data || [],
      providesTags: ["Item"],
    }),
    getItemById: builder.query({
      query: (id) => `items/${id}`,
    }),
    getItemByCode: builder.query({
      query: (code) => `items/code/${code}`,
    }),
    createItem: builder.mutation({
      query: (data) => ({
        url: "items",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [
        "Item",
        "StoreReceiptVoucher",
        "StoreIssueVoucher",
        "StoreTransferVoucher",
        "ItemGroup",
        "Unit",
      ],
    }),
    updateItem: builder.mutation({
      query: ({ id, data }) => ({
        url: `items/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [
        "Item",
        "StoreReceiptVoucher",
        "StoreIssueVoucher",
        "StoreTransferVoucher",
        "ItemGroup",
        "Unit",
      ],
    }),
    deleteItem: builder.mutation({
      query: (id) => ({
        url: `items/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        "Item",
        "StoreReceiptVoucher",
        "StoreIssueVoucher",
        "StoreTransferVoucher",
        "ItemGroup",
        "Unit",
      ],
    }),
    importItems: builder.mutation<ImportItemsSummary, FormData>({
      query: (formData) => ({
        url: "items/import",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: { data: ImportItemsSummary }) => response.data,
      invalidatesTags: [
        "Item",
        "StoreReceiptVoucher",
        "StoreIssueVoucher",
        "StoreTransferVoucher",
        "ItemGroup",
        "Unit",
      ],
    }),
  }),
});

export const {
  useGetItemGroupsQuery,
  useCreateItemGroupMutation,
  useUpdateItemGroupMutation,
  useDeleteItemGroupMutation,
  useGetUnitsQuery,
  useCreateUnitMutation,
  useUpdateUnitMutation,
  useDeleteUnitMutation,
  useGetItemsQuery,
  useGetItemByIdQuery,
  useGetItemByCodeQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
  useImportItemsMutation,
} = itemsApiSlice;
