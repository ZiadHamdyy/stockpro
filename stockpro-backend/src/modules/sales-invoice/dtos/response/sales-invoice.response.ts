export class SalesInvoiceResponse {
  id: string;
  code: string;
  date: Date;
  customerId?: string;
  customer?: {
    id: string;
    name: string;
    code: string;
  };
  items: any[];
  subtotal: number;
  discount: number;
  tax: number;
  net: number;
  paymentMethod: string;
  paymentTargetType?: string;
  paymentTargetId?: string;
  safeId?: string;
  safe?: {
    id: string;
    name: string;
  } | null;
  bankId?: string;
  bank?: {
    id: string;
    name: string;
  } | null;
  notes?: string;
  userId: string;
  user?: {
    id: string;
    name: string;
  };
  branchId?: string;
  branch?: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
