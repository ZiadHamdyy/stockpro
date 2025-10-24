import { apiSlice } from "../../ApiSlice";
import type { Role, AssignPermissionsRequest } from "../../../types";

export const roleApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query<Role[], void>({
      query: () => "roles",
      transformResponse: (response: { data: Role[] }) => response.data,
      providesTags: ["Role"],
    }),
    getRole: builder.query<Role, string>({
      query: (id) => `roles/${id}`,
      transformResponse: (response: { data: Role }) => response.data,
      providesTags: (result, error, id) => [{ type: "Role", id }],
    }),
    assignPermissions: builder.mutation<
      Role,
      { roleId: string; permissions: AssignPermissionsRequest }
    >({
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
  useAssignPermissionsMutation,
} = roleApi;
