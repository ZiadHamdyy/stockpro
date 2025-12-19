export enum TaxPolicy {
  EXCLUSIVE = 'EXCLUSIVE',
  INCLUSIVE = 'INCLUSIVE',
}

export enum ValuationMethod {
  WEIGHTED_AVERAGE = 'WEIGHTED_AVERAGE',
  FIFO = 'FIFO',
  LAST_PURCHASE_PRICE = 'LAST_PURCHASE_PRICE',
}

export enum RoundingMethod {
  NONE = 'NONE',
  NEAREST_0_05 = 'NEAREST_0_05',
  NEAREST_1_00 = 'NEAREST_1_00',
}

export enum StrictnessLevel {
  BLOCK = 'BLOCK',
  APPROVAL = 'APPROVAL',
  WARNING = 'WARNING',
}

export interface PricingConfig {
  taxPolicy: TaxPolicy;
  defaultTaxRate: number;
  baseCurrency: string;
  enableMultiCurrency: boolean;
  roundingMethod: RoundingMethod;
  inventoryValuationMethod: ValuationMethod;
  cogsMethod: ValuationMethod;
  autoUpdateSalePriceOnPurchase: boolean;
  defaultMarginPercentage: number;
  lockPostedPeriods: boolean;
  closingDate: string;
  preventDuplicateSupplierRef: boolean;
  creditLimitControl: StrictnessLevel;
  minMarginControl: StrictnessLevel;
  allowSellingBelowCost: boolean;
  maxCashTransactionLimit: number;
  requireCostCenterForExpenses: boolean;
  allowNegativeStock: boolean;
  reserveStockOnOrder: boolean;
  maxDiscountPercentage: number;
  requireManagerApprovalForDiscount: boolean;
  activePriceLists: Record<string, boolean>;
}


