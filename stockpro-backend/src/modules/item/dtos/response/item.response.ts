import { ItemGroupResponse } from '../../../item-group/dtos/response/item-group.response';
import { UnitResponse } from '../../../unit/dtos/response/unit.response';

export class ItemResponse {
  id: string;
  code: string;
  barcode?: string;
  name: string;
  purchasePrice: number;
  lastPurchasePrice?: number | null;
  salePrice: number;
  stock: number;
  openingBalance?: number; // StoreItem openingBalance when storeId is provided
  reorderLimit: number;
  type: 'STOCKED' | 'SERVICE';
  group: ItemGroupResponse;
  unit: UnitResponse;
  createdAt: Date;
  updatedAt: Date;
}
