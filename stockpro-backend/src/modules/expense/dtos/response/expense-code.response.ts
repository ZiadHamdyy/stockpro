export class ExpenseCodeResponse {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  expenseTypeId: string;
  expenseType?: {
    id: string;
    name: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}
