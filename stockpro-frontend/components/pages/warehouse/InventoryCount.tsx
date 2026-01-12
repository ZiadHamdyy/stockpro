
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { CompanyInfo } from '../../../types';
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon, BoxIcon, DollarSignIcon, DatabaseIcon, TrashIcon } from '../../icons';
import { useToast } from '../../common/ToastProvider';
import { useModal } from '../../common/ModalProvider';
import { formatNumber, exportToExcel, exportToPdf } from '../../../utils/formatting';
import { guardPrint } from '../../utils/printGuard';
import DataTableModal from '../../common/DataTableModal';
import PermissionWrapper from '../../common/PermissionWrapper';
import { Resources, Actions, buildPermission } from '../../../enums/permissions.enum';
import { useUserPermissions } from "../../hook/usePermissions";
import { useGetItemsQuery } from '../../store/slices/items/itemsApi';
import { useGetStoresQuery } from '../../store/slices/store/storeApi';
import { 
  useGetInventoryCountsQuery, 
  useCreateInventoryCountMutation, 
  useUpdateInventoryCountMutation,
  usePostInventoryCountMutation,
  useDeleteInventoryCountMutation,
  type InventoryCount as InventoryCountType,
  type InventoryCountItem as InventoryCountItemType
} from '../../store/slices/inventoryCount/inventoryCountApi';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/auth/auth';
import { useGetCompanyQuery } from '../../store/slices/companyApiSlice';
import type { User } from '../../store/slices/user/userApi';

interface InventoryCountProps {
    title: string;
    companyInfo: CompanyInfo;
}

// Helper function to get user's branch ID
const getUserBranchId = (user: User | null): string | null => {
    if (!user) return null;
    if (user.branchId) return user.branchId;
    const branch = (user as any)?.branch;
    if (typeof branch === "string") return branch;
    if (branch && typeof branch === "object") return branch.id || null;
    return null;
};

const InventoryCountPage: React.FC<InventoryCountProps> = ({ title, companyInfo }) => {
    const [countId, setCountId] = useState<string>('');
    const [countCode, setCountCode] = useState<string>('');
    const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
    const [selectedStoreId, setSelectedStoreId] = useState<string>('');
    const [countItems, setCountItems] = useState<InventoryCountItemType[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState<'PENDING' | 'POSTED'>('PENDING');
    const [varianceFilter, setVarianceFilter] = useState<'ALL' | 'SHORTAGE' | 'SURPLUS' | 'MATCHED'>('ALL');
    
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const { showToast } = useToast();
    const { showModal } = useModal();
    const currentUser = useAppSelector(selectCurrentUser);

    // Fetch company info from Redux
    const { data: companyInfoFromApi } = useGetCompanyQuery();
    const effectiveCompanyInfo = companyInfoFromApi || companyInfo;

    // Get permissions first (needed for conditional queries)
    const { hasPermission } = useUserPermissions();
    
    // Get user's branch ID
    const userBranchId = getUserBranchId(currentUser);
    
    // Check if user can search all branches
    const canSearchAllBranches = useMemo(
        () =>
            hasPermission(buildPermission(Resources.INVENTORY_COUNT, Actions.SEARCH)),
        [hasPermission],
    );

    // Fetch data from Redux
    const { data: allStores = [], isLoading: storesLoading } = useGetStoresQuery();
    
    // Filter stores by user's branch if user doesn't have permission
    const stores = useMemo(() => {
        if (canSearchAllBranches) return allStores;
        if (!userBranchId) return [];
        return allStores.filter((store: any) => store.branchId === userBranchId);
    }, [allStores, canSearchAllBranches, userBranchId]);
    
    const { data: items = [], isLoading: itemsLoading } = useGetItemsQuery(
        selectedStoreId ? { storeId: selectedStoreId } : undefined,
    );
    const { data: allInventoryCounts = [], isLoading: countsLoading } = useGetInventoryCountsQuery();
    
    // Filter inventory counts based on branch and search permission
    const inventoryCounts = useMemo(() => {
        return allInventoryCounts.filter((count: any) => {
            // Filter by current branch if user doesn't have SEARCH permission
            const countBranchId = count.store?.branch?.id;
            if (!canSearchAllBranches && userBranchId && countBranchId !== userBranchId) return false;
            
            return true;
        });
    }, [allInventoryCounts, canSearchAllBranches, userBranchId]);
    const [createInventoryCount, { isLoading: isCreating }] = useCreateInventoryCountMutation();
    const [postInventoryCount, { isLoading: isPosting }] = usePostInventoryCountMutation();
    const [updateInventoryCount, { isLoading: isUpdating }] = useUpdateInventoryCountMutation();
    const [deleteInventoryCount, { isLoading: isDeleting }] = useDeleteInventoryCountMutation();

    // Find user's store
    const userStore = useMemo(
        () => stores.find((store) => store.branchId === userBranchId),
        [stores, userBranchId],
    );
    const storeName = useMemo(() => {
        const store = stores.find((s) => s.id === selectedStoreId) || userStore;
        return store?.name || '';
    }, [stores, selectedStoreId, userStore]);

    // Set user's store as default when stores are loaded (new/unsaved)
    useEffect(() => {
        if (!userStore) return;
        if (countId) return; // don't override when viewing saved count
        if (!selectedStoreId || selectedStoreId !== userStore.id) {
            setSelectedStoreId(userStore.id);
            setCountItems([]); // reset items to reload for current store
        }
    }, [userStore, selectedStoreId, countId]);

    // Initialize new count
    const initializeCount = useCallback(() => {
        // Reset to user's store when creating new count
        if (!userStore) return;
        if (selectedStoreId !== userStore.id) {
            setSelectedStoreId(userStore.id);
            setCountItems([]);
            return; // Will re-run when store changes and items load
        }

        if (!selectedStoreId || items.length === 0) return;

        setCountId('');
        setCountCode('');
        setNotes('');
        setStatus('PENDING');
        setDate(new Date().toISOString().substring(0, 10));
        
        // Initialize count items with system stock from store (items fetched with storeId have store stock)
        // Filter out SERVICE items - only include STOCKED items
        const stockedItems = items.filter(item => item.type === 'STOCKED');
        const initialCountItems: InventoryCountItemType[] = stockedItems.map(item => ({
            id: '', // Will be set when saved
            systemStock: item.stock || 0, // This is store-specific stock when storeId is provided
            actualStock: undefined as any, // Empty by default for manual entry
            difference: 0, // Difference will be 0 initially when actualStock is empty
            cost: item.purchasePrice,
            item: item,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }));
        setCountItems(initialCountItems);
    }, [userStore, selectedStoreId, items]);

    useEffect(() => {
        // Initialize when store or items change (only if no count is loaded)
        // Only initialize if there are stocked items (not just any items)
        const stockedItems = items.filter(item => item.type === 'STOCKED');
        if (selectedStoreId && stockedItems.length > 0 && countItems.length === 0 && !countId) {
            initializeCount();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedStoreId, items, countId, initializeCount]);

    const handleActualChange = (itemId: string, val: string) => {
        if (status === 'POSTED') return; // Read-only if posted

        // If value is empty, set actualStock to undefined
        if (val === '' || val === null || val === undefined) {
            setCountItems(prev => prev.map(item => {
                if (item.item.id === itemId) {
                    return { ...item, actualStock: undefined as any, difference: 0 };
                }
                return item;
            }));
            return;
        }

        const actual = parseFloat(val);
        if (isNaN(actual)) return;

        setCountItems(prev => prev.map(item => {
            if (item.item.id === itemId) {
                const difference = actual - item.systemStock;
                return { ...item, actualStock: actual, difference };
            }
            return item;
        }));
    };

    const filteredItems = useMemo(() => {
        return countItems.filter(item => {
            // Filter by search term
            const matchesSearch = item.item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                item.item.code.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (!matchesSearch) return false;
            
            // Filter by variance type (only if actualStock is defined)
            const hasActualStock = item.actualStock !== undefined && item.actualStock !== null;
            
            if (varianceFilter === 'ALL') return true;
            if (!hasActualStock) return false; // Items without actual stock are excluded from variance filters
            
            if (varianceFilter === 'SHORTAGE') return item.difference < 0;
            if (varianceFilter === 'SURPLUS') return item.difference > 0;
            if (varianceFilter === 'MATCHED') return item.difference === 0;
            
            return true;
        });
    }, [countItems, searchTerm, varianceFilter]);

    // Check if there are printable items
    const hasPrintableItems = useMemo(
        () => filteredItems.length > 0,
        [filteredItems]
    );

    // Check if we can print (only if count is saved)
    const canPrintExistingCount = useMemo(
        () => Boolean(countId) && hasPrintableItems,
        [countId, hasPrintableItems]
    );

    // Calculate Totals
    const stats = useMemo(() => {
        let totalSurplusVal = 0;
        let totalShortageVal = 0;
        let surplusCount = 0;
        let shortageCount = 0;

        filteredItems.forEach(item => {
            // Only calculate if actualStock is defined
            if (item.actualStock !== undefined && item.actualStock !== null) {
                const varianceValue = item.difference * item.cost;
                if (item.difference > 0) {
                    totalSurplusVal += varianceValue;
                    surplusCount++;
                } else if (item.difference < 0) {
                    totalShortageVal += Math.abs(varianceValue);
                    shortageCount++;
                }
            }
        });

        return {
            totalItems: filteredItems.length,
            surplusCount,
            shortageCount,
            totalSurplusValue: totalSurplusVal,
            totalShortageValue: totalShortageVal,
            netSettlementValue: totalSurplusVal - totalShortageVal
        };
    }, [filteredItems]);

    const handleSaveDraft = async () => {
        if (!selectedStoreId || !currentUser?.id) {
            showToast('يرجى اختيار المخزن والمستخدم', 'error');
            return;
        }

        try {
            if (countId) {
                // Update existing draft
                const updated = await updateInventoryCount({
                    id: countId,
                    data: {
                        storeId: selectedStoreId,
                        userId: currentUser.id,
                        branchId: userBranchId || currentUser.branchId || null,
                        date,
                        notes,
                        items: countItems.map(item => ({
                            itemId: item.item.id,
                            systemStock: item.systemStock,
                            actualStock: item.actualStock,
                            difference: item.difference,
                            cost: item.cost,
                        })),
                    }
                }).unwrap();

                setCountCode(updated.code);
                setCountItems(updated.items);
                setStatus('PENDING');
                showToast('تم تحديث الجرد كمسودة بنجاح.');
            } else {
                // Create new draft
                const result = await createInventoryCount({
                    storeId: selectedStoreId,
                    userId: currentUser.id,
                    branchId: userBranchId || currentUser.branchId || null,
                    date,
                    notes,
                    items: countItems.map(item => ({
                        itemId: item.item.id,
                        systemStock: item.systemStock,
                        actualStock: item.actualStock,
                        difference: item.difference,
                        cost: item.cost,
                    })),
                }).unwrap();

                setCountId(result.id);
                setCountCode(result.code);
                setStatus('PENDING');
                showToast('تم حفظ الجرد كمسودة بنجاح.');
            }
        } catch (error: any) {
            showToast(error?.data?.message || 'حدث خطأ أثناء حفظ الجرد', 'error');
        }
    };

    const handlePostSettlement = () => {
        const changedItems = countItems.filter(i => i.difference !== 0);
        const message = changedItems.length === 0 
            ? "لا يوجد فروقات في الجرد. سيتم اعتماد الجرد كمطابق. هل أنت متأكد؟"
            : `يوجد فروقات في ${changedItems.length} صنف بقيمة صافية ${formatNumber(stats.netSettlementValue)}. سيتم اعتماد الجرد وإنشاء أذونات تسوية تلقائياً. لا يمكن التراجع عن هذا الإجراء.`;

        showModal({
            title: 'اعتماد التسوية النهائية',
            message: message,
            onConfirm: async () => {
                try {
                    let finalCountId = countId;
                    
                    // If not saved yet, save first as draft
                    if (!finalCountId) {
                        const result = await createInventoryCount({
                            storeId: selectedStoreId,
                            userId: currentUser!.id,
                            branchId: userBranchId || currentUser!.branchId || null,
                            date,
                            notes,
                            items: countItems.map(item => ({
                                itemId: item.item.id,
                                systemStock: item.systemStock,
                                actualStock: item.actualStock,
                                difference: item.difference,
                                cost: item.cost,
                            })),
                        }).unwrap();
                        
                        finalCountId = result.id;
                        setCountId(result.id);
                        setCountCode(result.code);
                    } else {
                        // Update existing draft before posting to ensure latest edits are saved
                        const updated = await updateInventoryCount({
                            id: finalCountId,
                            data: {
                                storeId: selectedStoreId,
                                userId: currentUser!.id,
                                branchId: userBranchId || currentUser!.branchId || null,
                                date,
                                notes,
                                items: countItems.map(item => ({
                                    itemId: item.item.id,
                                    systemStock: item.systemStock,
                                    actualStock: item.actualStock,
                                    difference: item.difference,
                                    cost: item.cost,
                                })),
                            }
                        }).unwrap();

                        setCountCode(updated.code);
                        setCountItems(updated.items);
                    }
                    
                    // Now post the count
                    const postedCount = await postInventoryCount(finalCountId).unwrap();
                    setStatus('POSTED');
                    setCountCode(postedCount.code);
                    showToast('تم اعتماد الجرد وإنشاء قيود التسوية بنجاح.');
                } catch (error: any) {
                    showToast(error?.data?.message || 'حدث خطأ أثناء اعتماد الجرد', 'error');
                }
            },
            type: 'edit',
            showPassword: true
        });
    };

    const loadHistoricalCount = (row: any) => {
        const count = inventoryCounts.find(c => c.id === row.id);
        if (count) {
            setCountId(count.id);
            setCountCode(count.code);
            setDate(count.date.substring(0, 10));
            setSelectedStoreId(count.store.id);
            setNotes(count.notes || '');
            setCountItems(count.items);
            setStatus(count.status);
            setIsHistoryOpen(false);
            showToast(`تم تحميل سجل الجرد رقم ${count.code}`);
        }
    };

    const handleDelete = () => {
        if (!countId) return;

        showModal({
            title: 'حذف المسودة',
            message: `هل أنت متأكد من حذف الجرد رقم ${countCode || countId}؟\nلا يمكن التراجع عن هذا الإجراء.`,
            onConfirm: async () => {
                try {
                    await deleteInventoryCount(countId).unwrap();
                    // Reset form after successful deletion
                    setCountId('');
                    setCountCode('');
                    setCountItems([]);
                    setNotes('');
                    setStatus('PENDING');
                    setDate(new Date().toISOString().substring(0, 10));
                    setSelectedStoreId(userStore?.id || '');
                    showToast('تم حذف الجرد بنجاح.');
                } catch (error: any) {
                    showToast(error?.data?.message || 'حدث خطأ أثناء حذف الجرد', 'error');
                }
            },
            type: 'delete',
            showPassword: false
        });
    };

    const handleExcelExport = () => {
        if (!canPrintExistingCount) {
            showToast("لا يمكن التصدير إلا بعد حفظ الجرد.", "error");
            return;
        }

        const selectedStore = stores.find(s => s.id === selectedStoreId);
        const data = filteredItems.map((item, index) => ({
            'م': index + 1,
            'كود الصنف': item.item.code,
            'اسم الصنف': item.item.name,
            'الوحدة': item.item.unit.name,
            'الرصيد الدفتري': item.systemStock,
            'الرصيد الفعلي': item.actualStock !== undefined && item.actualStock !== null ? item.actualStock : '',
            'الفرق': item.actualStock !== undefined && item.actualStock !== null ? item.difference : '',
            'الحالة': item.actualStock !== undefined && item.actualStock !== null 
                ? (item.difference > 0 ? 'زيادة' : (item.difference < 0 ? 'عجز' : 'مطابق'))
                : '',
            'سعر التكلفة': item.cost,
            'قيمة الفرق': item.actualStock !== undefined && item.actualStock !== null 
                ? (item.difference * item.cost).toFixed(2)
                : ''
        }));
        exportToExcel(data, `جرد_مخزون_${selectedStore?.name || 'مخزن'}_${date}`);
    };

    const handlePdfExport = () => {
        if (!canPrintExistingCount) {
            showToast("لا يمكن التصدير إلا بعد حفظ الجرد.", "error");
            return;
        }

        const selectedStore = stores.find(s => s.id === selectedStoreId);
        const head = [['قيمة الفرق', 'سعر التكلفة', 'الحالة', 'الفرق', 'الرصيد الفعلي', 'الرصيد الدفتري', 'الوحدة', 'اسم الصنف', 'كود الصنف', 'م']];
        const body = filteredItems.map((item, index) => [
            item.actualStock !== undefined && item.actualStock !== null 
                ? (item.difference * item.cost).toFixed(2)
                : '',
            item.cost.toFixed(2),
            item.actualStock !== undefined && item.actualStock !== null
                ? (item.difference !== 0 ? (item.difference > 0 ? 'زيادة' : 'عجز') : 'مطابق')
                : '',
            item.actualStock !== undefined && item.actualStock !== null 
                ? item.difference.toString()
                : '',
            item.actualStock !== undefined && item.actualStock !== null 
                ? item.actualStock.toString()
                : '',
            item.systemStock.toString(),
            item.item.unit.name,
            item.item.name,
            item.item.code,
            (index + 1).toString()
        ]);
        
        const footer = [
            ['', '', '', '', '', '', '', '', 'إجمالي الزيادة', formatNumber(stats.totalSurplusValue)],
            ['', '', '', '', '', '', '', '', 'إجمالي العجز', formatNumber(stats.totalShortageValue)],
            ['', '', '', '', '', '', '', '', 'صافي التسوية', formatNumber(stats.netSettlementValue)],
        ];

        exportToPdf(`تقرير جرد مخزن ${selectedStore?.name || 'مخزن'}`, head, body, `جرد_${date}`, effectiveCompanyInfo, footer);
    };

    const handlePrint = () => {
        if (!canPrintExistingCount) {
            showToast("لا يمكن الطباعة إلا بعد حفظ الجرد.", "error");
            return;
        }

        guardPrint({
            hasData: hasPrintableItems,
            showToast,
            onAllowed: () => {
                const selectedStore = stores.find(s => s.id === selectedStoreId);
                
                const printWindow = window.open('', '', 'height=800,width=900');
                if (!printWindow) return;
        
        // Build table rows manually to ensure all data is included
        const tableRows = filteredItems.map((item, index) => {
            const hasActualStock = item.actualStock !== undefined && item.actualStock !== null;
            const varianceValue = hasActualStock ? item.difference * item.cost : 0;
            const statusText = hasActualStock 
                ? (item.difference === 0 ? 'مطابق' : item.difference < 0 ? 'عجز' : 'زيادة')
                : '';
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.item.code}</td>
                    <td>${item.item.name}</td>
                    <td>${item.item.unit.name}</td>
                    <td>${item.systemStock}</td>
                    <td>${hasActualStock ? item.actualStock : ''}</td>
                    <td>${hasActualStock ? (item.difference > 0 ? '+' : '') + item.difference : ''}</td>
                    <td>${statusText}</td>
                    <td>${formatNumber(item.cost)}</td>
                    <td>${hasActualStock ? formatNumber(varianceValue) : ''}</td>
                </tr>
            `;
        }).join('');
        
        printWindow.document.write('<html><head><title>طباعة الجرد</title>');
        printWindow.document.write('<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">');
        printWindow.document.write(`
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: "Cairo", sans-serif; 
                    direction: rtl; 
                    font-size: 12px; 
                    padding: 15px;
                }
                .header { margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #1E40AF; }
                .header-content { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
                .header-left { flex: 1; text-align: right; }
                .header-right { flex: 1; text-align: left; }
                .header img { height: 60px; margin-bottom: 8px; }
                .header h1 { font-size: 28px; font-weight: bold; margin-bottom: 5px; color: #1E40AF; }
                .header h2 { font-size: 20px; font-weight: bold; margin-bottom: 5px; color: #1F2937; }
                .header p { font-size: 11px; color: #666; margin: 2px 0; }
                .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
                .info-box { border: 1px solid #D1D5DB; border-radius: 4px; padding: 12px; background-color: #FAFAFA; }
                .info-box h3 { font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #1F2937; }
                .info-box p { font-size: 12px; margin: 4px 0; }
                .table-container { overflow-x: auto; margin: 15px 0; }
                table { width: 95%; border-collapse: collapse; margin: 0 auto; font-size: 10px; }
                th { background-color: #1E40AF !important; color: white !important; padding: 8px 4px; text-align: center; border: 1px solid #1E3A8A; font-size: 10px; font-weight: bold; }
                td { padding: 6px 4px; text-align: center; border: 1px solid #E5E7EB; font-size: 10px; }
                .notes { margin: 15px auto; padding: 10px; background-color: #FFF9E6; border-right: 3px solid #F59E0B; border-radius: 4px; width: 95%; text-align: right; }
                .notes-title { font-weight: bold; color: #92400E; margin-bottom: 5px; font-size: 11px; }
                .notes-content { color: #78350F; font-size: 11px; }
                .summary { margin-top: 15px; padding: 12px; background-color: #F9FAFB; border-radius: 8px; width: 95%; margin-left: auto; margin-right: auto; }
                .summary-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #E5E7EB; }
                .summary-row:last-child { border-bottom: none; font-weight: bold; font-size: 14px; }
                @media print {
                    @page { size: A4 portrait; margin: 0.8cm; }
                    body { 
                        -webkit-print-color-adjust: exact !important; 
                        color-adjust: exact !important; 
                        print-color-adjust: exact !important;
                        padding: 10px;
                    }
                    .no-print { display: none !important; }
                    table { width: 95% !important; border-collapse: collapse; font-size: 9px !important; }
                    th { font-size: 9px !important; font-weight: bold !important; background-color: #1E40AF !important; color: white !important; padding: 6px 3px !important; }
                    td { font-size: 9px !important; padding: 5px 3px !important; }
                    .header h1 { font-size: 24px !important; }
                    .header h2 { font-size: 18px !important; }
                    .header p { font-size: 10px !important; }
                    .info-box { padding: 8px !important; }
                    .info-box h3 { font-size: 12px !important; }
                    .info-box p { font-size: 10px !important; }
                }
            </style>
        `);
        printWindow.document.write('</head><body dir="rtl">');
        
        // Get branch and user information
        const branchName = selectedStore?.branch?.name || 'غير محدد';
        const userName = currentUser?.name || currentUser?.fullName || 'غير محدد';
        
        printWindow.document.write(`
            <div class="header">
                <div class="header-content">
                    <div class="header-left">
                        ${effectiveCompanyInfo?.logo ? `<img src="${effectiveCompanyInfo.logo}" alt="Company Logo" style="height: 60px; margin-bottom: 8px;" />` : ''}
                        <h2>${effectiveCompanyInfo?.name || 'اسم الشركة'}</h2>
                        ${effectiveCompanyInfo?.address ? `<p>${effectiveCompanyInfo.address}</p>` : ''}
                        ${effectiveCompanyInfo?.phone ? `<p>هاتف: ${effectiveCompanyInfo.phone}</p>` : ''}
                        ${effectiveCompanyInfo?.taxNumber ? `<p>الرقم الضريبي: ${effectiveCompanyInfo.taxNumber}</p>` : ''}
                        ${effectiveCompanyInfo?.commercialReg ? `<p>السجل التجاري: ${effectiveCompanyInfo.commercialReg}</p>` : ''}
                    </div>
                    <div class="header-right">
                        <h1 style="font-size: 28px; font-weight: bold; color: #1E40AF; margin-bottom: 5px;">${title}</h1>
                        <p style="font-size: 12px; color: #666;">Inventory Count Report</p>
                    </div>
                </div>
                <div class="info-section">
                    <div class="info-box">
                        <h3>بيانات الجرد:</h3>
                        <p><span style="font-weight: bold;">رقم الجرد:</span> ${countCode || 'غير محدد'}</p>
                        <p><span style="font-weight: bold;">التاريخ:</span> ${date}</p>
                        <p><span style="font-weight: bold;">المخزن:</span> ${selectedStore?.name || 'مخزن'}</p>
                        ${status === 'POSTED' ? '<p><span style="font-weight: bold;">الحالة:</span> معتمد (مرحل)</p>' : '<p><span style="font-weight: bold;">الحالة:</span> مسودة</p>'}
                    </div>
                    <div class="info-box">
                        <h3>معلومات إضافية:</h3>
                        <p><span style="font-weight: bold;">الفرع:</span> ${branchName}</p>
                        <p><span style="font-weight: bold;">الموظف:</span> ${userName}</p>
                        ${notes && notes.trim() ? `<p><span style="font-weight: bold;">ملاحظات:</span> ${notes}</p>` : ''}
                    </div>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>م</th>
                            <th>الكود</th>
                            <th>اسم الصنف</th>
                            <th>الوحدة</th>
                            <th>الرصيد الدفتري</th>
                            <th>الرصيد الفعلي</th>
                            <th>الفرق</th>
                            <th>الحالة</th>
                            <th>السعر</th>
                            <th>قيمة الفرق</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows || '<tr><td colspan="10" style="text-align: center; padding: 20px;">لا توجد بيانات</td></tr>'}
                    </tbody>
                </table>
            </div>
            <div class="summary">
                <div class="summary-row">
                    <span>إجمالي الزيادة:</span>
                    <span>${formatNumber(stats.totalSurplusValue)} SAR</span>
                </div>
                <div class="summary-row">
                    <span>إجمالي العجز:</span>
                    <span>${formatNumber(stats.totalShortageValue)} SAR</span>
                </div>
                <div class="summary-row">
                    <span>صافي التسوية:</span>
                    <span>${formatNumber(stats.netSettlementValue)} SAR</span>
                </div>
            </div>
        `);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 500);
            },
        });
    };

    const inputStyle = "w-full p-2 bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:bg-gray-200 disabled:cursor-not-allowed";

    const selectedStore = stores.find(s => s.id === selectedStoreId);
    const isLoading = itemsLoading || storesLoading || countsLoading;

    if (isLoading) {
        return <div className="flex justify-center items-center h-full">جاري التحميل...</div>;
    }

    return (
        <div className="flex flex-col h-full space-y-4 pr-2">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-lg shadow flex-shrink-0">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div className="flex items-center gap-4">
                        {effectiveCompanyInfo?.logo && <img src={effectiveCompanyInfo.logo} alt="Logo" className="h-14 w-auto" />}
                        <div>
                            <h1 className="text-2xl font-bold text-brand-dark">{title}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 text-xs rounded-full ${status === 'POSTED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {status === 'POSTED' ? 'معتمد (مرحل)' : 'مسودة (قيد العمل)'}
                                </span>
                                <p className="text-sm text-gray-500">{countCode || countId || 'جرد جديد'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                            <button onClick={() => setIsHistoryOpen(true)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-2 border border-gray-300 font-medium">
                                <DatabaseIcon className="w-5 h-5"/>
                                <span>سجل الجرد</span>
                            </button>
                        <PermissionWrapper
                            requiredPermission={buildPermission(
                                Resources.INVENTORY_COUNT,
                                Actions.CREATE
                            )}
                        >
                            <button onClick={initializeCount} className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-medium">جرد جديد</button>
                        </PermissionWrapper>
                        {status === 'PENDING' && countId && (
                            <PermissionWrapper
                                requiredPermission={buildPermission(
                                    Resources.INVENTORY_COUNT,
                                    Actions.DELETE
                                )}
                            >
                                <button 
                                    onClick={handleDelete} 
                                    disabled={isDeleting}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="حذف المسودة"
                                >
                                    <TrashIcon className="w-5 h-5"/>
                                    <span>{isDeleting ? 'جاري الحذف...' : 'حذف المسودة'}</span>
                                </button>
                            </PermissionWrapper>
                        )}
                        <PermissionWrapper
                            requiredPermission={buildPermission(
                                Resources.INVENTORY_COUNT,
                                Actions.PRINT,
                            )}
                            fallback={
                                <div className="no-print flex items-center gap-2">
                                    <button
                                        title="تصدير Excel"
                                        disabled
                                        className="p-3 border-2 border-gray-200 rounded-md cursor-not-allowed opacity-50"
                                    >
                                        <ExcelIcon className="w-6 h-6" />
                                    </button>
                                    <button
                                        title="تصدير PDF"
                                        disabled
                                        className="p-3 border-2 border-gray-200 rounded-md cursor-not-allowed opacity-50"
                                    >
                                        <PdfIcon className="w-6 h-6" />
                                    </button>
                                    <button
                                        title="طباعة"
                                        disabled
                                        className="p-3 border-2 border-gray-200 rounded-md cursor-not-allowed opacity-50"
                                    >
                                        <PrintIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            }
                        >
                            <div className="no-print flex items-center gap-2">
                                <button
                                    onClick={handleExcelExport}
                                    disabled={!canPrintExistingCount}
                                    title={!canPrintExistingCount ? "يجب حفظ الجرد أولاً" : "تصدير Excel"}
                                    className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ExcelIcon className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={handlePdfExport}
                                    disabled={!canPrintExistingCount}
                                    title={!canPrintExistingCount ? "يجب حفظ الجرد أولاً" : "تصدير PDF"}
                                    className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <PdfIcon className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={handlePrint}
                                    disabled={!canPrintExistingCount}
                                    title={!canPrintExistingCount ? "يجب حفظ الجرد أولاً" : "طباعة"}
                                    className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <PrintIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </PermissionWrapper>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">تاريخ الجرد</label>
                        <PermissionWrapper
                            requiredPermission={buildPermission(
                                Resources.INVENTORY_COUNT,
                                Actions.UPDATE
                            )}
                            fallback={
                                <input type="date" value={date} className={inputStyle} disabled readOnly />
                            }
                        >
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputStyle} disabled={status === 'POSTED'} />
                        </PermissionWrapper>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">المخزن</label>
                        <input
                            type="text"
                            className={inputStyle}
                            value={storeName || (userStore ? userStore.name : '')}
                            readOnly
                            disabled
                            title="المخزن الحالي الخاص بفرعك"
                        />
                    </div>
                    <div className="hidden print:block">
                        <label className="block text-sm font-bold text-gray-700 mb-1">الموظف</label>
                        <input 
                            type="text" 
                            value={currentUser?.name || currentUser?.fullName || ""} 
                            className={inputStyle + " bg-gray-200"} 
                            readOnly 
                            disabled 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">ملاحظات</label>
                        <PermissionWrapper
                            requiredPermission={buildPermission(
                                Resources.INVENTORY_COUNT,
                                Actions.UPDATE
                            )}
                            fallback={
                                <input type="text" value={notes} className={inputStyle} placeholder="ملاحظات عامة على الجرد" disabled readOnly />
                            }
                        >
                            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputStyle} placeholder="ملاحظات عامة على الجرد" disabled={status === 'POSTED'} />
                        </PermissionWrapper>
                    </div>
                </div>
            </div>

            {/* Search & Stats Summary Bar */}
            <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center gap-4 flex-shrink-0">
                <div className="relative flex-1">
                    <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="بحث بكود أو اسم الصنف..." 
                        className={inputStyle + " pr-10"} 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {/* Variance Filter Buttons */}
                <div className="flex gap-2">
                    {[
                        { value: 'ALL' as const, label: 'الكل', color: 'bg-blue-600', shadowColor: 'shadow-blue-200' },
                        { value: 'SHORTAGE' as const, label: 'عجز', color: 'bg-red-600', shadowColor: 'shadow-red-200' },
                        { value: 'SURPLUS' as const, label: 'زيادة', color: 'bg-green-600', shadowColor: 'shadow-green-200' },
                        { value: 'MATCHED' as const, label: 'مطابق', color: 'bg-gray-600', shadowColor: 'shadow-gray-200' },
                    ].map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => setVarianceFilter(filter.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                varianceFilter === filter.value 
                                    ? `${filter.color} text-white shadow-lg ${filter.shadowColor}` 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
                
                <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-full text-blue-600"><BoxIcon className="w-4 h-4"/></div>
                        <div>
                            <p className="text-gray-500 text-xs">إجمالي الأصناف</p>
                            <p className="font-bold">{stats.totalItems}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div id="inventory-count-print-area" className="bg-white rounded-lg shadow overflow-hidden flex-grow flex flex-col min-h-[60vh]">
                <div className="overflow-auto flex-grow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-brand-blue text-white sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-center text-sm font-semibold w-16 border-l border-blue-400">م</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold w-32 border-l border-blue-400">الكود</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold border-l border-blue-400">اسم الصنف</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold w-20 border-l border-blue-400">الوحدة</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold bg-blue-900 w-24 border-l border-blue-400">الرصيد الدفتري</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold bg-green-700 w-32 border-l border-blue-400">الرصيد الفعلي</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold w-24 border-l border-blue-400">الفرق</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold w-24 border-l border-blue-400">الحالة</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold w-24 bg-gray-600 border-l border-gray-500">السعر</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold w-32 bg-gray-700">قيمة الفرق</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                                        {selectedStoreId ? 'لا توجد أصناف في هذا المخزن' : 'يرجى اختيار مخزن'}
                                    </td>
                                </tr>
                            ) : filteredItems.map((item, index) => {
                                const hasActualStock = item.actualStock !== undefined && item.actualStock !== null;
                                const varianceValue = hasActualStock ? item.difference * item.cost : 0;
                                return (
                                    <tr key={item.item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-center text-sm text-gray-500">{index + 1}</td>
                                        <td className="px-4 py-2 text-sm text-gray-700 font-mono">{item.item.code}</td>
                                        <td className="px-4 py-2 text-sm font-medium text-brand-dark">{item.item.name}</td>
                                        <td className="px-4 py-2 text-center text-sm text-gray-500">{item.item.unit.name}</td>
                                        <td className="px-4 py-2 text-center text-sm font-bold bg-blue-50 text-blue-900">{item.systemStock}</td>
                                        <td className="px-4 py-2 text-center">
                                            <PermissionWrapper
                                                requiredPermission={buildPermission(
                                                    Resources.INVENTORY_COUNT,
                                                    Actions.UPDATE
                                                )}
                                                fallback={
                                                    <input 
                                                        type="text" 
                                                        value={
                                                            typeof item.actualStock === "string"
                                                              ? item.actualStock
                                                              : item.actualStock !== undefined && item.actualStock !== null
                                                              ? item.actualStock
                                                              : ""
                                                        }
                                                        className="w-24 p-1.5 text-center border border-gray-300 rounded bg-gray-100 font-bold text-gray-500 shadow-inner cursor-not-allowed"
                                                        disabled
                                                        readOnly
                                                        placeholder=""
                                                    />
                                                }
                                            >
                                                <input 
                                                    type="text" 
                                                    value={
                                                        typeof item.actualStock === "string"
                                                          ? item.actualStock
                                                          : item.actualStock !== undefined && item.actualStock !== null
                                                          ? item.actualStock
                                                          : ""
                                                    }
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        // Allow empty string, decimal numbers (including partial inputs like "12." or ".5")
                                                        if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
                                                            handleActualChange(item.item.id, value);
                                                        }
                                                    }}
                                                    className="w-24 p-1.5 text-center border border-gray-300 rounded bg-white focus:ring-2 focus:ring-brand-green focus:border-brand-green font-bold text-gray-900 shadow-inner"
                                                    onFocus={(e) => e.target.select()}
                                                    disabled={status === 'POSTED'}
                                                    placeholder=""
                                                    inputMode="decimal"
                                                />
                                            </PermissionWrapper>
                                        </td>
                                        <td className={`px-4 py-2 text-center font-bold text-sm ${item.actualStock !== undefined && item.actualStock !== null ? (item.difference < 0 ? 'text-red-600' : item.difference > 0 ? 'text-green-600' : 'text-gray-400') : 'text-gray-400'}`}>
                                            {item.actualStock !== undefined && item.actualStock !== null 
                                                ? (item.difference > 0 ? '+' : '') + item.difference.toFixed(2)
                                                : ''}
                                        </td>
                                        <td className="px-4 py-2 text-center text-xs">
                                            {item.actualStock !== undefined && item.actualStock !== null && (
                                                <>
                                                    {item.difference === 0 && <span className="px-2 py-1 bg-gray-100 rounded-full text-gray-600 border border-gray-200">مطابق</span>}
                                                    {item.difference < 0 && <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full border border-red-200">عجز</span>}
                                                    {item.difference > 0 && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full border border-green-200">زيادة</span>}
                                                </>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-center text-sm text-gray-600 bg-gray-50">{formatNumber(item.cost)}</td>
                                        <td className={`px-4 py-2 text-center font-bold text-sm bg-gray-50 ${item.actualStock !== undefined && item.actualStock !== null ? (varianceValue < 0 ? 'text-red-600' : varianceValue > 0 ? 'text-green-600' : 'text-gray-400') : 'text-gray-400'}`}>
                                            {item.actualStock !== undefined && item.actualStock !== null 
                                                ? formatNumber(varianceValue)
                                                : ''}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Totals Section */}
            <div className="bg-white p-4 rounded-lg shadow border-t-4 border-brand-blue flex-shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    
                    {/* Total Surplus Card */}
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex flex-col relative overflow-hidden">
                        <div className="flex justify-between items-start z-10">
                            <div>
                                <p className="text-green-800 text-xs font-bold mb-1">إجمالي الزيادة</p>
                                <p className="text-xs text-green-600 font-semibold mb-1">عدد الأصناف: {stats.surplusCount}</p>
                                <p className="text-xl font-bold text-green-700">{formatNumber(stats.totalSurplusValue)} <span className="text-xs">SAR</span></p>
                            </div>
                            <div className="p-2 bg-green-200 rounded-full text-green-700"><DollarSignIcon className="w-5 h-5"/></div>
                        </div>
                    </div>

                    {/* Total Shortage Card */}
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200 flex flex-col relative overflow-hidden">
                        <div className="flex justify-between items-start z-10">
                            <div>
                                <p className="text-red-800 text-xs font-bold mb-1">إجمالي العجز</p>
                                <p className="text-xs text-red-600 font-semibold mb-1">عدد الأصناف: {stats.shortageCount}</p>
                                <p className="text-xl font-bold text-red-700">{formatNumber(stats.totalShortageValue)} <span className="text-xs">SAR</span></p>
                            </div>
                            <div className="p-2 bg-red-200 rounded-full text-red-700"><DollarSignIcon className="w-5 h-5"/></div>
                        </div>
                    </div>

                    {/* Net Value Card */}
                    <div className={`p-3 rounded-lg border flex justify-between items-center h-full ${stats.netSettlementValue >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                        <div className="flex flex-col justify-center h-full">
                            <p className="text-gray-800 text-sm font-bold mb-2">صافي قيمة التسوية</p>
                            <p className={`text-2xl font-bold ${stats.netSettlementValue >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatNumber(stats.netSettlementValue)} <span className="text-sm">SAR</span></p>
                        </div>
                        <div className="p-2 bg-white rounded-full shadow-sm text-gray-700 font-bold text-xl">=</div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                        <PermissionWrapper
                            requiredPermission={buildPermission(
                                Resources.INVENTORY_COUNT,
                                Actions.CREATE
                            )}
                            fallback={
                                <button 
                                    disabled
                                    className="w-full px-4 py-2 bg-gray-400 text-white rounded-lg font-semibold text-sm shadow flex items-center justify-center gap-2 cursor-not-allowed opacity-50"
                                >
                                    <span>حفظ مؤقت (مسودة)</span>
                                </button>
                            }
                        >
                            <button 
                                onClick={handleSaveDraft}
                                disabled={status === 'POSTED' || isCreating || !selectedStoreId}
                                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold text-sm shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>{isCreating ? 'جاري الحفظ...' : 'حفظ مؤقت (مسودة)'}</span>
                            </button>
                        </PermissionWrapper>
                        <PermissionWrapper
                            requiredPermission={buildPermission(
                                Resources.INVENTORY_COUNT,
                                Actions.UPDATE
                            )}
                            fallback={
                                <button 
                                    disabled
                                    className="w-full px-4 py-3 bg-gray-400 text-white rounded-lg font-bold text-lg shadow-md flex items-center justify-center gap-3 cursor-not-allowed opacity-50"
                                >
                                    <span>اعتماد التسوية وترحيل القيود</span>
                                </button>
                            }
                        >
                            <button 
                                onClick={handlePostSettlement}
                                disabled={status === 'POSTED' || isPosting || isUpdating || !selectedStoreId}
                                className="w-full px-4 py-3 bg-brand-blue text-white rounded-lg hover:bg-blue-800 font-bold text-lg shadow-md flex items-center justify-center gap-3 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>{(isPosting || isUpdating) ? 'جاري الاعتماد...' : 'اعتماد التسوية وترحيل القيود'}</span>
                            </button>
                        </PermissionWrapper>
                    </div>
                </div>
            </div>

            <DataTableModal 
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                title="سجل عمليات الجرد"
                columns={[
                    { Header: 'رقم الجرد', accessor: 'code' },
                    { Header: 'التاريخ', accessor: 'date' },
                    { Header: 'المخزن', accessor: 'storeName' },
                    { Header: 'الحالة', accessor: 'status' },
                    { Header: 'صافي الفروقات', accessor: 'totalVarianceValue' },
                ]}
                data={inventoryCounts.map(c => ({
                    id: c.id,
                    code: c.code,
                    date: c.date.substring(0, 10),
                    storeName: c.store.name,
                    status: c.status === 'POSTED' ? 'معتمد' : 'مسودة',
                    totalVarianceValue: formatNumber(c.totalVarianceValue)
                }))}
                onSelectRow={loadHistoricalCount}
                exportPermission={buildPermission(
                    Resources.INVENTORY_COUNT,
                    Actions.PRINT
                )}
            />
        </div>
    );
};

export default InventoryCountPage;
