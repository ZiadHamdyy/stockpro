import React, { useState, useEffect } from "react";
import type { Customer } from "../../../types";
import { useModal } from "../../common/ModalProvider";
import { useToast } from "../../common/ToastProvider";

interface AddCustomerProps {
  title: string;
  editingId: number | null;
  customers: Customer[];
  onSave: (customer: Customer | Omit<Customer, "id">) => void;
  onDelete: (id: number) => void;
  onNavigate: (key: string, label: string, id?: number | null) => void;
}

const emptyCustomer: Omit<Customer, "id"> = {
  code: "",
  name: "",
  commercialReg: "",
  taxNumber: "",
  nationalAddress: "",
  phone: "",
  openingBalance: 0,
};

const AddCustomer: React.FC<AddCustomerProps> = ({
  title,
  editingId,
  customers,
  onSave,
  onDelete,
  onNavigate,
}) => {
  const [customerData, setCustomerData] = useState<
    Customer | Omit<Customer, "id">
  >(emptyCustomer);
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const { showModal } = useModal();
  const { showToast } = useToast();

  useEffect(() => {
    if (editingId !== null) {
      const index = customers.findIndex((c) => c.id === editingId);
      if (index !== -1) {
        setCustomerData(customers[index]);
        setCurrentIndex(index);
        setIsReadOnly(true);
      }
    } else {
      const nextCodeNumber =
        customers.length > 0
          ? Math.max(
              ...customers.map(
                (c) => parseInt(c.code.replace("C", ""), 10) || 0,
              ),
            ) + 1
          : 1;
      const newCode = `C${String(nextCodeNumber).padStart(3, "0")}`;
      setCustomerData({ ...emptyCustomer, code: newCode });
      setIsReadOnly(false);
      setCurrentIndex(-1);
    }
  }, [editingId, customers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerData((prev) => ({
      ...prev,
      [name]: name === "openingBalance" ? parseFloat(value) : value,
    }));
  };

  const handleSave = () => {
    onSave(customerData);
    showToast(`تم حفظ العميل "${customerData.name}" بنجاح!`);
    if (!("id" in customerData)) {
      // After saving, we expect the parent to add the new customer and update the list
    } else {
      setIsReadOnly(true);
    }
  };

  const handleDelete = () => {
    if ("id" in customerData) {
      showModal({
        title: "تأكيد الحذف",
        message: `هل أنت متأكد من حذف العميل "${customerData.name}"؟`,
        onConfirm: () => {
          onDelete(customerData.id as number);
          showToast("تم الحذف بنجاح.");
        },
        type: "delete",
      });
    }
  };

  const handleEdit = () => {
    showModal({
      title: "تأكيد التعديل",
      message: "هل أنت متأكد من رغبتك في تعديل بيانات هذا العميل؟",
      onConfirm: () => setIsReadOnly(false),
      type: "edit",
    });
  };

  const navigate = (direction: "first" | "prev" | "next" | "last") => {
    let newIndex = -1;
    if (customers.length === 0) return;

    switch (direction) {
      case "first":
        newIndex = 0;
        break;
      case "prev":
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case "next":
        newIndex = Math.min(customers.length - 1, currentIndex + 1);
        break;
      case "last":
        newIndex = customers.length - 1;
        break;
    }

    if (newIndex !== -1) {
      const newId = customers[newIndex].id;
      onNavigate("add_customer", `تعديل عميل #${newId}`, newId);
    }
  };

  const inputStyle =
    "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4 disabled:bg-gray-200 disabled:text-gray-500";

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
              كود العميل
            </label>
            <input
              type="text"
              name="code"
              id="code"
              value={customerData.code}
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
              اسم العميل
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={customerData.name}
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
              value={customerData.commercialReg}
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
              value={customerData.taxNumber}
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
              value={customerData.nationalAddress}
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
              value={customerData.phone}
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
              value={customerData.openingBalance}
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
              onClick={() => onNavigate("add_customer", "إضافة عميل")}
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
              disabled={!("id" in customerData)}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold disabled:bg-gray-400"
            >
              حذف
            </button>
            <button
              type="button"
              onClick={() => onNavigate("customers_list", "قائمة العملاء")}
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
            <div className="px-4 py-2 bg-brand-blue-bg border-2 border-brand-blue rounded-md">
              <span className="font-bold">
                {currentIndex > -1
                  ? `${currentIndex + 1} / ${customers.length}`
                  : `سجل جديد`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate("next")}
              disabled={currentIndex >= customers.length - 1}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              التالي
            </button>
            <button
              type="button"
              onClick={() => navigate("last")}
              disabled={currentIndex >= customers.length - 1}
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

export default AddCustomer;
