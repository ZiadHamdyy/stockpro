import type { PrintSettings } from '../types';

const STORAGE_KEY = 'printSettings';

/**
 * Save print settings to localStorage
 * @param settings - The print settings to save
 */
export const savePrintSettings = (settings: PrintSettings): void => {
  try {
    const serialized = JSON.stringify(settings);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save print settings to localStorage:', error);
  }
};

/**
 * Load print settings from localStorage
 * @returns The loaded print settings or null if not found/invalid
 */
export const loadPrintSettings = (): PrintSettings | null => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      return null;
    }
    const settings = JSON.parse(serialized) as PrintSettings;
    return settings;
  } catch (error) {
    console.error('Failed to load print settings from localStorage:', error);
    return null;
  }
};

/**
 * Clear print settings from localStorage
 */
export const clearPrintSettings = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear print settings from localStorage:', error);
  }
};

