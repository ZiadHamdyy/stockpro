export class PriceQuotationResponse {
  id: string;
  code: string;
  date: Date;
  expiryDate?: Date | null;
  status: string;
  notes?: string | null;
  items: any[];
  totals: Record<string, any>;
  customerId?: string | null;
  customerName?: string | null;
  customer?: { id: string; name: string } | null;
  userId: string;
  user?: { id: string; name: string } | null;
  branchId?: string | null;
  branch?: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}
