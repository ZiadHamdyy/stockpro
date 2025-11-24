import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useModal } from "../../common/ModalProvider";
import { useToast } from "../../common/ToastProvider";
import { useTitle } from "../../context/TitleContext";
import PermissionWrapper from "../../common/PermissionWrapper";
import {
  Resources,
  Actions,
  buildPermission,
} from "../../../enums/permissions.enum";
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
  editingId?: string | null;
  onNavigate?: (key: string, label: string, id?: string | null) => void;
}

const AddItem: React.FC<AddItemProps> = ({ title, editingId, onNavigate }) => {
  const navigate = useNavigate();
  const params = useParams();
  const { setTitle } = useTitle();

  // Get the item ID from URL parameters or props
  const itemId = params.id || editingId;

  const [itemData, setItemData] = useState<
    Partial<Item> & { groupId?: string; unitId?: string }
  >({
    barcode: "",
    name: "",
    purchasePrice: 0,
    salePrice: "" as any,
    stock: "" as any,
    reorderLimit: "" as any,
  });
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [itemType, setItemType] = useState<'STOCKED' | 'SERVICE'>('STOCKED');
  const [itemPosition, setItemPosition] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
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
  const items = itemsResponse || [];
  const itemGroups = itemGroupsResponse || [];
  const units = unitsResponse || [];
  const [createItem, { isLoading: createLoading }] = useCreateItemMutation();
  const [updateItem, { isLoading: updateLoading }] = useUpdateItemMutation();
  const [deleteItem] = useDeleteItemMutation();

  // Calculate item position when items data is available
  useEffect(() => {
    if (Array.isArray(items) && items.length > 0 && itemId) {
      const index = items.findIndex((item) => item.id === itemId);
      const position = index !== -1 ? index + 1 : null;
      setItemPosition(position);
      setCurrentIndex(index);

      // Update title context for the header
      if (position) {
        setTitle(`تعديل صنف #${position}`);
      } else {
        setTitle(`تعديل صنف`);
      }
    } else {
      setItemPosition(null);
      setCurrentIndex(-1);
      setTitle(`تعديل صنف`);
    }
  }, [items, itemId, setTitle]);

  // Cleanup: Reset title when component unmounts
  useEffect(() => {
    return () => {
      setTitle("");
    };
  }, [setTitle]);

  useEffect(() => {
    if (itemId !== null && itemId !== undefined) {
      const foundItem = Array.isArray(items)
        ? items.find((item) => item.id === itemId)
        : null;
      if (foundItem) {
        setItemData({
          ...foundItem,
          groupId: (foundItem as any).group?.id,
          unitId: (foundItem as any).unit?.id,
          salePrice:
            foundItem.salePrice === 0 || foundItem.salePrice === null
              ? ("" as any)
              : foundItem.salePrice,
          stock:
            foundItem.stock === 0 || foundItem.stock === null
              ? ("" as any)
              : foundItem.stock,
          reorderLimit:
            foundItem.reorderLimit === 0 || foundItem.reorderLimit === null
              ? ("" as any)
              : foundItem.reorderLimit,
        });
        if ((foundItem as any).type) {
          setItemType((foundItem as any).type as 'STOCKED' | 'SERVICE');
        }
        setIsReadOnly(true);
        const index = Array.isArray(items) ? items.findIndex((item) => item.id === itemId) : -1;
        setCurrentIndex(index);
      }
    } else {
      setItemData({
        barcode: "",
        name: "",
        purchasePrice: 0,
        salePrice: "" as any,
        stock: "" as any,
        reorderLimit: "" as any,
      });
      setItemType('STOCKED');
      setIsReadOnly(false);
      setCurrentIndex(-1);
    }
  }, [itemId, items]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setItemData((prev) => ({
      ...prev,
      [name]:
        name === "purchasePrice"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handlePositiveNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "salePrice" | "reorderLimit"
  ) => {
    const value = e.target.value;
    // Allow empty string and valid positive numbers (including decimals, no negatives)
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setItemData((prev) => ({
        ...prev,
        [fieldName]: value === "" ? ("" as any) : parseFloat(value) || 0,
      }));
    }
  };

  const handleStockChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    // Allow empty string, negative sign, and valid numbers (including decimals and negatives)
    if (value === "" || value === "-" || /^-?\d*\.?\d*$/.test(value)) {
      setItemData((prev) => ({
        ...prev,
        stock: value === "" || value === "-" ? (value as any) : parseFloat(value) || 0,
      }));
    }
  };

  const handleSave = async () => {
    if (!itemData.name || !itemData.groupId || !itemData.unitId) {
      showToast("الرجاء تعبئة جميع الحقول المطلوبة.", 'error');
      return;
    }

    try {
      // Normalize salePrice, stock, and reorderLimit to numbers before saving
      const salePriceValue =
        typeof itemData.salePrice === "string"
          ? parseFloat(itemData.salePrice) || 0
          : itemData.salePrice || 0;
      const stockValue =
        typeof itemData.stock === "string"
          ? parseFloat(itemData.stock) || 0
          : itemData.stock || 0;
      const reorderLimitValue =
        typeof itemData.reorderLimit === "string"
          ? parseFloat(itemData.reorderLimit) || 0
          : itemData.reorderLimit || 0;

      if (itemData.id) {
        // Update existing item
        await updateItem({
          id: itemData.id,
          data: {
            barcode: itemData.barcode,
            name: itemData.name,
            purchasePrice: itemData.purchasePrice,
            salePrice: salePriceValue,
            stock: itemType === 'SERVICE' ? 0 : stockValue,
            reorderLimit: reorderLimitValue,
            groupId: itemData.groupId,
            unitId: itemData.unitId,
            type: itemType,
          },
        }).unwrap();
        showToast(`تم تحديث الصنف "${itemData.name}" بنجاح!`);
        setIsReadOnly(true);
      } else {
        // Create new item
        await createItem({
          barcode: itemData.barcode,
          name: itemData.name,
          purchasePrice: itemData.purchasePrice,
          salePrice: salePriceValue,
          stock: itemType === 'SERVICE' ? 0 : stockValue,
          reorderLimit: reorderLimitValue,
          groupId: itemData.groupId,
          unitId: itemData.unitId,
          type: itemType,
        }).unwrap();
        showToast(`تم إنشاء الصنف "${itemData.name}" بنجاح!`);
        navigate("/items/list");
      }
    } catch (error: any) {
      showToast("حدث خطأ أثناء حفظ الصنف", 'error');
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
            navigate("/items/list");
          } catch (error: any) {
            console.error("Error deleting item:", error);
            const status = error?.status || error?.originalStatus;
            if (status === 409) {
              showToast("لا يمكن حذف الصنف لوجود معاملات مرتبطة به", 'error');
            } else {
              showToast("فشل الحذف، حاول مرة أخرى", 'error');
            }
          }
        },
        type: "delete",
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
    });
  };

  const navigateToItem = (direction: "first" | "prev" | "next" | "last") => {
    if (!Array.isArray(items) || items.length === 0) return;

    let newIndex = currentIndex;

    switch (direction) {
      case "first":
        newIndex = 0;
        break;
      case "last":
        newIndex = items.length - 1;
        break;
      case "next":
        if (currentIndex === -1) {
          newIndex = 0; // from new → first item
        } else {
          newIndex = Math.min(items.length - 1, currentIndex + 1);
        }
        break;
      case "prev":
        if (currentIndex === -1) {
          newIndex = items.length - 1; // from new → last item
        } else {
          newIndex = Math.max(0, currentIndex - 1);
        }
        break;
    }

    if (newIndex >= 0 && newIndex < items.length) {
      const newId = items[newIndex].id;
      navigate(`/items/add/${newId}`);
    }
  };

  const inputStyle =
    "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed";

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4 text-brand-dark">
        {itemPosition ? `تعديل صنف #${itemPosition}` : title}
      </h1>
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
              value={itemData.code || ""}
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
          <div className="md:col-span-1">
            <div className="relative bg-brand-blue-bg border-2 border-brand-blue rounded-md p-1 mt-6 flex items-center">
              <button
                type="button"
                onClick={() => setItemType('STOCKED')}
                className={`w-1/2 py-2 rounded ${itemType === 'STOCKED' ? 'bg-brand-blue text-white shadow' : 'text-gray-600'} transition-all duration-200`}
                disabled={isReadOnly}
              >
                صنف مخزن
              </button>
              <button
                type="button"
                onClick={() => setItemType('SERVICE')}
                className={`w-1/2 py-2 rounded ${itemType === 'SERVICE' ? 'bg-brand-blue text-white shadow' : 'text-gray-600'} transition-all duration-200`}
                disabled={isReadOnly}
              >
                صنف خدمي
              </button>
            </div>
          </div>
          <div className="md:col-span-2">
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
              الرصيد الافتتاحي (للمخزن الحالي)
            </label>
            <input
              type="text"
              name="stock"
              id="stock"
              value={
                typeof itemData.stock === "string"
                  ? itemData.stock
                  : itemData.stock === 0 || itemData.stock === null
                  ? ""
                  : itemData.stock
              }
              onChange={handleStockChange}
              className={inputStyle}
              disabled={isReadOnly || itemType === 'SERVICE'}
              inputMode="numeric"
              placeholder="سيتم تعيين الرصيد لمخزن الفرع الحالي"
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
              type="text"
              name="salePrice"
              id="salePrice"
              value={
                typeof itemData.salePrice === "string"
                  ? itemData.salePrice
                  : itemData.salePrice === 0 || itemData.salePrice === null
                  ? ""
                  : itemData.salePrice
              }
              onChange={(e) => handlePositiveNumberChange(e, "salePrice")}
              className={inputStyle}
              disabled={isReadOnly}
              inputMode="numeric"
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
              type="text"
              name="reorderLimit"
              id="reorderLimit"
              value={
                typeof itemData.reorderLimit === "string"
                  ? itemData.reorderLimit
                  : itemData.reorderLimit === 0 || itemData.reorderLimit === null
                  ? ""
                  : itemData.reorderLimit
              }
              onChange={(e) => handlePositiveNumberChange(e, "reorderLimit")}
              className={inputStyle}
              disabled={isReadOnly}
              inputMode="numeric"
            />
          </div>
        </div>
        <div className="mt-8 pt-6 border-t-2 border-gray-200 flex flex-col items-start space-y-4">
          <div className="flex justify-start gap-2 flex-wrap">
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.ADD_ITEM,
                Actions.CREATE,
              )}
            >
              <button
                type="button"
                onClick={() => navigate("/items/add")}
                className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold"
              >
                جديد
              </button>
            </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.ADD_ITEM,
                "id" in itemData ? Actions.UPDATE : Actions.CREATE,
              )}
            >
              <button
                type="submit"
                disabled={isReadOnly}
                className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold disabled:bg-gray-400"
              >
                حفظ
              </button>
            </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.ADD_ITEM,
                Actions.UPDATE,
              )}
            >
              <button
                type="button"
                onClick={handleEdit}
                disabled={!("id" in itemData) || !isReadOnly}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 font-semibold disabled:bg-gray-400"
              >
                تعديل
              </button>
            </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.ITEMS_LIST,
                Actions.READ,
              )}
            >
              <button
                type="button"
                onClick={() => navigate("/items/list")}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold"
              >
                بحث
              </button>
            </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.ADD_ITEM,
                Actions.DELETE,
              )}
            >
              <button
                type="button"
                onClick={handleDelete}
                disabled={!("id" in itemData)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold disabled:bg-gray-400"
              >
                حذف
              </button>
            </PermissionWrapper>
          </div>

          <div className="flex items-center justify-start gap-2">
            <button
              type="button"
              onClick={() => navigateToItem("first")}
              disabled={(Array.isArray(items) ? items.length === 0 : true) || currentIndex === 0}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              الأول
            </button>
            <button
              type="button"
              onClick={() => navigateToItem("prev")}
              disabled={(Array.isArray(items) ? items.length === 0 : true) || currentIndex === 0}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              السابق
            </button>
            <div className="px-4 py-2 bg-brand-blue-bg border-2 border-brand-blue rounded-md">
              <span className="font-bold">
                {currentIndex > -1
                  ? `${currentIndex + 1} / ${Array.isArray(items) ? items.length : 0}`
                  : `سجل جديد`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigateToItem("next")}
              disabled={(Array.isArray(items) ? items.length === 0 : true) || currentIndex === (Array.isArray(items) ? items.length - 1 : 0)}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              التالي
            </button>
            <button
              type="button"
              onClick={() => navigateToItem("last")}
              disabled={(Array.isArray(items) ? items.length === 0 : true) || currentIndex === (Array.isArray(items) ? items.length - 1 : 0)}
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
