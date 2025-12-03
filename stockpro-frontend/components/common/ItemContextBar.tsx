import React, { useMemo, useRef, useEffect } from "react";
import { BoxIcon } from "../icons";

export type SelectableItem = {
  id: string;
  name: string;
  unit: string;
  salePrice: number;
  purchasePrice: number;
  stock: number;
  type?: 'STOCKED' | 'SERVICE';
  barcode?: string;
  salePriceIncludesTax?: boolean;
  reorderLimit?: number;
};

export interface ItemContextBarProps {
  item: SelectableItem;
  stores: any[];
  branches: any[];
  storeReceiptVouchers: any[];
  storeIssueVouchers: any[];
  storeTransferVouchers: any[];
  purchaseInvoices: any[];
  purchaseReturns: any[];
  salesReturns: any[];
  invoices: any[];
  storeItems?: any[]; // Array of StoreItem objects with storeId, itemCode (or item.code), and openingBalance
  onClose?: () => void; // Callback to close the component
}

const ItemContextBar: React.FC<ItemContextBarProps> = ({
  item,
  stores,
  branches,
  storeReceiptVouchers,
  storeIssueVouchers,
  storeTransferVouchers,
  purchaseInvoices,
  purchaseReturns,
  salesReturns,
  invoices,
  storeItems,
  onClose,
}) => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    // Add event listener to document
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      // Cleanup event listener on unmount
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);
  const storeStocks = useMemo(() => {
    if (!stores || !item.id) return [];

    return stores.map((store) => {
      let qty = 0;
      const storeName = store.name;
      const storeId = store.id;
      const branchName = store.branch?.name || store.branchName || "";
      const branchId = store.branchId || store.branch?.id;

      // StoreItem Opening Balance: Match by storeId and item code
      storeItems?.forEach((storeItem: any) => {
        const itemCode = storeItem.itemCode || storeItem.item?.code;
        if (storeItem.storeId === storeId && itemCode === item.id) {
          qty += storeItem.openingBalance || 0;
        }
      });

      // Store Receipt Vouchers: Match by storeId, use quantity field, match by item code
      storeReceiptVouchers?.forEach((v: any) => {
        if (v.storeId === storeId) {
          v.items?.forEach((i: any) => {
            // Match by item code: i.item?.code === item.id (where item.id is the item code)
            if (i.item?.code === item.id) {
              qty += i.quantity || 0;
            }
          });
        }
      });

      // Store Issue Vouchers: Match by storeId, use quantity field, match by item code
      storeIssueVouchers?.forEach((v: any) => {
        if (v.storeId === storeId) {
          v.items?.forEach((i: any) => {
            if (i.item?.code === item.id) {
              qty -= i.quantity || 0;
            }
          });
        }
      });

      // Store Transfer Vouchers: Match by fromStoreId/toStoreId, use quantity field, match by item code
      storeTransferVouchers?.forEach((v: any) => {
        if (v.status === "approved") {
          // Transfer out (from this store)
          if (v.fromStoreId === storeId) {
            v.items?.forEach((i: any) => {
              if (i.item?.code === item.id) {
                qty -= i.quantity || 0;
              }
            });
          }
          // Transfer in (to this store)
          if (v.toStoreId === storeId) {
            v.items?.forEach((i: any) => {
              if (i.item?.code === item.id) {
                qty += i.quantity || 0;
              }
            });
          }
        }
      });

      // Purchase Invoices: Match by branch (branch-level), use qty field, match by item code
      purchaseInvoices?.forEach((inv: any) => {
        const invBranchId = inv.branchId || inv.branch?.id;
        const invBranchName = inv.branch?.name || inv.branchName;
        if (invBranchId === branchId || invBranchName === branchName) {
          inv.items?.forEach((i: any) => {
            // Invoice items use id field which is the item code
            if (i.id === item.id) {
              qty += i.qty || 0;
            }
          });
        }
      });

      // Purchase Returns: Match by branch, use qty field, match by item code
      purchaseReturns?.forEach((inv: any) => {
        const invBranchId = inv.branchId || inv.branch?.id;
        const invBranchName = inv.branch?.name || inv.branchName;
        if (invBranchId === branchId || invBranchName === branchName) {
          inv.items?.forEach((i: any) => {
            if (i.id === item.id) {
              qty -= i.qty || 0;
            }
          });
        }
      });

      // Sales Invoices: Match by branch, use qty field, match by item code
      invoices?.forEach((inv: any) => {
        const invBranchId = inv.branchId || inv.branch?.id;
        const invBranchName = inv.branch?.name || inv.branchName;
        if (invBranchId === branchId || invBranchName === branchName) {
          inv.items?.forEach((i: any) => {
            if (i.id === item.id) {
              qty -= i.qty || 0;
            }
          });
        }
      });

      // Sales Returns: Match by branch, use qty field, match by item code
      salesReturns?.forEach((inv: any) => {
        const invBranchId = inv.branchId || inv.branch?.id;
        const invBranchName = inv.branch?.name || inv.branchName;
        if (invBranchId === branchId || invBranchName === branchName) {
          inv.items?.forEach((i: any) => {
            if (i.id === item.id) {
              qty += i.qty || 0;
            }
          });
        }
      });

      return { name: storeName, branch: branchName, qty };
    });
  }, [
    item.id,
    stores,
    storeReceiptVouchers,
    storeIssueVouchers,
    storeTransferVouchers,
    purchaseInvoices,
    purchaseReturns,
    salesReturns,
    invoices,
    storeItems,
  ]);

  return (
    <div 
      ref={barRef}
      className="fixed bottom-0 left-0 right-0 bg-blue-600 border-t-4 border-blue-400 text-white shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-50 animate-slide-up"
    >
      <div className="container mx-auto px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 min-w-[200px]">
          <div className="p-3 bg-blue-500/50 backdrop-blur-md rounded-xl border border-blue-400/50 shadow-lg">
            <BoxIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white leading-tight tracking-wide drop-shadow-md">
              {item.name || "اختر صنفاً"}
            </h3>
            <div className="flex items-center gap-3 text-xs text-blue-100 font-mono mt-1 font-semibold uppercase tracking-wider">
              <span className="bg-blue-800/40 px-2 py-0.5 rounded border border-blue-500/30">
                {item.id}
              </span>
              <span className="w-1.5 h-1.5 bg-blue-300 rounded-full"></span>
              <span>{item.unit}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white text-gray-800 rounded-lg shadow-lg border-b-4 border-blue-500 overflow-hidden min-w-[110px] transform transition hover:-translate-y-1">
            <div className="bg-blue-50 px-3 py-1.5 text-[10px] text-blue-800 font-bold text-center border-b border-blue-100 uppercase tracking-wide">
              سعر البيع
            </div>
            <div className="px-4 py-1 text-center">
              <p className="text-2xl font-black text-blue-700 tracking-tight">
                {item.salePrice.toFixed(2)}
              </p>
            </div>
          </div>
          {item.purchasePrice && (
            <div className="bg-white text-gray-800 rounded-lg shadow-lg border-b-4 border-blue-300 overflow-hidden min-w-[110px] opacity-90 hover:opacity-100 transition-opacity">
              <div className="bg-blue-50 px-3 py-1.5 text-[10px] text-blue-800 font-bold text-center border-b border-blue-100 uppercase tracking-wide">
                سعر التكلفة
              </div>
              <div className="px-4 py-1 text-center">
                <p className="text-2xl font-black text-blue-900 tracking-tight font-mono">
                  {item.purchasePrice.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 flex items-center justify-end gap-6 w-full lg:w-auto overflow-hidden">
          <div className="flex gap-3 overflow-x-auto pb-2 pt-2 max-w-2xl hide-scrollbar items-center px-2">
            {storeStocks.map((s, idx) => {
              const hasStock = s.qty > 0;
              return (
                <div
                  key={idx}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg flex flex-col items-center justify-center min-w-[100px] transition-all duration-300 ${
                    hasStock
                      ? "bg-white shadow-xl transform hover:scale-105 border-b-4 border-emerald-500"
                      : "bg-blue-800/30 border border-blue-400/30 hover:bg-blue-800/50"
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold whitespace-nowrap mb-1 uppercase tracking-wider ${
                      hasStock ? "text-blue-900" : "text-blue-200"
                    }`}
                  >
                    {s.name}
                  </span>
                  <span
                    className={`font-black text-xl leading-none ${
                      hasStock ? "text-emerald-600" : "text-white/40"
                    }`}
                  >
                    {s.qty}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col items-end min-w-[130px] pl-6 border-r border-blue-400/30 md:border-r-0 md:border-l md:pl-0 md:pr-6">
            <span className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mb-1">
              الرصيد الكلي
            </span>
            <span
              className={`text-5xl font-black drop-shadow-lg leading-none tracking-tighter ${
                item.stock <= 0
                  ? "text-red-300 animate-pulse"
                  : "text-white"
              }`}
            >
              {item.stock}
            </span>
          </div>
        </div>
      </div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ItemContextBar;

