import { MENU_ITEMS, ARABIC_TO_ENGLISH_ACTIONS } from '../constants';
import type { MenuItem } from '../types';

// Reverse mapping from English actions to Arabic
const ENGLISH_TO_ARABIC_ACTIONS: Record<string, string> = {
  read: 'قراءة',
  create: 'جديد',
  update: 'تعديل',
  delete: 'حذف',
  search: 'بحث',
  print: 'طباعة',
  post: 'ترحيل', // Additional action that might be used
};

/**
 * Recursively searches MENU_ITEMS to find a menu item by key
 */
function findMenuItemByKey(items: MenuItem[], key: string): MenuItem | null {
  for (const item of items) {
    if (item.key === key) {
      return item;
    }
    if (item.children) {
      const found = findMenuItemByKey(item.children, key);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * Translates a single permission key (e.g., "company_data:read") to Arabic
 * @param permission - Permission string in format "resource:action"
 * @returns Arabic translation of the permission (e.g., "قراءة بيانات الشركة")
 */
export function translatePermissionToArabic(permission: string): string {
  // Handle empty or invalid permissions
  if (!permission || typeof permission !== 'string') {
    return permission;
  }

  // Split permission into resource and action
  const parts = permission.split(':');
  if (parts.length !== 2) {
    // If format is incorrect, return as is
    return permission;
  }

  const [resource, action] = parts;

  // Find the resource label from MENU_ITEMS
  const menuItem = findMenuItemByKey(MENU_ITEMS, resource);
  const resourceLabel = menuItem?.label || resource;

  // Translate action to Arabic
  const actionLabel = ENGLISH_TO_ARABIC_ACTIONS[action] || action;

  // Combine: "قراءة بيانات الشركة"
  return `${actionLabel} ${resourceLabel}`;
}

/**
 * Translates an array of permission keys to Arabic
 * @param permissions - Array of permission strings in format "resource:action"
 * @returns Array of Arabic translations
 */
export function translatePermissionsToArabic(permissions: string[]): string[] {
  if (!Array.isArray(permissions)) {
    return [];
  }
  return permissions.map(translatePermissionToArabic);
}

