import { apiSlice } from "../../ApiSlice";

export interface ItemGroup {
  id: string;
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
  salePrice: number;
  stock: number;
  reorderLimit: number;
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
}

export const itemsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder: any) => ({
    // Item Groups
    getItemGroups: builder.query({
      query: () => "item-groups",
    }),
    createItemGroup: builder.mutation({
      query: (data) => ({
        url: "item-groups",
        method: "POST",
        body: data,
      }),
    }),
    updateItemGroup: builder.mutation({
      query: ({ id, data }) => ({
        url: `item-groups/${id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteItemGroup: builder.mutation({
      query: (id) => ({
        url: `item-groups/${id}`,
        method: "DELETE",
      }),
    }),

    // Units
    getUnits: builder.query({
      query: () => "units",
    }),
    createUnit: builder.mutation({
      query: (data) => ({
        url: "units",
        method: "POST",
        body: data,
      }),
    }),
    updateUnit: builder.mutation({
      query: ({ id, data }) => ({
        url: `units/${id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteUnit: builder.mutation({
      query: (id) => ({
        url: `units/${id}`,
        method: "DELETE",
      }),
    }),

    // Items
    getItems: builder.query({
      query: () => "items",
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
    }),
    updateItem: builder.mutation({
      query: ({ id, data }) => ({
        url: `items/${id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteItem: builder.mutation({
      query: (id) => ({
        url: `items/${id}`,
        method: "DELETE",
      }),
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
} = itemsApiSlice;
