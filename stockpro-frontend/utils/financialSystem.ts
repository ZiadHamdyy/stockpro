import { ValuationMethod } from '../components/pages/settings/financial-system/types';

/**
 * Reads the COGS method from localStorage and maps it to the valuation method string
 * used in inventory calculations for Income Statement (COGS).
 * 
 * @returns "averageCost" for WEIGHTED_AVERAGE, "purchasePrice" for LAST_PURCHASE_PRICE, or "averageCost" as default
 */
export const getCogsValuationMethod = (): "averageCost" | "purchasePrice" => {
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
 * Reads the inventory valuation method from localStorage and maps it to the valuation method string
 * used in inventory calculations for Balance Sheet (asset valuation).
 * 
 * @returns "averageCost" for WEIGHTED_AVERAGE, "purchasePrice" for FIFO/LAST_PURCHASE_PRICE, or "averageCost" as default
 */
export const getInventoryValuationMethod = (): "averageCost" | "purchasePrice" => {
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

