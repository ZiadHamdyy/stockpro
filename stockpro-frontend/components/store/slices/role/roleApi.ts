import { apiSlice } from "../../ApiSlice";
import type { Role, AssignPermissionsRequest } from "../../../../types";

export const roleApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query({
      query: () => "roles",
      transformResponse: (response: { data: Role[] }) => response.data,
      providesTags: ["Role"],
    }),
    getRole: builder.query({
      query: (id) => `roles/${id}`,
      transformResponse: (response: { data: Role }) => response.data,
      providesTags: (result, error, id) => [{ type: "Role", id }],
    }),
    createRole: builder.mutation({
      query: (body) => ({
        url: `roles`,
        method: "POST",
        body,
      }),
      transformResponse: (response: { data: Role }) => response.data,
      invalidatesTags: ["Role"],
    }),
    assignPermissions: builder.mutation({
      query: ({ roleId, permissions }) => ({
        url: `roles/${roleId}/permissions`,
        method: "POST",
        body: permissions,
      }),
      transformResponse: (response: { data: Role }) => response.data,
      invalidatesTags: (result, error, { roleId }) => [
        { type: "Role", id: roleId },
        "Role",
      ],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRoleQuery,
  useCreateRoleMutation,
  useAssignPermissionsMutation,
} = roleApi;
