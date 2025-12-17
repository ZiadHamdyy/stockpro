import React from 'react';
import type { Item, ItemGroup } from '../../../../types';
import { BoxIcon } from '../../../icons';
import { formatNumber } from '../../../../utils/formatting';
import PermissionWrapper from '../../../common/PermissionWrapper';
import { Resources, Actions, buildPermission } from '../../../../enums/permissions.enum';

interface ProductGridProps {
  items: Item[];
  onAdd: (item: Item) => void;
  activeCategory: string;
  onSelectCategory: (id: string) => void;
  itemGroups: ItemGroup[];
}

const ProductGrid: React.FC<ProductGridProps> = ({ 
  items, 
  onAdd, 
  activeCategory, 
  onSelectCategory,
  itemGroups 
}) => {
  const categoryOptions = [
    { id: "all", name: "الكل" },
    ...itemGroups.map((g) => ({ id: g.name, name: g.name }))
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      
      {/* Category Tabs */}
      <div className="flex overflow-x-auto p-2 bg-gray-100 border-b border-gray-300 gap-2 no-scrollbar">
        {categoryOptions.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3 py-1.5 whitespace-nowrap text-xs font-bold rounded-full transition-all border ${
              activeCategory === cat.id 
                ? 'bg-blue-600 text-white border-blue-700 shadow-sm' 
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        {items.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {items.map((item) => (
              <PermissionWrapper
                key={item.id}
                requiredPermission={buildPermission(
                  Resources.SALES_INVOICE,
                  Actions.CREATE
                )}
              >
                <div
                  onClick={() => onAdd(item)}
                  className="bg-white border border-gray-200 rounded-lg p-2 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group flex flex-col items-center text-center h-full"
                >
                  <div className="w-full aspect-square bg-gray-50 rounded mb-2 overflow-hidden flex items-center justify-center">
                    {item.name.charAt(0)}
                  </div>
                  <h3 className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight h-8 mb-1">
                    {item.name}
                  </h3>
                  <div className="flex flex-col items-center gap-1">
                    <span className="bg-blue-50 text-blue-700 text-xs font-black px-2 py-0.5 rounded">
                      {formatNumber(item.salePrice)}
                    </span>
                    <span className={`text-[10px] ${item.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      المخزون: {item.stock}
                    </span>
                  </div>
                </div>
              </PermissionWrapper>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
            <BoxIcon className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-sm font-bold">لا توجد منتجات</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;
