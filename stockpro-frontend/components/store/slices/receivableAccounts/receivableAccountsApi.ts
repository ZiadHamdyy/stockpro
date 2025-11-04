import { apiSlice } from "../../ApiSlice";

export interface ReceivableAccount {
  id: string;
  code: string;
  name: string;
  openingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReceivableAccountRequest {
  name: string;
  openingBalance?: number;
}

export interface UpdateReceivableAccountRequest {
  name?: string;
  openingBalance?: number;
}

export const receivableAccountsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReceivableAccounts: builder.query<ReceivableAccount[], void>({
      query: () => "receivable-accounts",
      transformResponse: (response: any) => response.data || [],
      providesTags: ["ReceivableAccount"],
    }),
    getReceivableAccount: builder.query<ReceivableAccount, string>({
      query: (id) => `receivable-accounts/${id}`,
      transformResponse: (response: any) => response.data || null,
      providesTags: (result, error, id) => [{ type: "ReceivableAccount", id }],
    }),
    createReceivableAccount: builder.mutation<
      ReceivableAccount,
      CreateReceivableAccountRequest
    >({
      query: (newAccount) => ({
        url: "receivable-accounts",
        method: "POST",
        body: newAccount,
      }),
      transformResponse: (response: any) => response.data || response,
      invalidatesTags: ["ReceivableAccount"],
    }),
    updateReceivableAccount: builder.mutation<
      ReceivableAccount,
      { id: string; data: UpdateReceivableAccountRequest }
    >({
      query: ({ id, data }) => ({
        url: `receivable-accounts/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: any) => response.data || response,
      invalidatesTags: (result, error, { id }) => [
        { type: "ReceivableAccount", id },
        "ReceivableAccount",
      ],
    }),
    deleteReceivableAccount: builder.mutation<void, string>({
      query: (id) => ({
        url: `receivable-accounts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "ReceivableAccount", id },
        "ReceivableAccount",
      ],
    }),
  }),
});

export const {
  useGetReceivableAccountsQuery,
  useGetReceivableAccountQuery,
  useCreateReceivableAccountMutation,
  useUpdateReceivableAccountMutation,
  useDeleteReceivableAccountMutation,
} = receivableAccountsApi;


