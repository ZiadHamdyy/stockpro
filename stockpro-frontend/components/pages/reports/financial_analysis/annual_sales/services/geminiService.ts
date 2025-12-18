import { SalesRecord, Branch } from '../../types';

export async function analyzeSalesData(
  data: SalesRecord[],
  selectedBranches: string[],
  branches: Branch[]
): Promise<string> {
  // Calculate summary statistics
  const totalSales = data.reduce((acc, record) => {
    const monthTotal = selectedBranches.reduce((sum, branchId) => {
      return sum + (record.data[branchId] || 0);
    }, 0);
    return acc + monthTotal;
  }, 0);

  const averageMonthly = totalSales / data.length;
  
  const bestMonth = data.reduce((max, curr) => {
    const currTotal = selectedBranches.reduce((sum, branchId) => 
      sum + (curr.data[branchId] || 0), 0);
    const maxTotal = selectedBranches.reduce((sum, branchId) => 
      sum + (max.data[branchId] || 0), 0);
    return currTotal > maxTotal ? curr : max;
  }, data[0]);

  const worstMonth = data.reduce((min, curr) => {
    const currTotal = selectedBranches.reduce((sum, branchId) => 
      sum + (curr.data[branchId] || 0), 0);
    const minTotal = selectedBranches.reduce((sum, branchId) => 
      sum + (min.data[branchId] || 0), 0);
    return currTotal < minTotal ? curr : min;
  }, data[0]);

  const selectedBranchNames = branches
    .filter(b => selectedBranches.includes(b.id))
    .map(b => b.name)
    .join(' و ');

  // Generate analysis report in Arabic
  const analysis = `
📊 تحليل شامل لأداء المبيعات السنوية

**نظرة عامة:**
- إجمالي المبيعات السنوية: ${new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(totalSales)}
- متوسط المبيعات الشهرية: ${new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(averageMonthly)}
- الفروع المختارة: ${selectedBranchNames}

**أداء الفترات:**
- أفضل شهر أداءً: ${bestMonth.monthName} بمبيعات ${new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(
    selectedBranches.reduce((sum, branchId) => sum + (bestMonth.data[branchId] || 0), 0)
  )}
- أقل شهر أداءً: ${worstMonth.monthName} بمبيعات ${new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(
    selectedBranches.reduce((sum, branchId) => sum + (worstMonth.data[branchId] || 0), 0)
  )}

**التوصيات:**
1. التركيز على استراتيجيات التسويق خلال ${worstMonth.monthName} لتحسين الأداء
2. الاستفادة من نجاح ${bestMonth.monthName} وتطبيق نفس الاستراتيجيات على الفترات الأخرى
3. مراقبة الاتجاهات الشهرية لتحديد الأنماط الموسمية

**الخلاصة:**
يظهر التقرير أداءً ${totalSales > 6000000 ? 'قوياً' : 'مستقراً'} للمبيعات مع وجود فرص للتحسين في بعض الفترات.
  `.trim();

  return analysis;
}

