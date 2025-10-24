import { apiSlice } from "../../ApiSlice";
import type { Permission } from "../../../types";

export const permissionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPermissions: builder.query<Permission[], void>({
      query: () => 'permissions',
      providesTags: ['Permission'],
    }),
    getPermissionsGrouped: builder.query<any[], void>({
      query: () => 'permissions/grouped',
      providesTags: ['Permission'],
    }),
  }),
});

export const {
  useGetPermissionsQuery,
  useGetPermissionsGroupedQuery,
} = permissionApi;
