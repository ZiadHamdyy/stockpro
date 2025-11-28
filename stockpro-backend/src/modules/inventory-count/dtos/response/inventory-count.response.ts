export class InventoryCountItemResponse {
  id: string;
  systemStock: number;
  actualStock: number;
  difference: number;
  cost: number;
  item: {
    id: string;
    code: string;
    barcode?: string;
    name: string;
    purchasePrice: number;
    initialPurchasePrice: number;
    salePrice: number;
    stock: number;
    reorderLimit: number;
    type: 'STOCKED' | 'SERVICE';
    group: {
      id: string;
      code: number;
      name: string;
      description?: string;
    };
    unit: {
      id: string;
      code: number;
      name: string;
      description?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export class InventoryCountResponse {
  id: string;
  code: string;
  date: Date;
  status: 'PENDING' | 'POSTED';
  notes?: string;
  totalVarianceValue: number;
  store: {
    id: string;
    code: number;
    name: string;
    address?: string;
    phone?: string;
    description?: string;
    branch?: {
      id: string;
      code: number;
      name: string;
      address?: string;
      phone?: string;
      description?: string;
    };
  };
  user: {
    id: string;
    code: number;
    email: string;
    name?: string;
  };
  branch?: {
    id: string;
    code: number;
    name: string;
    address?: string;
    phone?: string;
    description?: string;
  };
  items: InventoryCountItemResponse[];
  createdAt: Date;
  updatedAt: Date;
}

