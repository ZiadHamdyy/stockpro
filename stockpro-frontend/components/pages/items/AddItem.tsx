import React, { useState, useEffect } from "react";
import { useModal } from "../../common/ModalProvider";
import { useToast } from "../../common/ToastProvider";
import {
  useGetItemsQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
  useGetItemGroupsQuery,
  useGetUnitsQuery,
  type Item,
  type ItemGroup,
  type Unit,
} from "../../store/slices/items/itemsApi";

interface AddItemProps {
  title: string;
  editingId: string | null;
  onNavigate: (key: string, label: string, id?: string | null) => void;
}

const AddItem: React.FC<AddItemProps> = ({ title, editingId, onNavigate }) => {
  const [itemData, setItemData] = useState<
    Partial<Item> & { groupId?: string; unitId?: string }
  >({
    code: "",
    barcode: "",
    name: "",
    purchasePrice: 0,
    salePrice: 0,
    stock: 0,
    reorderLimit: 0,
  });
  const [isReadOnly, setIsReadOnly] = useState(true);
  const { showModal } = useModal();
  const { showToast } = useToast();

  // API hooks
  const { data: itemsResponse, isLoading: itemsLoading } =
    useGetItemsQuery(undefined);
  const {
    data: itemGroupsResponse,
    isLoading: groupsLoading,
    error: groupsError,
  } = useGetItemGroupsQuery(undefined);
  const {
    data: unitsResponse,
    isLoading: unitsLoading,
    error: unitsError,
  } = useGetUnitsQuery(undefined);

  // Extract data from API response
  const items = (itemsResponse as any)?.data || [];
  const itemGroups = (itemGroupsResponse as any)?.data || [];
  const units = (unitsResponse as any)?.data || [];
  const [createItem, { isLoading: createLoading }] = useCreateItemMutation();
  const [updateItem, { isLoading: updateLoading }] = useUpdateItemMutation();
  const [deleteItem] = useDeleteItemMutation();

  // Debug logging
  console.log("AddItem - Item Groups:", itemGroups);
  console.log("AddItem - Units:", units);
  console.log("AddItem - Groups Loading:", groupsLoading);
  console.log("AddItem - Units Loading:", unitsLoading);
  console.log("AddItem - Groups Error:", groupsError);
  console.log("AddItem - Units Error:", unitsError);

  useEffect(() => {
    if (editingId !== null) {
      const foundItem = Array.isArray(items)
        ? items.find((item) => item.id === editingId)
        : null;
      if (foundItem) {
        setItemData(foundItem);
        setIsReadOnly(true);
      }
    } else {
      const nextCode =
        Array.isArray(items) && items.length > 0
          ? (
              Math.max(...items.map((i) => parseInt(i.code, 10) || 0)) + 1
            ).toString()
          : "101";
      setItemData({
        code: nextCode,
        barcode: "",
        name: "",
        purchasePrice: 0,
        salePrice: 0,
        stock: 0,
        reorderLimit: 0,
      });
      setIsReadOnly(false);
    }
  }, [editingId, items]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setItemData((prev) => ({
      ...prev,
      // FIX: Add 'reorderLimit' to the list of numeric fields.
      [name]:
        name === "purchasePrice" ||
        name === "salePrice" ||
        name === "stock" ||
        name === "reorderLimit"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSave = async () => {
    if (
      !itemData.code ||
      !itemData.name ||
      !itemData.groupId ||
      !itemData.unitId
    ) {
      showToast("الرجاء تعبئة جميع الحقول المطلوبة.");
      return;
    }

    try {
      if (itemData.id) {
        // Update existing item
        await updateItem({
          id: itemData.id,
          data: {
            code: itemData.code,
            barcode: itemData.barcode,
            name: itemData.name,
            purchasePrice: itemData.purchasePrice,
            salePrice: itemData.salePrice,
            stock: itemData.stock,
            reorderLimit: itemData.reorderLimit,
            groupId: itemData.groupId,
            unitId: itemData.unitId,
          },
        }).unwrap();
        showToast(`تم تحديث الصنف "${itemData.name}" بنجاح!`);
        setIsReadOnly(true);
      } else {
        // Create new item
        await createItem({
          code: itemData.code,
          barcode: itemData.barcode,
          name: itemData.name,
          purchasePrice: itemData.purchasePrice,
          salePrice: itemData.salePrice,
          stock: itemData.stock,
          reorderLimit: itemData.reorderLimit,
          groupId: itemData.groupId,
          unitId: itemData.unitId,
        }).unwrap();
        showToast(`تم إنشاء الصنف "${itemData.name}" بنجاح!`);
        onNavigate("items_list", "قائمة الأصناف");
      }
    } catch (error: any) {
      showToast(error?.data?.message || "حدث خطأ أثناء حفظ الصنف");
    }
  };

  const handleDelete = () => {
    if (itemData.id) {
      showModal({
        title: "تأكيد الحذف",
        message: `هل أنت متأكد من حذف الصنف "${itemData.name}"؟`,
        onConfirm: async () => {
          try {
            await deleteItem(itemData.id).unwrap();
            showToast("تم الحذف بنجاح.");
            onNavigate("items_list", "قائمة الأصناف");
          } catch (error: any) {
            showToast(error?.data?.message || "حدث خطأ أثناء الحذف");
          }
        },
        type: "delete",
        showPassword: true,
      });
    }
  };

  const handleEdit = () => {
    if (!("id" in itemData)) return; // Should not happen if button is disabled
    showModal({
      title: "تأكيد التعديل",
      message: "هل أنت متأكد من رغبتك في تعديل بيانات هذا الصنف؟",
      onConfirm: () => setIsReadOnly(false),
      type: "edit",
      showPassword: true,
    });
  };

  const navigate = (direction: "first" | "prev" | "next" | "last") => {
    if (!Array.isArray(items) || items.length === 0) return;

    const isNewItem = !itemData.id;
    let newIndex = 0;

    switch (direction) {
      case "first":
        newIndex = 0;
        break;
      case "prev":
        newIndex = isNewItem ? items.length - 1 : Math.max(0, 0);
        break;
      case "next":
        newIndex = isNewItem ? 0 : Math.min(items.length - 1, 1);
        break;
      case "last":
        newIndex = items.length - 1;
        break;
    }

    if (newIndex !== -1 && items[newIndex]) {
      const newId = items[newIndex].id;
      onNavigate("add_item", `تعديل صنف #${newId}`, newId);
    }
  };

  const inputStyle =
    "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed";

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>
      {(groupsLoading || unitsLoading) && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-blue mr-2"></div>
            <span className="text-blue-700 text-sm">
              جاري تحميل البيانات...
            </span>
          </div>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700"
            >
              كود الصنف
            </label>
            <input
              type="text"
              name="code"
              id="code"
              value={itemData.code}
              onChange={handleChange}
              className={inputStyle}
              disabled
              required
            />
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              اسم الصنف
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={itemData.name}
              onChange={handleChange}
              className={inputStyle}
              disabled={isReadOnly}
              required
            />
          </div>
          <div className="md:col-span-3">
            <label
              htmlFor="barcode"
              className="block text-sm font-medium text-gray-700"
            >
              الباركود
            </label>
            <input
              type="text"
              name="barcode"
              id="barcode"
              value={itemData.barcode || ""}
              onChange={handleChange}
              className={inputStyle}
              disabled={isReadOnly}
              placeholder="ادخل الباركود يدوياً أو استخدم الماسح في شاشات البيع والشراء"
            />
          </div>
          <div>
            <label
              htmlFor="groupId"
              className="block text-sm font-medium text-gray-700"
            >
              المجموعة
            </label>
            <select
              name="groupId"
              id="groupId"
              value={itemData.groupId || ""}
              onChange={handleChange}
              className={inputStyle}
              disabled={isReadOnly || groupsLoading}
              required
            >
              <option value="">
                {groupsLoading ? "جاري تحميل المجموعات..." : "اختر مجموعة..."}
              </option>
              {Array.isArray(itemGroups)
                ? itemGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))
                : []}
            </select>
            {groupsError && (
              <p className="text-red-500 text-sm mt-1">
                خطأ في تحميل المجموعات
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="unitId"
              className="block text-sm font-medium text-gray-700"
            >
              الوحدة
            </label>
            <select
              name="unitId"
              id="unitId"
              value={itemData.unitId || ""}
              onChange={handleChange}
              className={inputStyle}
              disabled={isReadOnly || unitsLoading}
              required
            >
              <option value="">
                {unitsLoading ? "جاري تحميل الوحدات..." : "اختر وحدة..."}
              </option>
              {Array.isArray(units)
                ? units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))
                : []}
            </select>
            {unitsError && (
              <p className="text-red-500 text-sm mt-1">خطأ في تحميل الوحدات</p>
            )}
          </div>
          <div>
            <label
              htmlFor="stock"
              className="block text-sm font-medium text-gray-700"
            >
              الرصيد الافتتاحي
            </label>
            <input
              type="number"
              name="stock"
              id="stock"
              value={"stock" in itemData ? itemData.stock : 0}
              onChange={handleChange}
              className={inputStyle}
              disabled={isReadOnly || "id" in itemData}
            />
          </div>
          <div>
            <label
              htmlFor="purchasePrice"
              className="block text-sm font-medium text-gray-700"
            >
              سعر الشراء (يُحدّث من المشتريات)
            </label>
            <input
              type="number"
              name="purchasePrice"
              id="purchasePrice"
              value={itemData.purchasePrice}
              onChange={handleChange}
              className={inputStyle}
              disabled
              required
            />
          </div>
          <div>
            <label
              htmlFor="salePrice"
              className="block text-sm font-medium text-gray-700"
            >
              سعر البيع
            </label>
            <input
              type="number"
              name="salePrice"
              id="salePrice"
              value={itemData.salePrice}
              onChange={handleChange}
              className={inputStyle}
              disabled={isReadOnly}
              required
            />
          </div>
          {/* FIX: Add input field for 'reorderLimit'. */}
          <div>
            <label
              htmlFor="reorderLimit"
              className="block text-sm font-medium text-gray-700"
            >
              حد إعادة الطلب
            </label>
            <input
              type="number"
              name="reorderLimit"
              id="reorderLimit"
              value={itemData.reorderLimit}
              onChange={handleChange}
              className={inputStyle}
              disabled={isReadOnly}
              required
            />
          </div>
        </div>
        <div className="mt-8 pt-6 border-t-2 border-gray-200 flex flex-col items-start space-y-4">
          <div className="flex justify-start gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigate("add_item", "إضافة صنف")}
              className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold"
            >
              جديد
            </button>
            <button
              type="submit"
              disabled={isReadOnly}
              className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold disabled:bg-gray-400"
            >
              حفظ
            </button>
            <button
              type="button"
              onClick={handleEdit}
              disabled={!("id" in itemData) || !isReadOnly}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 font-semibold disabled:bg-gray-400"
            >
              تعديل
            </button>
            <button
              type="button"
              onClick={() => onNavigate("items_list", "قائمة الأصناف")}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold"
            >
              بحث
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!("id" in itemData)}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold disabled:bg-gray-400"
            >
              حذف
            </button>
          </div>

          <div className="flex items-center justify-start gap-2">
            <button
              type="button"
              onClick={() => navigate("first")}
              disabled={!Array.isArray(items) || items.length === 0}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              الأول
            </button>
            <button
              type="button"
              onClick={() => navigate("prev")}
              disabled={!Array.isArray(items) || items.length === 0}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              السابق
            </button>
            <div className="px-4 py-2 bg-brand-blue-bg border-2 border-brand-blue rounded-md">
              <span className="font-bold">
                {itemData.id ? `تعديل صنف` : `سجل جديد`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate("next")}
              disabled={!Array.isArray(items) || items.length === 0}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              التالي
            </button>
            <button
              type="button"
              onClick={() => navigate("last")}
              disabled={!Array.isArray(items) || items.length === 0}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              الأخير
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddItem;
