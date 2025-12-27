import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MENU_ITEMS } from "../../constants";
import type { MenuItem } from "../../types";
import { ChevronDownIcon, HomeIcon } from "../icons";
import {
  getPathFromMenuKey,
  getMenuKeyFromPath,
} from "../../utils/menuPathMapper";
import { filterMenuByReadPermissions } from "../../utils/permissions";
import { useSubscription } from "../hook/useSubscription";
import { filterMenuBySubscription } from "../../utils/subscriptionFilter";

interface SidebarProps {
  searchTerm: string;
  permissionSet: Set<string>;
  onDatabaseBackup?: () => void;
  isOpen: boolean;
}

const StockProLogo: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <div className={`flex items-center ${isOpen ? 'gap-2' : 'justify-center'}`}>
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 22.0001L13 26.0001L26 13.3334L19 9.33341L6 22.0001Z"
        fill="#A3E635"
      />
      <path
        d="M19 9.33325L26 13.3333L13 26L6 22L19 9.33325Z"
        stroke="#F9FAFB"
        strokeWidth="1.5"
      />
      <path d="M26 10L19 6L6 18.6666L13 22.6666L26 10Z" fill="#1E40AF" />
      <path
        d="M13 22.6667L6 18.6667L19 6L26 10L13 22.6667Z"
        stroke="#F9FAFB"
        strokeWidth="1.5"
      />
    </svg>
    {isOpen && <span className="text-2xl font-bold text-white">StockPro</span>}
  </div>
);

const filterMenuItems = (items: MenuItem[], term: string): MenuItem[] => {
  if (!term.trim()) {
    return items;
  }

  const lowerCaseTerm = term.toLowerCase().trim();

  return items
    .map((item) => {
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
    })
    .filter((item): item is MenuItem => item !== null);
};

const Sidebar: React.FC<SidebarProps> = ({
  searchTerm,
  permissionSet,
  onDatabaseBackup,
  isOpen,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const { subscription, isLoading: subscriptionLoading } = useSubscription();

  const menuFilteredByPermissions = useMemo(
    () => filterMenuByReadPermissions(MENU_ITEMS, permissionSet),
    [permissionSet],
  ); // hides pages without read access and prunes empty groups

  // Filter menu items by subscription plan
  // Only filter when subscription is loaded, otherwise show all items
  const menuFilteredBySubscription = useMemo(
    () => {
      if (subscriptionLoading || !subscription) {
        // Show all items while loading or if no subscription
        return menuFilteredByPermissions;
      }
      
      const filtered = filterMenuBySubscription(
        menuFilteredByPermissions, 
        subscription.planType
      );
      
      // Debug: Log if Financial Analysis is in the filtered result
      const hasFinancialAnalysis = filtered.some(
        item => item.key === 'reports' && 
        item.children?.some(child => child.key === 'financial_analysis')
      );
      
      if (hasFinancialAnalysis && subscription.planType === 'BASIC') {
        console.error('[Sidebar] ERROR: Financial Analysis visible for BASIC plan!', {
          planType: subscription.planType,
          filteredItems: filtered.map(i => i.key),
        });
      }
      
      return filtered;
    },
    [menuFilteredByPermissions, subscription?.planType, subscriptionLoading]
  );


  const filteredMenu = useMemo(
    () => filterMenuItems(menuFilteredBySubscription, searchTerm),
    [searchTerm, menuFilteredBySubscription],
  );

  // Get current active menu key from path
  const activeMenuKey = useMemo(
    () => getMenuKeyFromPath(location.pathname),
    [location.pathname],
  );

  // Get current dashboard style from location state
  const currentDashboardStyle = useMemo(
    () => (location.state as { style?: string })?.style || 'default',
    [location.state],
  );

  // Filter out dashboard from menu items since we'll render it separately
  const menuWithoutDashboard = useMemo(
    () => filteredMenu.filter(item => item.key !== 'dashboard'),
    [filteredMenu],
  );

  // Handle dashboard navigation with style variant
  const handleDashboardNavigation = (style: 'default' | 'alternative') => {
    navigate('/dashboard', { state: { style } });
  };

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelect = (item: MenuItem) => {
    if (!item.children) {
      // Special handling for database backup
      if (item.key === "database_backup" && onDatabaseBackup) {
        onDatabaseBackup();
        return;
      }

      // Navigate to the route
      const path = getPathFromMenuKey(item.key);
      navigate(path);
    } else {
      toggleMenu(item.key);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, item: MenuItem) => {
    e.preventDefault();
    
    // Only open in new tab if it's a leaf item (no children)
    if (!item.children) {
      // Skip database backup as it has special handling
      if (item.key === "database_backup") {
        return;
      }

      const path = getPathFromMenuKey(item.key);
      const fullUrl = `${window.location.origin}${path}`;
      window.open(fullUrl, "_blank");
    }
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const paddingClass = isOpen ? `pr-${4 + level * 4}` : '';
    const isMenuOpen = !!searchTerm || openMenus[item.key] || false;
    const hasChildren = !!item.children;
    const isActive = activeMenuKey === item.key;

    let styleClass = "";
    const isParentOpen = isMenuOpen && hasChildren;

    if (isActive && !hasChildren) {
      styleClass = "text-white bg-brand-green";
    } else if (isParentOpen) {
      styleClass = "text-white bg-brand-green";
    } else {
      styleClass = "text-gray-200 hover:bg-brand-green hover:text-white";
    }

    return (
      <div key={item.key}>
        <button
          onClick={() => handleSelect(item)}
          onContextMenu={(e) => handleContextMenu(e, item)}
          className={`w-full ${isOpen ? 'text-right flex justify-between items-center' : 'flex justify-center items-center'} py-2.5 ${isOpen ? 'px-4' : 'px-2'} text-sm font-medium rounded-md transition-colors duration-200 ${paddingClass} ${styleClass}`}
          title={!isOpen ? item.label : undefined}
        >
          <span className={`flex items-center ${isOpen ? '' : 'justify-center'}`}>
            <item.icon className={`w-5 h-5 ${isOpen ? 'ml-3' : ''}`} />
            {isOpen && item.label}
          </span>
          {isOpen && item.children && (
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
            />
          )}
        </button>
        {isOpen && item.children && isMenuOpen && (
          <div className="mt-1 space-y-1 bg-brand-green rounded-md p-2">
            {item.children.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-16'} bg-brand-blue text-white flex flex-col flex-shrink-0 transition-all duration-300`}>
      <div className={`h-16 flex items-center ${isOpen ? 'justify-center' : 'justify-center'} ${isOpen ? 'px-4' : 'px-2'} border-b border-blue-900 bg-brand-blue`}>
        <StockProLogo isOpen={isOpen} />
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto sidebar-scrollbar">
        {/* Dashboard Navigation Buttons - Side by Side */}
        {permissionSet.has('dashboard-read') && (
          <div className={`${isOpen ? 'flex gap-2' : 'flex flex-col gap-2'} mb-2`}>
            {/* First Button - Default Style (Classic View) */}
            <button
              onClick={() => handleDashboardNavigation('default')}
              className={`${isOpen ? 'flex-1' : 'w-full'} py-2.5 ${isOpen ? 'px-4' : 'px-2'} text-sm font-medium rounded-md transition-colors duration-200 flex items-center ${isOpen ? 'justify-center' : 'justify-center'} ${
                currentDashboardStyle === 'default' && location.pathname === '/dashboard'
                  ? 'text-white bg-brand-green'
                  : 'text-gray-200 hover:bg-brand-green hover:text-white'
              }`}
              title={!isOpen ? 'الرئيسية (كلاسيكي)' : undefined}
            >
              <span className="flex items-center">
                <HomeIcon className={`w-5 h-5 ${isOpen ? 'ml-2' : ''}`} />
                {isOpen && 'الرئيسية'}
              </span>
            </button>
            {/* Second Button - Alternative Style (Modern View) */}
            <button
              onClick={() => handleDashboardNavigation('alternative')}
              className={`${isOpen ? 'flex-1' : 'w-full'} py-2.5 ${isOpen ? 'px-4' : 'px-2'} text-sm font-medium rounded-md transition-colors duration-200 flex items-center ${isOpen ? 'justify-center' : 'justify-center'} ${
                currentDashboardStyle === 'alternative' && location.pathname === '/dashboard'
                  ? 'text-white bg-brand-green'
                  : 'text-gray-200 hover:bg-brand-green hover:text-white'
              }`}
              title={!isOpen ? 'الرئيسية (حديث)' : undefined}
            >
              <span className="flex items-center">
                <HomeIcon className={`w-5 h-5 ${isOpen ? 'ml-2' : ''}`} />
                {isOpen && 'الرئيسية'}
              </span>
            </button>
          </div>
        )}
        {menuWithoutDashboard.map((item) => renderMenuItem(item))}
      </nav>
      <div className={`${isOpen ? 'p-4' : 'p-2'} border-t border-blue-900 text-center text-xs text-gray-300`}>
        {isOpen ? (
          <>
            <p>StockPro &copy; 2024</p>
            <p>All rights reserved.</p>
          </>
        ) : (
          <p>&copy; 2024</p>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
