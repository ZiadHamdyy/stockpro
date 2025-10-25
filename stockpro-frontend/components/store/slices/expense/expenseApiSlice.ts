import { apiSlice } from "../../ApiSlice";

// ==================== Expense Type Types ====================

export interface ExpenseType {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseTypeRequest {
  name: string;
  description?: string;
}

export interface UpdateExpenseTypeRequest {
  name?: string;
  description?: string;
}

// ==================== Expense Code Types ====================

export interface ExpenseCode {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  expenseTypeId: string;
  expenseType?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseCodeRequest {
  name: string;
  expenseTypeId: string;
  description?: string;
}

export interface UpdateExpenseCodeRequest {
  name?: string;
  expenseTypeId?: string;
  description?: string;
}

// ==================== Expense Types ====================

export interface Expense {
  id: string;
  code: string;
  date: string;
  amount: number;
  description?: string | null;
  expenseCodeId: string;
  expenseCode?: {
    id: string;
    code: string;
    name: string;
    expenseType: {
      id: string;
      name: string;
    } | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseRequest {
  date: string;
  expenseCodeId: string;
  amount: number;
  description?: string;
}

export interface UpdateExpenseRequest {
  date?: string;
  expenseCodeId?: string;
  amount?: number;
  description?: string;
}

export const expenseApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ==================== Expense Types ====================
    getExpenseTypes: builder.query<ExpenseType[], string | void>({
      query: (search) => ({
        url: "expenses/types",
        params: search ? { search } : undefined,
      }),
      transformResponse: (response: { data: ExpenseType[] }) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "ExpenseType" as const, id })),
              { type: "ExpenseType", id: "LIST" },
            ]
          : [{ type: "ExpenseType", id: "LIST" }],
    }),
    getExpenseTypeById: builder.query<ExpenseType, string>({
      query: (id) => `expenses/types/${id}`,
      transformResponse: (response: { data: ExpenseType }) => response.data,
      providesTags: (result, error, id) => [{ type: "ExpenseType", id }],
    }),
    createExpenseType: builder.mutation<ExpenseType, CreateExpenseTypeRequest>({
      query: (data) => ({
        url: "expenses/types",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: ExpenseType }) => response.data,
      invalidatesTags: [{ type: "ExpenseType", id: "LIST" }],
    }),
    updateExpenseType: builder.mutation<
      ExpenseType,
      { id: string; data: UpdateExpenseTypeRequest }
    >({
      query: ({ id, data }) => ({
        url: `expenses/types/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: ExpenseType }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "ExpenseType", id },
        { type: "ExpenseType", id: "LIST" },
      ],
    }),
    deleteExpenseType: builder.mutation<void, string>({
      query: (id) => ({
        url: `expenses/types/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "ExpenseType", id },
        { type: "ExpenseType", id: "LIST" },
      ],
    }),

    // ==================== Expense Codes ====================
    getExpenseCodes: builder.query<ExpenseCode[], string | void>({
      query: (search) => ({
        url: "expenses/codes",
        params: search ? { search } : undefined,
      }),
      transformResponse: (response: { data: ExpenseCode[] }) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "ExpenseCode" as const, id })),
              { type: "ExpenseCode", id: "LIST" },
            ]
          : [{ type: "ExpenseCode", id: "LIST" }],
    }),
    getExpenseCodeById: builder.query<ExpenseCode, string>({
      query: (id) => `expenses/codes/${id}`,
      transformResponse: (response: { data: ExpenseCode }) => response.data,
      providesTags: (result, error, id) => [{ type: "ExpenseCode", id }],
    }),
    createExpenseCode: builder.mutation<ExpenseCode, CreateExpenseCodeRequest>({
      query: (data) => ({
        url: "expenses/codes",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: ExpenseCode }) => response.data,
      invalidatesTags: [{ type: "ExpenseCode", id: "LIST" }],
    }),
    updateExpenseCode: builder.mutation<
      ExpenseCode,
      { id: string; data: UpdateExpenseCodeRequest }
    >({
      query: ({ id, data }) => ({
        url: `expenses/codes/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: ExpenseCode }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "ExpenseCode", id },
        { type: "ExpenseCode", id: "LIST" },
      ],
    }),
    deleteExpenseCode: builder.mutation<void, string>({
      query: (id) => ({
        url: `expenses/codes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "ExpenseCode", id },
        { type: "ExpenseCode", id: "LIST" },
      ],
    }),

    // ==================== Expenses ====================
    getExpenses: builder.query<Expense[], string | void>({
      query: (search) => ({
        url: "expenses",
        params: search ? { search } : undefined,
      }),
      transformResponse: (response: { data: Expense[] }) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Expense" as const, id })),
              { type: "Expense", id: "LIST" },
            ]
          : [{ type: "Expense", id: "LIST" }],
    }),
    getExpenseById: builder.query<Expense, string>({
      query: (id) => `expenses/${id}`,
      transformResponse: (response: { data: Expense }) => response.data,
      providesTags: (result, error, id) => [{ type: "Expense", id }],
    }),
    createExpense: builder.mutation<Expense, CreateExpenseRequest>({
      query: (data) => ({
        url: "expenses",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: Expense }) => response.data,
      invalidatesTags: [{ type: "Expense", id: "LIST" }],
    }),
    updateExpense: builder.mutation<
      Expense,
      { id: string; data: UpdateExpenseRequest }
    >({
      query: ({ id, data }) => ({
        url: `expenses/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: Expense }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "Expense", id },
        { type: "Expense", id: "LIST" },
      ],
    }),
    deleteExpense: builder.mutation<void, string>({
      query: (id) => ({
        url: `expenses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Expense", id },
        { type: "Expense", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetExpenseTypesQuery,
  useGetExpenseTypeByIdQuery,
  useCreateExpenseTypeMutation,
  useUpdateExpenseTypeMutation,
  useDeleteExpenseTypeMutation,
  useGetExpenseCodesQuery,
  useGetExpenseCodeByIdQuery,
  useCreateExpenseCodeMutation,
  useUpdateExpenseCodeMutation,
  useDeleteExpenseCodeMutation,
  useGetExpensesQuery,
  useGetExpenseByIdQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} = expenseApiSlice;
