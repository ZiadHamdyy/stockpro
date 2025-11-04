import { apiSlice } from "../../ApiSlice";

export interface PayableAccount {
  id: string;
  code: string;
  name: string;
  openingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePayableAccountRequest {
  name: string;
  openingBalance?: number;
}

export interface UpdatePayableAccountRequest {
  name?: string;
  openingBalance?: number;
}

export const payableAccountsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPayableAccounts: builder.query<PayableAccount[], void>({
      query: () => "payable-accounts",
      transformResponse: (response: any) => response.data || [],
      providesTags: ["PayableAccount"],
    }),
    getPayableAccount: builder.query<PayableAccount, string>({
      query: (id) => `payable-accounts/${id}`,
      transformResponse: (response: any) => response.data || null,
      providesTags: (result, error, id) => [{ type: "PayableAccount", id }],
    }),
    createPayableAccount: builder.mutation<
      PayableAccount,
      CreatePayableAccountRequest
    >({
      query: (newAccount) => ({
        url: "payable-accounts",
        method: "POST",
        body: newAccount,
      }),
      transformResponse: (response: any) => response.data || response,
      invalidatesTags: ["PayableAccount"],
    }),
    updatePayableAccount: builder.mutation<
      PayableAccount,
      { id: string; data: UpdatePayableAccountRequest }
    >({
      query: ({ id, data }) => ({
        url: `payable-accounts/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: any) => response.data || response,
      invalidatesTags: (result, error, { id }) => [
        { type: "PayableAccount", id },
        "PayableAccount",
      ],
    }),
    deletePayableAccount: builder.mutation<void, string>({
      query: (id) => ({
        url: `payable-accounts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "PayableAccount", id },
        "PayableAccount",
      ],
    }),
  }),
});

export const {
  useGetPayableAccountsQuery,
  useGetPayableAccountQuery,
  useCreatePayableAccountMutation,
  useUpdatePayableAccountMutation,
  useDeletePayableAccountMutation,
} = payableAccountsApi;


