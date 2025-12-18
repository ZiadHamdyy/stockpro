import { Branch, SalesRecord } from '../types';

export const BRANCHES: Branch[] = [
  {
    id: 'branch1',
    name: 'الفرع الرئيسي',
    color: '#3b82f6', // blue
  },
  {
    id: 'branch2',
    name: 'فرع جدة',
    color: '#10b981', // emerald
  },
  {
    id: 'branch3',
    name: 'فرع الدمام',
    color: '#f59e0b', // amber
  },
];

const months = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// Generate sample sales data for 12 months
export const INITIAL_DATA: SalesRecord[] = months.map((monthName, index) => {
  const monthIndex = index + 1;
  const data: Record<string, number> = {};
  
  BRANCHES.forEach((branch, branchIndex) => {
    // Generate realistic sales data with some variation
    const baseSales = 500000 + (branchIndex * 100000);
    const variation = Math.random() * 200000 - 100000; // ±100k variation
    const seasonalFactor = 1 + Math.sin((monthIndex / 12) * Math.PI * 2) * 0.3; // Seasonal variation
    data[branch.id] = Math.round(baseSales * seasonalFactor + variation);
  });
  
  return {
    monthName,
    monthIndex,
    data,
  };
});

