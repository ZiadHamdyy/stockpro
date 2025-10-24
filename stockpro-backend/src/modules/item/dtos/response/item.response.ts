import { ItemGroupResponse } from '../../../item-group/dtos/response/item-group.response';
import { UnitResponse } from '../../../unit/dtos/response/unit.response';

export class ItemResponse {
  id: string;
  code: string;
  barcode?: string;
  name: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  reorderLimit: number;
  group: ItemGroupResponse;
  unit: UnitResponse;
  createdAt: Date;
  updatedAt: Date;
}
