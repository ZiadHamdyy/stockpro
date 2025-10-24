import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ExcelIcon,
  PdfIcon,
  PrintIcon,
  SearchIcon,
  TrashIcon,
} from "../../icons";
import { useModal } from "../../common/ModalProvider";
import { exportToExcel, exportToPdf } from "../../../utils/formatting";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  useGetItemsQuery,
  useDeleteItemMutation,
  type Item,
} from "../../store/slices/items/itemsApi";
import { setItems, removeItem } from "../../store/slices/items/items";

interface ItemsListProps {
  title: string;
  onNavigate?: (key: string, label: string, id?: string | null) => void;
}

const ItemsList: React.FC<ItemsListProps> = ({ title, onNavigate }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const inputStyle =
    "w-64 pr-10 pl-4 py-3 bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";
  const { showModal } = useModal();
  const dispatch = useAppDispatch();

  // Get data from Redux state
  const items = useAppSelector((state) => state.items.items);
  const isLoading = useAppSelector((state) => state.items.isLoading);

  // API hooks
  const {
    data: apiItems = [],
    isLoading: apiLoading,
    error,
  } = useGetItemsQuery(undefined);
  const [deleteItem] = useDeleteItemMutation();

  // Update Redux state when API data changes
  useEffect(() => {
    const response = apiItems as any;
    if (
      response &&
      response.data &&
      Array.isArray(response.data) &&
      response.data.length > 0
    ) {
      dispatch(setItems(response.data));
    }
  }, [apiItems, dispatch]);

  // Debug logging
  console.log("ItemsList - Redux Data:", items);
  console.log("ItemsList - API Data:", apiItems);
  console.log("ItemsList - Loading:", apiLoading);
  console.log("ItemsList - Error:", error);

  const handleDeleteClick = (id: string, name: string) => {
    showModal({
      title: "تأكيد الحذف",
      message: `هل أنت متأكد من رغبتك في حذف الصنف "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      onConfirm: async () => {
        try {
          await deleteItem(id).unwrap();
          dispatch(removeItem(id));
        } catch (error: any) {
          console.error("Delete error:", error);
        }
      },
      type: "delete",
      showPassword: true,
    });
  };

  const filteredItems = Array.isArray(items)
    ? items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.code.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  const handleExcelExport = () => {
    const dataToExport = filteredItems.map(
      ({ code, name, group, unit, purchasePrice, salePrice, stock }) => ({
        الكود: code,
        الاسم: name,
        المجموعة: group.name,
        الوحدة: unit.name,
        "سعر الشراء": purchasePrice,
        "سعر البيع": salePrice,
        الرصيد: stock,
      }),
    );
    exportToExcel(dataToExport, "قائمة-الأصناف");
  };

  const handlePdfExport = () => {
    const head = [
      [
        "الرصيد",
        "سعر البيع",
        "سعر الشراء",
        "الوحدة",
        "المجموعة",
        "الاسم",
        "الكود",
      ],
    ];
    const body = filteredItems.map((item) => [
      item.stock.toString(),
      item.salePrice.toFixed(2),
      item.purchasePrice.toFixed(2),
      item.unit.name,
      item.group.name,
      item.name,
      item.code,
    ]);

    exportToPdf("قائمة الأصناف", head, body, "قائمة-الأصناف");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4 border-b pb-4 no-print">
        <h1 className="text-2xl font-bold text-brand-dark">{title}</h1>
        <button
          onClick={() => navigate("/items/add")}
          className="px-6 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold transition-colors"
        >
          إضافة صنف جديد
        </button>
      </div>
      <div className="flex justify-between items-center mb-4 no-print">
        <div className="relative">
          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
          <input
            type="text"
            placeholder="بحث عن صنف..."
            className={inputStyle}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExcelExport}
            title="تصدير Excel"
            className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
          >
            <ExcelIcon className="w-6 h-6" />
          </button>
          <button
            onClick={handlePdfExport}
            title="تصدير PDF"
            className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
          >
            <PdfIcon className="w-6 h-6" />
          </button>
          <button
            title="طباعة"
            onClick={() => window.print()}
            className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
          >
            <PrintIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-brand-blue">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                الكود
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                الاسم
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                المجموعة
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                الوحدة
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                سعر الشراء
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                سعر البيع
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                الرصيد
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase no-print">
                اجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {apiLoading ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">
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
                <td colSpan={8} className="px-6 py-8 text-center">
                  <div className="text-red-600">
                    <p className="font-semibold">خطأ في تحميل البيانات</p>
                    <p className="text-sm mt-1">يرجى المحاولة مرة أخرى</p>
                  </div>
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm
                    ? "لا توجد أصناف تطابق البحث"
                    : "لا توجد أصناف متاحة"}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-brand-blue-bg">
                  <td className="px-6 py-4">{item.code}</td>
                  <td className="px-6 py-4 font-medium text-brand-dark">
                    {item.name}
                  </td>
                  <td className="px-6 py-4">{item.group.name}</td>
                  <td className="px-6 py-4">{item.unit.name}</td>
                  <td className="px-6 py-4">{item.purchasePrice.toFixed(2)}</td>
                  <td className="px-6 py-4">{item.salePrice.toFixed(2)}</td>
                  <td className="px-6 py-4 font-bold">{item.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print">
                    <button
                      onClick={() =>
                        onNavigate(
                          "add_item",
                          `تعديل صنف #${item.code}`,
                          item.id,
                        )
                      }
                      className="text-brand-blue hover:text-blue-800 font-semibold ml-4"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item.id, item.name)}
                      className="text-red-600 hover:text-red-900 font-semibold"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemsList;
