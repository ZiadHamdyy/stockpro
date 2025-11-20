export class PurchaseInvoiceResponse {
  id: string;
  code: string;
  date: Date;
  supplierId?: string;
  supplier?: {
    id: string;
    code: string;
    name: string;
    commercialReg: string;
    taxNumber: string;
    nationalAddress: string;
    phone: string;
    openingBalance: number;
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
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  };
  branchId?: string;
  branch?: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    description?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
