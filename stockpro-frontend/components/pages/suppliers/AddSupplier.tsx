import React, { useState, useEffect } from "react";
import type { Supplier } from "../../../types";
import { useModal } from "../../common/ModalProvider.tsx";
import { useToast } from "../../common/ToastProvider.tsx";

interface AddSupplierProps {
  title: string;
  editingId: number | null;
  suppliers: Supplier[];
  onSave: (supplier: Supplier | Omit<Supplier, "id">) => void;
  onDelete: (id: number) => void;
  onNavigate: (key: string, label: string, id?: number | null) => void;
}

const emptySupplier: Omit<Supplier, "id"> = {
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
  suppliers,
  onSave,
  onDelete,
  onNavigate,
}) => {
  const [supplierData, setSupplierData] = useState<
    Supplier | Omit<Supplier, "id">
  >(emptySupplier);
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const { showModal } = useModal();
  const { showToast } = useToast();

  useEffect(() => {
    if (editingId !== null) {
      const index = suppliers.findIndex((c) => c.id === editingId);
      if (index !== -1) {
        setSupplierData(suppliers[index]);
        setCurrentIndex(index);
        setIsReadOnly(true);
      }
    } else {
      const nextCodeNumber =
        suppliers.length > 0
          ? Math.max(
              ...suppliers.map(
                (s) => parseInt(s.code.replace("S", ""), 10) || 0,
              ),
            ) + 1
          : 1;
      const newCode = `S${String(nextCodeNumber).padStart(3, "0")}`;
      setSupplierData({ ...emptySupplier, code: newCode });
      setIsReadOnly(false);
      setCurrentIndex(-1);
    }
  }, [editingId, suppliers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSupplierData((prev) => ({
      ...prev,
      [name]: name === "openingBalance" ? parseFloat(value) : value,
    }));
  };

  const handleSave = () => {
    onSave(supplierData);
    showToast(`تم حفظ المورد "${supplierData.name}" بنجاح!`);
    if (!("id" in supplierData)) {
      // New supplier saved
    } else {
      setIsReadOnly(true);
    }
  };

  const handleDelete = () => {
    if ("id" in supplierData) {
      showModal({
        title: "تأكيد الحذف",
        message: `هل أنت متأكد من حذف المورد "${supplierData.name}"؟`,
        onConfirm: () => {
          onDelete(supplierData.id as number);
          showToast("تم الحذف بنجاح.");
        },
        type: "delete",
      });
    }
  };

  const handleEdit = () => {
    showModal({
      title: "تأكيد التعديل",
      message: "هل أنت متأكد من رغبتك في تعديل بيانات هذا المورد؟",
      onConfirm: () => setIsReadOnly(false),
      type: "edit",
    });
  };

  const navigate = (direction: "first" | "prev" | "next" | "last") => {
    let newIndex = -1;
    if (suppliers.length === 0) return;

    switch (direction) {
      case "first":
        newIndex = 0;
        break;
      case "prev":
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case "next":
        newIndex = Math.min(suppliers.length - 1, currentIndex + 1);
        break;
      case "last":
        newIndex = suppliers.length - 1;
        break;
    }

    if (newIndex !== -1) {
      const newId = suppliers[newIndex].id;
      onNavigate("add_supplier", `تعديل مورد #${newId}`, newId);
    }
  };

  const inputStyle =
    "mt-1 block w-full bg-brand-green-bg border-2 border-brand-green rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green-active focus:border-brand-green-active py-3 px-4 disabled:bg-gray-200 disabled:text-gray-500";

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
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
              readOnly
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
              <button
                type="button"
                onClick={handleEdit}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 font-semibold"
              >
                تعديل
              </button>
            ) : (
              <button
                type="submit"
                className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold"
              >
                حفظ
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={!("id" in supplierData)}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold disabled:bg-gray-400"
            >
              حذف
            </button>
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
              onClick={() => navigate("first")}
              disabled={currentIndex <= 0}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              الأول
            </button>
            <button
              type="button"
              onClick={() => navigate("prev")}
              disabled={currentIndex <= 0}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              السابق
            </button>
            <div className="px-4 py-2 bg-brand-green-bg border-2 border-brand-green rounded-md">
              <span className="font-bold">
                {currentIndex > -1
                  ? `${currentIndex + 1} / ${suppliers.length}`
                  : `سجل جديد`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate("next")}
              disabled={currentIndex >= suppliers.length - 1}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              التالي
            </button>
            <button
              type="button"
              onClick={() => navigate("last")}
              disabled={currentIndex >= suppliers.length - 1}
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
