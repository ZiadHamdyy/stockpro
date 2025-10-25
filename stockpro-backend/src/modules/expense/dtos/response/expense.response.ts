export class ExpenseResponse {
  id: string;
  code: string;
  date: Date;
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
  createdAt: Date;
  updatedAt: Date;
}
