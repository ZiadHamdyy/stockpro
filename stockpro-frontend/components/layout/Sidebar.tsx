import React, { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MENU_ITEMS } from "../../constants";
import type { MenuItem } from "../../types";
import { ChevronDownIcon } from "../icons";
import {
  getPathFromMenuKey,
  getMenuKeyFromPath,
} from "../../utils/menuPathMapper";

interface SidebarProps {
  searchTerm: string;
  userPermissions: string[];
  onDatabaseBackup?: () => void;
}

const StockProLogo: React.FC = () => (
  <div className="flex items-center gap-2">
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
    <span className="text-2xl font-bold text-white">StockPro</span>
  </div>
);

const filterByPermissions = (
  items: MenuItem[],
  permissions: string[],
): MenuItem[] => {
  if (permissions.includes("all")) {
    return items;
  }

  // Extract allowed keys from permissions (remove -action suffix)
  // Convert "dashboard-read" to "dashboard", "items_list-read" to "items_list", etc.
  const allowedKeys = new Set<string>();
  permissions.forEach((permission) => {
    const [resource] = permission.split("-");
    allowedKeys.add(resource);
  });

  // Helper function to check if any descendant has permission
  const hasAnyAllowedDescendant = (item: MenuItem): boolean => {
    if (allowedKeys.has(item.key)) {
      return true;
    }
    if (item.children) {
      return item.children.some((child) => hasAnyAllowedDescendant(child));
    }
    return false;
  };

  // Add parent keys for any allowed child (recursively)
  const addParents = (item: MenuItem) => {
    if (item.children) {
      item.children.forEach((child) => {
        if (hasAnyAllowedDescendant(child)) {
          allowedKeys.add(item.key);
        }
        addParents(child);
      });
    }
  };
  items.forEach(addParents);

  const recursiveFilter = (menuItems: MenuItem[]): MenuItem[] => {
    return menuItems
      .map((item) => {
        // If item has children, it's a grouping/parent item
        if (item.children) {
          const filteredChildren = recursiveFilter(item.children);
          
          // Show parent if it has filtered children or if it's explicitly allowed
          if (filteredChildren.length > 0 || allowedKeys.has(item.key)) {
            return { ...item, children: filteredChildren };
          }
          
          // Special case: For pure grouping/category items (items that only exist to organize other items),
          // show them even without permissions if they have children in the menu structure.
          // This handles cases like "financial_balances" which is just a category container.
          // Only apply this if the item itself is not clickable (no direct route mapped to it)
          // and it exists in the menu structure with children
          if (item.children.length > 0) {
            // Check if this is a grouping-only item (not directly clickable)
            // by checking if it has children that are also grouping items
            const hasGroupingChildren = item.children.some(
              (child) => child.children && child.children.length > 0,
            );
            
            if (hasGroupingChildren) {
              // For grouping items that contain other grouping items,
              // show all children (both grouping and leaf) without strict permission filtering
              // This preserves the menu structure for items like "financial_balances"
              const processedChildren = item.children.map((child) => {
                if (child.children && child.children.length > 0) {
                  // This child is also a grouping item
                  // Show all its children (both grouping and leaf) without permission checks
                  const allChildren = child.children.map((grandchild) => {
                    if (grandchild.children && grandchild.children.length > 0) {
                      // Grandchild is also grouping - process recursively but show structure
                      const grandchildFiltered = recursiveFilter(grandchild.children);
                      // If has filtered children, use them; otherwise show all original
                      return grandchildFiltered.length > 0
                        ? { ...grandchild, children: grandchildFiltered }
                        : grandchild;
                    } else {
                      // Grandchild is leaf - show it always (part of structure)
                      return grandchild;
                    }
                  }).filter((gc): gc is MenuItem => gc !== null);
                  
                  return { ...child, children: allChildren };
                } else {
                  // This child is a leaf item - show it always (part of structure)
                  return child;
                }
              }).filter((child): child is MenuItem => child !== null);
              
              // Show parent if it has at least one processed child
              if (processedChildren.length > 0) {
                return { ...item, children: processedChildren };
              }
            }
          }
          
          return null;
        }

        // If item has no children, it's a clickable leaf item
        // Only show it if it's explicitly allowed
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
  userPermissions,
  onDatabaseBackup,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    settings: true,
    reports: true,
  });

  const menuFilteredByPermissions = useMemo(
    () => filterByPermissions(MENU_ITEMS, userPermissions),
    [userPermissions],
  );
  const filteredMenu = useMemo(
    () => filterMenuItems(menuFilteredByPermissions, searchTerm),
    [searchTerm, menuFilteredByPermissions],
  );

  // Get current active menu key from path
  const activeMenuKey = useMemo(
    () => getMenuKeyFromPath(location.pathname),
    [location.pathname],
  );

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

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const paddingClass = `pr-${4 + level * 4}`;
    const isOpen = !!searchTerm || openMenus[item.key] || false;
    const hasChildren = !!item.children;
    const isActive = activeMenuKey === item.key;

    let styleClass = "";
    const isParentOpen = isOpen && hasChildren;

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
          className={`w-full text-right flex justify-between items-center py-2.5 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${paddingClass} ${styleClass}`}
        >
          <span className="flex items-center">
            <item.icon className="w-5 h-5 ml-3" />
            {item.label}
          </span>
          {item.children && (
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          )}
        </button>
        {item.children && isOpen && (
          <div className="mt-1 space-y-1 bg-brand-green rounded-md p-2">
            {item.children.map((child) => renderMenuItem(child, level + 1))}
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
        {filteredMenu.map((item) => renderMenuItem(item))}
      </nav>
      <div className="p-4 border-t border-blue-900 text-center text-xs text-gray-300">
        <p>StockPro &copy; 2024</p>
        <p>All rights reserved.</p>
      </div>
    </aside>
  );
};

export default Sidebar;
