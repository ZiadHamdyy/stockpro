import { apiSlice } from "../../ApiSlice";

export interface Customer {
  id: string;
  code: string;
  name: string;
  commercialReg: string;
  taxNumber: string;
  nationalAddress: string;
  phone: string;
  openingBalance: number;
  currentBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  commercialReg: string;
  taxNumber: string;
  nationalAddress: string;
  phone: string;
  openingBalance?: number;
  creditLimit?: number;
}

export interface UpdateCustomerRequest {
  name?: string;
  commercialReg?: string;
  taxNumber?: string;
  nationalAddress?: string;
  phone?: string;
  openingBalance?: number;
  creditLimit?: number;
}

export const customerApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<Customer[], string | void>({
      query: (search) => ({
        url: "customers",
        params: search ? { search } : undefined,
      }),
      transformResponse: (response: { data: Customer[] }) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Customer" as const, id })),
              { type: "Customer", id: "LIST" },
            ]
          : [{ type: "Customer", id: "LIST" }],
    }),
    getCustomerById: builder.query<Customer, string>({
      query: (id) => `customers/${id}`,
      transformResponse: (response: { data: Customer }) => response.data,
      providesTags: (result, error, id) => [{ type: "Customer", id }],
    }),
    createCustomer: builder.mutation<Customer, CreateCustomerRequest>({
      query: (data) => ({
        url: "customers",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: Customer }) => response.data,
      invalidatesTags: (result) => [
        { type: "Customer", id: "LIST" },
        ...(result ? [{ type: "Customer" as const, id: result.id }] : []),
        "SalesInvoice",
        "SalesReturn",
        "PaymentVoucher",
        "ReceiptVoucher",
      ],
    }),
    updateCustomer: builder.mutation<
      Customer,
      { id: string; data: UpdateCustomerRequest }
    >({
      query: ({ id, data }) => ({
        url: `customers/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: Customer }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "Customer", id },
        { type: "Customer", id: "LIST" },
        "SalesInvoice",
        "SalesReturn",
        "PaymentVoucher",
        "ReceiptVoucher",
      ],
    }),
    deleteCustomer: builder.mutation<void, string>({
      query: (id) => ({
        url: `customers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Customer", id },
        { type: "Customer", id: "LIST" },
        "SalesInvoice",
        "SalesReturn",
        "PaymentVoucher",
        "ReceiptVoucher",
      ],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customerApiSlice;
