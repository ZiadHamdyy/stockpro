import { apiSlice } from "../../ApiSlice";

export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  stores?: Store[];
}

export interface Store {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  description?: string;
  branchId: string;
  userId: string;
  branch?: Branch;
  user?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchDto {
  name: string;
  address?: string;
  phone?: string;
  description?: string;
}

export interface UpdateBranchDto extends Partial<CreateBranchDto> {}

export interface CreateStoreDto {
  name: string;
  address?: string;
  phone?: string;
  description?: string;
  branchId: string;
  userId: string;
}

export interface UpdateStoreDto extends Partial<CreateStoreDto> {}

export const branchApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBranches: builder.query<Branch[], void>({
      query: () => "branches",
      transformResponse: (response: { data: Branch[] }) => response.data,
      providesTags: ["Branch"],
    }),
    getBranch: builder.query<Branch, string>({
      query: (id) => `branches/${id}`,
      transformResponse: (response: { data: Branch }) => response.data,
      providesTags: (result, error, id) => [{ type: "Branch", id }],
    }),
    createBranch: builder.mutation<Branch, CreateBranchDto>({
      query: (data) => ({
        url: "branches",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: Branch }) => response.data,
      invalidatesTags: ["Branch"],
    }),
    updateBranch: builder.mutation<Branch, { id: string; data: UpdateBranchDto }>({
      query: ({ id, data }) => ({
        url: `branches/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: Branch }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "Branch", id },
        "Branch",
      ],
    }),
    deleteBranch: builder.mutation<void, string>({
      query: (id) => ({
        url: `branches/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Branch", id },
        "Branch",
      ],
    }),
  }),
});

export const {
  useGetBranchesQuery,
  useGetBranchQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} = branchApi;

