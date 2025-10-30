import React, { useState, useEffect } from "react";
import { useToast } from "../../common/ToastProvider";
import { useSuppliers } from "../../hook/useSuppliers";
import { useTitle } from "../../context/TitleContext";
import PermissionWrapper from "../../common/PermissionWrapper";
import {
  Resources,
  Actions,
  buildPermission,
} from "../../../enums/permissions.enum";

interface AddSupplierProps {
  title: string;
  editingId: string | null;
  onNavigate: (key: string, label: string, id?: string | null) => void;
}

const emptySupplier = {
  code: "",
  name: "",
  commercialReg: "",
  taxNumber: "",
  nationalAddress: "",
  phone: "",
  openingBalance: 0,
};

const AddSupplier: React.FC<AddSupplierProps> = ({
  title,
  editingId,
  onNavigate,
}) => {
  const { suppliers, isLoading, handleSave, handleDeleteClick } =
    useSuppliers();
  const [supplierData, setSupplierData] = useState<any>(emptySupplier);
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [supplierPosition, setSupplierPosition] = useState<number | null>(null);
  const { setTitle } = useTitle();
  const { showToast } = useToast();

  useEffect(() => {
    if (editingId !== null) {
      const index = suppliers.findIndex((s) => s.id === editingId);
      if (index !== -1) {
        setSupplierData(suppliers[index]);
        setCurrentIndex(index);
        setSupplierPosition(index + 1);
        setIsReadOnly(true);
        
        // Update title context for the header
        setTitle(`تعديل مورد #${index + 1}`);
      }
    } else {
      setSupplierData(emptySupplier);
      setIsReadOnly(false);
      setCurrentIndex(-1);
      setSupplierPosition(null);
      setTitle(`إضافة مورد`);
    }
  }, [editingId, suppliers, setTitle]);

  // Cleanup: Reset title when component unmounts
  useEffect(() => {
    return () => {
      setTitle("");
    };
  }, [setTitle]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSupplierData((prev: any) => ({
      ...prev,
      [name]: name === "openingBalance" ? parseFloat(value) : value,
    }));
  };

  const onSave = async () => {
    await handleSave(supplierData, editingId || undefined);
    if (!("id" in supplierData)) {
      // After saving new supplier, navigate back to list
      onNavigate("suppliers_list", "قائمة الموردين");
    } else {
      setIsReadOnly(true);
    }
  };

  const handleDelete = () => {
    if ("id" in supplierData) {
      handleDeleteClick(supplierData);
    }
  };

  const handleEdit = () => {
    setIsReadOnly(false);
  };

  const navigateBy = (direction: "first" | "prev" | "next" | "last") => {
    if (!Array.isArray(suppliers) || suppliers.length === 0) return;
    let newIndex = currentIndex;
    switch (direction) {
      case "first": newIndex = 0; break;
      case "last": newIndex = suppliers.length - 1; break;
      case "next": newIndex = currentIndex === -1 ? 0 : Math.min(suppliers.length - 1, currentIndex + 1); break;
      case "prev": newIndex = currentIndex === -1 ? suppliers.length - 1 : Math.max(0, currentIndex - 1); break;
    }
    if (newIndex >= 0 && newIndex < suppliers.length) {
      const newId = suppliers[newIndex].id;
      onNavigate("add_supplier", `تعديل مورد #${newId}`, newId);
    }
  };

  const inputStyle =
    "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4 disabled:bg-gray-200 disabled:text-gray-500";

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4 text-brand-dark">
        {supplierPosition ? `تعديل مورد #${supplierPosition}` : title}
      </h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700"
            >
              كود المورد
            </label>
            <input
              type="text"
              name="code"
              id="code"
              value={supplierData.code}
              className={inputStyle}
              disabled
              required
            />
          </div>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              اسم المورد
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={supplierData.name}
              onChange={handleChange}
              className={inputStyle}
              disabled={isReadOnly}
              required
            />
          </div>
          <div>
            <label
              htmlFor="commercialReg"
              className="block text-sm font-medium text-gray-700"
            >
              السجل التجاري
            </label>
            <input
              type="text"
              name="commercialReg"
              id="commercialReg"
              value={supplierData.commercialReg}
              onChange={handleChange}
              className={inputStyle}
              disabled={isReadOnly}
            />
          </div>
          <div>
            <label
              htmlFor="taxNumber"
              className="block text-sm font-medium text-gray-700"
            >
              الرقم الضريبي
            </label>
            <input
              type="text"
              name="taxNumber"
              id="taxNumber"
              value={supplierData.taxNumber}
              onChange={handleChange}
              className={inputStyle}
              disabled={isReadOnly}
            />
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="nationalAddress"
              className="block text-sm font-medium text-gray-700"
            >
              العنوان الوطني
            </label>
            <input
              type="text"
              name="nationalAddress"
              id="nationalAddress"
              value={supplierData.nationalAddress}
              onChange={handleChange}
              className={inputStyle}
              disabled={isReadOnly}
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700"
            >
              رقم الهاتف
            </label>
            <input
              type="tel"
              name="phone"
              id="phone"
              value={supplierData.phone}
              onChange={handleChange}
              className={inputStyle}
              disabled={isReadOnly}
              required
            />
          </div>
          <div>
            <label
              htmlFor="openingBalance"
              className="block text-sm font-medium text-gray-700"
            >
              الرصيد الافتتاحي
            </label>
            <input
              type="number"
              name="openingBalance"
              id="openingBalance"
              value={supplierData.openingBalance}
              onChange={handleChange}
              className={inputStyle}
              disabled={isReadOnly}
            />
          </div>
        </div>
        <div className="mt-8 pt-6 border-t-2 border-gray-200 flex flex-col items-start space-y-4">
          <div className="flex justify-start gap-2">
            <button
              type="button"
              onClick={() => onNavigate("add_supplier", "إضافة مورد")}
              className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold"
            >
              جديد
            </button>
            {isReadOnly ? (
              <PermissionWrapper
                requiredPermission={buildPermission(
                  Resources.SUPPLIERS,
                  Actions.UPDATE,
                )}
              >
                <button
                  type="button"
                  onClick={handleEdit}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 font-semibold"
                >
                  تعديل
                </button>
              </PermissionWrapper>
            ) : (
              <>
                <PermissionWrapper
                  requiredPermission={buildPermission(
                    Resources.SUPPLIERS,
                    "id" in supplierData ? Actions.UPDATE : Actions.CREATE,
                  )}
                >
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold"
                  >
                    حفظ
                  </button>
                </PermissionWrapper>
                {"id" in supplierData && (
                  <button
                    type="button"
                    onClick={() => {
                      // Reload the supplier data to reset any changes
                      const index = suppliers.findIndex(
                        (s) => s.id === supplierData.id,
                      );
                      if (index !== -1) {
                        setSupplierData(suppliers[index]);
                      }
                      setIsReadOnly(true);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-semibold"
                  >
                    إلغاء
                  </button>
                )}
              </>
            )}
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.SUPPLIERS,
                Actions.DELETE,
              )}
            >
              <button
                type="button"
                onClick={handleDelete}
                disabled={!("id" in supplierData)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold disabled:bg-gray-400"
              >
                حذف
              </button>
            </PermissionWrapper>
            <button
              type="button"
              onClick={() => onNavigate("suppliers_list", "قائمة الموردين")}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold"
            >
              القائمة
            </button>
          </div>

          <div className="flex items-center justify-start gap-1">
            <button
              type="button"
              onClick={() => navigateBy("first")}
              disabled={(Array.isArray(suppliers) ? suppliers.length === 0 : true) || currentIndex === 0}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              الأول
            </button>
            <button
              type="button"
              onClick={() => navigateBy("prev")}
              disabled={(Array.isArray(suppliers) ? suppliers.length === 0 : true) || currentIndex === 0}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              السابق
            </button>
            <div className="px-4 py-2 bg-brand-blue-bg border-2 border-brand-blue rounded-md">
              <span className="font-bold">
                {currentIndex > -1
                  ? `${currentIndex + 1} / ${suppliers.length}`
                  : `سجل جديد`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigateBy("next")}
              disabled={(Array.isArray(suppliers) ? suppliers.length === 0 : true) || currentIndex === suppliers.length - 1}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              التالي
            </button>
            <button
              type="button"
              onClick={() => navigateBy("last")}
              disabled={(Array.isArray(suppliers) ? suppliers.length === 0 : true) || currentIndex === suppliers.length - 1}
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

export default AddSupplier;
