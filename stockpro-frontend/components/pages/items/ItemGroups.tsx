import React, { useState, useEffect, useMemo } from "react";
import { PrintIcon, SearchIcon } from "../../icons";
import ItemGroupModal from "./ItemGroupModal";
import { useModal } from "../../common/ModalProvider";
import PermissionWrapper from "../../common/PermissionWrapper";
import {
  Resources,
  Actions,
  buildPermission,
} from "../../../enums/permissions.enum";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  useGetItemGroupsQuery,
  useCreateItemGroupMutation,
  useUpdateItemGroupMutation,
  useDeleteItemGroupMutation,
  type ItemGroup,
} from "../../store/slices/items/itemsApi";
import { setItemGroups, removeItemGroup } from "../../store/slices/items/items";

interface ItemGroupsProps {
  title: string;
}

const ItemGroups: React.FC<ItemGroupsProps> = ({ title }) => {
  const PRINT_PAGE_SIZE = 20;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<ItemGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { showModal } = useModal();
  const dispatch = useAppDispatch();

  // Get data from Redux state
  const groups = useAppSelector((state) => state.items.itemGroups);
  const isLoading = useAppSelector((state) => state.items.isLoading);

  // API hooks
  const {
    data: apiGroups = [],
    isLoading: apiLoading,
    error,
  } = useGetItemGroupsQuery(undefined);
  const [createItemGroup] = useCreateItemGroupMutation();
  const [updateItemGroup] = useUpdateItemGroupMutation();
  const [deleteItemGroup] = useDeleteItemGroupMutation();

  // Update Redux state when API data changes
  useEffect(() => {
    if (apiGroups && Array.isArray(apiGroups) && apiGroups.length > 0) {
      dispatch(setItemGroups(apiGroups));
    }
  }, [apiGroups, dispatch]);

  const handleOpenModal = (group: ItemGroup | null = null) => {
    setGroupToEdit(group);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setGroupToEdit(null);
  };

  const handleEditClick = (group: ItemGroup) => {
    showModal({
      title: "تأكيد التعديل",
      message: "هل أنت متأكد من رغبتك في تعديل بيانات هذه المجموعة؟",
      onConfirm: () => handleOpenModal(group),
      type: "edit",
    });
  };

  const handleDeleteClick = (group: ItemGroup) => {
    showModal({
      title: "تأكيد الحذف",
      message: `هل أنت متأكد من حذف المجموعة "${group.name}"؟`,
      onConfirm: async () => {
        try {
          await deleteItemGroup(group.id).unwrap();
          dispatch(removeItemGroup(group.id));
        } catch (error: any) {
          console.error("Delete error:", error);
        }
      },
      type: "delete",
    });
  };

  const filteredGroups = Array.isArray(groups)
    ? groups.filter((group) =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  const printPages = useMemo(() => {
    const pages: typeof filteredGroups[] = [];
    for (let i = 0; i < filteredGroups.length; i += PRINT_PAGE_SIZE) {
      pages.push(filteredGroups.slice(i, i + PRINT_PAGE_SIZE));
    }
    return pages.length ? pages : [[]];
  }, [filteredGroups]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;

    const totalPages = Math.max(printPages.length, 1);

    const headerCells = `
      <tr>
        <th>كود المجموعة</th>
        <th>اسم المجموعة</th>
      </tr>
    `;

    const bodyPages = printPages
      .map(
        (pageItems, idx) => `
        <div class="page">
          <div class="page-header">
            <h2 class="title">${title}</h2>
            <div class="page-number">(${totalPages} / ${idx + 1})</div>
          </div>
          <table>
            <thead>${headerCells}</thead>
            <tbody>
              ${
                pageItems.length === 0
                  ? `<tr><td colspan="2" class="empty">لا توجد مجموعات متاحة</td></tr>`
                  : pageItems
                      .map(
                        (group) => `
                  <tr>
                    <td>${group.code}</td>
                    <td>${group.name}</td>
                  </tr>
                `,
                      )
                      .join("")
              }
            </tbody>
          </table>
        </div>`
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
            @bottom-center {
              content: counter(page) " / " counter(pages);
              font-family: 'Cairo', sans-serif;
              font-size: 12px;
              color: #1F2937;
            }
          }
          body {
            font-family: 'Cairo', sans-serif;
            margin: 0;
            padding: 10mm;
            color: #1F2937;
            background: #FFFFFF;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 0 0 12px 0;
          }
          .title {
            margin: 0;
            font-size: 16px;
            color: #1F2937;
          }
          .page-number {
            display: none;
          }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #E5E7EB; padding: 6px 8px; text-align: right; }
          thead { background: #1E40AF !important; color: #FFFFFF !important; }
          tbody tr:nth-child(odd) { background: #D1D5DB !important; }
          tbody tr:nth-child(even) { background: #FFFFFF !important; }
          tr { page-break-inside: avoid; break-inside: avoid; }
          .page { page-break-after: always; break-after: page; }
          .page:last-of-type { page-break-after: auto; break-after: auto; }
          .empty { text-align: center; color: #6B7280; }
        </style>
      </head>
      <body>
        ${bodyPages}
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 200);
  };

  const inputStyle =
    "w-64 pr-10 pl-4 py-3 bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>
        <div className="flex justify-between items-center mb-6 no-print">
          <div className="relative">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input
              type="text"
              placeholder="بحث عن مجموعة..."
              className={inputStyle}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.ITEM_GROUPS,
                Actions.CREATE,
              )}
              fallback={
                <button
                  disabled
                  className="px-6 py-3 bg-gray-400 text-white rounded-md cursor-not-allowed opacity-50 font-semibold"
                >
                  اضافة مجموعة جديدة
                </button>
              }
            >
              <button
                onClick={() => handleOpenModal()}
                className="px-6 py-3 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold"
              >
                اضافة مجموعة جديدة
              </button>
            </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.ITEM_GROUPS,
                Actions.PRINT,
              )}
              fallback={
                <button
                  disabled
                  className="p-3 border-2 border-gray-200 rounded-md cursor-not-allowed opacity-50"
                >
                  <PrintIcon className="w-6 h-6" />
                </button>
              }
            >
              <button
                onClick={handlePrint}
                className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
              >
                <PrintIcon className="w-6 h-6" />
              </button>
            </PermissionWrapper>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-brand-blue">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                  كود المجموعة
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                  اسم المجموعة
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider no-print">
                  اجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {apiLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
                      <span className="mr-3 text-gray-600">
                        جاري تحميل البيانات...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center">
                    <div className="text-red-600">
                      <p className="font-semibold">خطأ في تحميل البيانات</p>
                      <p className="text-sm mt-1">يرجى المحاولة مرة أخرى</p>
                    </div>
                  </td>
                </tr>
              ) : filteredGroups.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {searchTerm
                      ? "لا توجد مجموعات تطابق البحث"
                      : "لا توجد مجموعات متاحة"}
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group) => (
                  <tr key={group.id} className="hover:bg-brand-blue-bg">
                    <td className="px-6 py-4 whitespace-nowrap">{group.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-brand-dark">
                      {group.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print">
                      <PermissionWrapper
                        requiredPermission={buildPermission(
                          Resources.ITEM_GROUPS,
                          Actions.UPDATE,
                        )}
                        fallback={
                          <button
                            disabled
                            className="text-gray-400 cursor-not-allowed font-semibold ml-4"
                          >
                            تعديل
                          </button>
                        }
                      >
                        <button
                          onClick={() => handleEditClick(group)}
                          className="text-brand-blue hover:text-blue-800 font-semibold ml-4"
                        >
                          تعديل
                        </button>
                      </PermissionWrapper>
                      <PermissionWrapper
                        requiredPermission={buildPermission(
                          Resources.ITEM_GROUPS,
                          Actions.DELETE,
                        )}
                        fallback={
                          <button
                            disabled
                            className="text-gray-400 cursor-not-allowed font-semibold"
                          >
                            حذف
                          </button>
                        }
                      >
                        <button
                          onClick={() => handleDeleteClick(group)}
                          className="text-red-600 hover:text-red-900 font-semibold"
                        >
                          حذف
                        </button>
                      </PermissionWrapper>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ItemGroupModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        groupToEdit={groupToEdit}
      />
    </>
  );
};

export default ItemGroups;
