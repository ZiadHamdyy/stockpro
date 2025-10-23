import React, { useState, useMemo } from 'react';
import { MENU_ITEMS } from '../../constants';
import type { MenuItem } from '../../types';
import { ChevronDownIcon } from '../icons';

interface SidebarProps {
  onMenuSelect: (key: string, label: string) => void;
  searchTerm: string;
  userPermissions: string[];
}

const StockProLogo: React.FC = () => (
    <div className="flex items-center gap-2">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 22.0001L13 26.0001L26 13.3334L19 9.33341L6 22.0001Z" fill="#A3E635"/>
            <path d="M19 9.33325L26 13.3333L13 26L6 22L19 9.33325Z" stroke="#F9FAFB" strokeWidth="1.5"/>
            <path d="M26 10L19 6L6 18.6666L13 22.6666L26 10Z" fill="#1E40AF"/>
            <path d="M13 22.6667L6 18.6667L19 6L26 10L13 22.6667Z" stroke="#F9FAFB" strokeWidth="1.5"/>
        </svg>
        <span className="text-2xl font-bold text-white">StockPro</span>
    </div>
);

const filterByPermissions = (items: MenuItem[], permissions: string[]): MenuItem[] => {
    if (permissions.includes('all')) {
        return items;
    }

    const allowedKeys = new Set(permissions);
    
    // Add parent keys for any allowed child
    const addParents = (item: MenuItem) => {
        if(item.children){
            item.children.forEach(child => {
                if(allowedKeys.has(child.key)){
                    allowedKeys.add(item.key);
                }
                addParents(child);
            });
        }
    };
    items.forEach(addParents);

    const recursiveFilter = (menuItems: MenuItem[]): MenuItem[] => {
        return menuItems
            .map(item => {
                if (!allowedKeys.has(item.key) && !item.children?.some(child => allowedKeys.has(child.key))) {
                    // This is a rough check, a better one would check all descendants
                    // but for our structure this should work.
                     if(!item.children) return null;
                }

                if (item.children) {
                    const filteredChildren = recursiveFilter(item.children);
                    if (filteredChildren.length === 0 && !allowedKeys.has(item.key)) {
                       return null;
                    }
                    return { ...item, children: filteredChildren };
                }

                return allowedKeys.has(item.key) ? item : null;
            })
            .filter((item): item is MenuItem => item !== null);
    };

    return recursiveFilter(items);
};


const filterMenuItems = (items: MenuItem[], term: string): MenuItem[] => {
    if (!term.trim()) {
        return items;
    }

    const lowerCaseTerm = term.toLowerCase().trim();

    return items.map(item => {
        if (item.label.toLowerCase().includes(lowerCaseTerm)) {
            return item;
        }

        if (item.children) {
            const filteredChildren = filterMenuItems(item.children, term);
            if (filteredChildren.length > 0) {
                return { ...item, children: filteredChildren };
            }
        }

        return null;
    }).filter((item): item is MenuItem => item !== null);
};


const Sidebar: React.FC<SidebarProps> = ({ onMenuSelect, searchTerm, userPermissions }) => {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({settings: true, reports: true});

  const menuFilteredByPermissions = useMemo(() => filterByPermissions(MENU_ITEMS, userPermissions), [userPermissions]);
  const filteredMenu = useMemo(() => filterMenuItems(menuFilteredByPermissions, searchTerm), [searchTerm, menuFilteredByPermissions]);

  const toggleMenu = (key: string) => {
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelect = (item: MenuItem) => {
    if (!item.children) {
      onMenuSelect(item.key, item.label);
    } else {
      toggleMenu(item.key);
    }
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const paddingClass = `pr-${4 + level * 4}`;
    const isOpen = !!searchTerm || openMenus[item.key] || false;
    const hasChildren = !!item.children;

    let styleClass = '';
    const isParentOpen = isOpen && hasChildren;

    if (isParentOpen) {
        styleClass = 'text-white bg-brand-green';
    } else {
        styleClass = 'text-gray-200 hover:bg-brand-green hover:text-white';
    }

    return (
        <div key={item.key}>
            <button
                onClick={() => handleSelect(item)}
                className={`w-full text-right flex justify-between items-center py-2.5 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${paddingClass} ${styleClass}`}
            >
                <span className="flex items-center">
                    <item.icon className="w-5 h-5 ml-3" />
                    {item.label}
                </span>
                {item.children && (
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                )}
            </button>
            {item.children && isOpen && (
                <div className="mt-1 space-y-1 bg-brand-green rounded-md p-2">
                    {item.children.map(child => renderMenuItem(child, level + 1))}
                </div>
            )}
        </div>
    );
  };

  return (
    <aside className="w-64 bg-brand-blue text-white flex flex-col flex-shrink-0">
      <div className="h-16 flex items-center justify-center px-4 border-b border-blue-900 bg-brand-blue">
        <StockProLogo />
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto sidebar-scrollbar">
        {filteredMenu.map(item => renderMenuItem(item))}
      </nav>
      <div className="p-4 border-t border-blue-900 text-center text-xs text-gray-300">
        <p>StockPro &copy; 2024</p>
        <p>All rights reserved.</p>
      </div>
    </aside>
  );
};

export default Sidebar;