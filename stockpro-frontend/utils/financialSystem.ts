import { ValuationMethod, PricingConfig } from '../components/pages/settings/financial-system/types';

/**
 * Maps the COGS method to the valuation method string used in inventory calculations for Income Statement (COGS).
 * 
 * @param settings - Optional PricingConfig object. If provided, uses settings.cogsMethod. Otherwise falls back to localStorage.
 * @returns "averageCost" for WEIGHTED_AVERAGE, "purchasePrice" for LAST_PURCHASE_PRICE, or "averageCost" as default
 * @deprecated Prefer using Redux hook useGetFinancialSettingsQuery() directly in components
 */
export const getCogsValuationMethod = (settings?: PricingConfig): "averageCost" | "purchasePrice" => {
  // If settings provided, use them
  if (settings?.cogsMethod) {
    if (settings.cogsMethod === ValuationMethod.WEIGHTED_AVERAGE) {
      return "averageCost";
    }
    
    if (settings.cogsMethod === ValuationMethod.LAST_PURCHASE_PRICE) {
      return "purchasePrice";
    }
  }
  
  // Fallback to localStorage for backward compatibility
  const stored = localStorage.getItem("cogsMethod");
  
  if (stored === ValuationMethod.WEIGHTED_AVERAGE) {
    return "averageCost";
  }
  
  if (stored === ValuationMethod.LAST_PURCHASE_PRICE) {
    return "purchasePrice";
  }
  
  // Default to average cost for backward compatibility
  return "averageCost";
};

/**
 * Maps the inventory valuation method to the valuation method string used in inventory calculations for Balance Sheet (asset valuation).
 * 
 * @param settings - Optional PricingConfig object. If provided, uses settings.inventoryValuationMethod. Otherwise falls back to localStorage.
 * @returns "averageCost" for WEIGHTED_AVERAGE, "purchasePrice" for FIFO/LAST_PURCHASE_PRICE, or "averageCost" as default
 * @deprecated Prefer using Redux hook useGetFinancialSettingsQuery() directly in components
 */
export const getInventoryValuationMethod = (settings?: PricingConfig): "averageCost" | "purchasePrice" => {
  // If settings provided, use them
  if (settings?.inventoryValuationMethod) {
    if (settings.inventoryValuationMethod === ValuationMethod.WEIGHTED_AVERAGE) {
      return "averageCost";
    }
    
    if (settings.inventoryValuationMethod === ValuationMethod.FIFO || 
        settings.inventoryValuationMethod === ValuationMethod.LAST_PURCHASE_PRICE) {
      return "purchasePrice";
    }
  }
  
  // Fallback to localStorage for backward compatibility
  const stored = localStorage.getItem("inventoryValuationMethod");
  
  if (stored === ValuationMethod.WEIGHTED_AVERAGE) {
    return "averageCost";
  }
  
  if (stored === ValuationMethod.FIFO || stored === ValuationMethod.LAST_PURCHASE_PRICE) {
    return "purchasePrice";
  }
  
  // Default to average cost for backward compatibility
  return "averageCost";
};

