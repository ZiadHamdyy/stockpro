import { apiSlice } from "../../ApiSlice";

export interface CurrentAccount {
  id: string;
  code: string;
  name: string;
  type?: string;
  openingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCurrentAccountRequest {
  name: string;
  type?: string;
  openingBalance: number;
}

export interface UpdateCurrentAccountRequest {
  name?: string;
  type?: string;
  openingBalance?: number;
}

export const currentAccountsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentAccounts: builder.query<CurrentAccount[], void>({
      query: () => "current-accounts",
      transformResponse: (response: any) => response.data || [],
      providesTags: ["CurrentAccount"],
    }),
    getCurrentAccount: builder.query<CurrentAccount, string>({
      query: (id) => `current-accounts/${id}`,
      transformResponse: (response: any) => response.data || null,
      providesTags: (result, error, id) => [{ type: "CurrentAccount", id }],
    }),
    getCurrentAccountByCode: builder.query<CurrentAccount, string>({
      query: (code) => `current-accounts/code/${code}`,
      transformResponse: (response: any) => response.data || null,
      providesTags: (result, error, code) => [
        { type: "CurrentAccount", id: code },
      ],
    }),
    createCurrentAccount: builder.mutation<
      CurrentAccount,
      CreateCurrentAccountRequest
    >({
      query: (newAccount) => ({
        url: "current-accounts",
        method: "POST",
        body: newAccount,
      }),
      transformResponse: (response: any) => response.data || response,
      invalidatesTags: ["CurrentAccount"],
    }),
    updateCurrentAccount: builder.mutation<
      CurrentAccount,
      { id: string; data: UpdateCurrentAccountRequest }
    >({
      query: ({ id, data }) => ({
        url: `current-accounts/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: any) => response.data || response,
      invalidatesTags: (result, error, { id }) => [
        { type: "CurrentAccount", id },
        "CurrentAccount",
      ],
    }),
    deleteCurrentAccount: builder.mutation<void, string>({
      query: (id) => ({
        url: `current-accounts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "CurrentAccount", id },
        "CurrentAccount",
      ],
    }),
  }),
});

export const {
  useGetCurrentAccountsQuery,
  useGetCurrentAccountQuery,
  useGetCurrentAccountByCodeQuery,
  useCreateCurrentAccountMutation,
  useUpdateCurrentAccountMutation,
  useDeleteCurrentAccountMutation,
} = currentAccountsApi;
