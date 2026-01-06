import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "../../common/ToastProvider";
import { useCustomers } from "../../hook/useCustomers";
import { useTitle } from "../../context/TitleContext";
import PermissionWrapper from "../../common/PermissionWrapper";
import {
  Resources,
  Actions,
  buildPermission,
} from "../../../enums/permissions.enum";

interface AddCustomerProps {
  title: string;
  editingId: string | null;
  onNavigate: (key: string, label: string, id?: string | null) => void;
}

const emptyCustomer = {
  code: "",
  name: "",
  commercialReg: "",
  taxNumber: "",
  nationalAddress: "",
  phone: "",
  openingBalance: "",
  creditLimit: "",
};

const AddCustomer: React.FC<AddCustomerProps> = ({
  title,
  editingId,
  onNavigate,
}) => {
  const { customers, isLoading, handleSave, handleDeleteClick } =
    useCustomers();
  const [customerData, setCustomerData] = useState<any>(emptyCustomer);
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [customerPosition, setCustomerPosition] = useState<number | null>(null);
  const { setTitle } = useTitle();
  const { showToast } = useToast();
  const location = useLocation();

  useEffect(() => {
    // Only set title if we're still on this page
    const isOnCustomersPage = location.pathname.startsWith("/customers/add");
    
    if (!isOnCustomersPage) {
      setTitle("");
      return;
    }

    if (editingId !== null) {
      const index = customers.findIndex((c) => c.id === editingId);
      if (index !== -1) {
        const customer = customers[index];
        setCustomerData({
          ...customer,
          openingBalance:
            customer.openingBalance === null || customer.openingBalance === undefined
              ? ""
              : String(customer.openingBalance),
          creditLimit:
            (customer as any).creditLimit === null || (customer as any).creditLimit === undefined
              ? ""
              : String((customer as any).creditLimit),
        });
        setCurrentIndex(index);
        setCustomerPosition(index + 1);
        setIsReadOnly(true);
        
        // Update title context for the header
        setTitle(`تعديل عميل #${index + 1}`);
      }
    } else {
      setCustomerData(emptyCustomer);
      setIsReadOnly(false);
      setCurrentIndex(-1);
      setCustomerPosition(null);
      setTitle(`إضافة عميل`);
    }
  }, [editingId, customers, setTitle, location.pathname]);

  // Reset title when navigating away from this page
  useEffect(() => {
    const isOnCustomersPage = location.pathname.startsWith("/customers/add");
    if (!isOnCustomersPage) {
      setTitle("");
    }
  }, [location.pathname, setTitle]);

  // Cleanup: Reset title when component unmounts
  useEffect(() => {
    return () => {
      setTitle("");
    };
  }, [setTitle]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerData((prev: any) => ({
      ...prev,
      [name]: name === "openingBalance" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleOpeningBalanceChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    // Allow empty string, negative sign, and valid numbers (including decimals)
    if (value === "" || value === "-" || /^-?\d*\.?\d*$/.test(value)) {
      setCustomerData((prev: any) => ({
        ...prev,
        openingBalance: value === "" || value === "-" ? value : parseFloat(value) || 0,
      }));
    }
  };

  const handleCreditLimitChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    // Allow empty string, negative sign, and valid numbers (including decimals)
    // Keep as string to preserve what user types until save
    if (value === "" || value === "-" || /^-?\d*\.?\d*$/.test(value)) {
      setCustomerData((prev: any) => ({
        ...prev,
        creditLimit: value,
      }));
    }
  };

  const onSave = async () => {
    // Helper function to convert string to number, preserving the actual value entered
    const parseNumericValue = (value: string | number | undefined): number | undefined => {
      if (value === undefined || value === null) return undefined;
      if (typeof value === "number") {
        // If already a number, return it (including 0)
        return isNaN(value) ? undefined : value;
      }
      if (typeof value === "string") {
        const trimmed = value.trim();
        // Empty string or just "-" means no value entered
        if (trimmed === "" || trimmed === "-") return undefined;
        const parsed = parseFloat(trimmed);
        // Return the parsed number (including 0 if user entered 0)
        // Only return undefined if parsing failed (NaN)
        return isNaN(parsed) ? undefined : parsed;
      }
      return undefined;
    };

    const dataToSave = {
      ...customerData,
      openingBalance:
        typeof customerData.openingBalance === "string"
          ? parseFloat(customerData.openingBalance) || 0
          : customerData.openingBalance,
      creditLimit: parseNumericValue(customerData.creditLimit),
    };
    await handleSave(dataToSave, editingId || undefined);
    if (!("id" in customerData)) {
      // After saving new customer, navigate back to list
      onNavigate("customers_list", "قائمة العملاء");
    } else {
      setIsReadOnly(true);
    }
  };

  const handleDelete = () => {
    if ("id" in customerData) {
      handleDeleteClick(customerData);
    }
  };

  const handleEdit = () => {
    setIsReadOnly(false);
  };

  const navigateBy = (direction: "first" | "prev" | "next" | "last") => {
    if (!Array.isArray(customers) || customers.length === 0) return;

    let newIndex = currentIndex;
    switch (direction) {
      case "first": newIndex = 0; break;
      case "last": newIndex = customers.length - 1; break;
      case "next": newIndex = currentIndex === -1 ? 0 : Math.min(customers.length - 1, currentIndex + 1); break;
      case "prev": newIndex = currentIndex === -1 ? customers.length - 1 : Math.max(0, currentIndex - 1); break;
    }
    if (newIndex >= 0 && newIndex < customers.length) {
      const newId = customers[newIndex].id;
      onNavigate("add_customer", `تعديل عميل #${newId}`, newId);
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
        {customerPosition ? `تعديل عميل #${customerPosition}` : title}
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
              كود العميل
            </label>
            <input
              type="text"
              name="code"
              id="code"
              value={customerData.code}
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
              type="text"
              name="openingBalance"
              id="openingBalance"
              value={customerData.openingBalance}
              onChange={handleOpeningBalanceChange}
              className={inputStyle}
              disabled={isReadOnly}
              inputMode="numeric"
            />
          </div>
          <div>
            <label
              htmlFor="creditLimit"
              className="block text-sm font-medium text-gray-700"
            >
              الحد الائتماني
            </label>
            <input
              type="text"
              name="creditLimit"
              id="creditLimit"
              value={customerData.creditLimit}
              onChange={handleCreditLimitChange}
              className={inputStyle}
              disabled={isReadOnly}
              inputMode="numeric"
            />
          </div>
        </div>
        <div className="mt-8 pt-6 border-t-2 border-gray-200 flex flex-col items-start space-y-4">
          <div className="flex justify-start gap-2">
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.CUSTOMERS,
                Actions.CREATE,
              )}
            >
              <button
                type="button"
                onClick={() => onNavigate("add_customer", "إضافة عميل")}
                className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold"
              >
                جديد
              </button>
            </PermissionWrapper>
            {isReadOnly ? (
              <PermissionWrapper
                requiredPermission={buildPermission(
                  Resources.CUSTOMERS,
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
                    Resources.CUSTOMERS,
                    "id" in customerData ? Actions.UPDATE : Actions.CREATE,
                  )}
                >
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold"
                  >
                    حفظ
                  </button>
                </PermissionWrapper>
                {"id" in customerData && (
                  <button
                    type="button"
                    onClick={() => {
                      // Reload the customer data to reset any changes
                      const index = customers.findIndex(
                        (c) => c.id === customerData.id,
                      );
                      if (index !== -1) {
                        const customer = customers[index];
                        setCustomerData({
                          ...customer,
                          openingBalance:
                            customer.openingBalance === null ||
                            customer.openingBalance === undefined
                              ? ""
                              : String(customer.openingBalance),
                          creditLimit:
                            (customer as any).creditLimit === null ||
                            (customer as any).creditLimit === undefined
                              ? ""
                              : String((customer as any).creditLimit),
                        });
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
                Resources.CUSTOMERS,
                Actions.DELETE,
              )}
            >
              <button
                type="button"
                onClick={handleDelete}
                disabled={!("id" in customerData)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold disabled:bg-gray-400"
              >
                حذف
              </button>
            </PermissionWrapper>
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
              onClick={() => navigateBy("first")}
              disabled={(Array.isArray(customers) ? customers.length === 0 : true) || currentIndex === 0}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              الأول
            </button>
            <button
              type="button"
              onClick={() => navigateBy("prev")}
              disabled={(Array.isArray(customers) ? customers.length === 0 : true) || currentIndex === 0}
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
              onClick={() => navigateBy("next")}
              disabled={(Array.isArray(customers) ? customers.length === 0 : true) || currentIndex === customers.length - 1}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              التالي
            </button>
            <button
              type="button"
              onClick={() => navigateBy("last")}
              disabled={(Array.isArray(customers) ? customers.length === 0 : true) || currentIndex === customers.length - 1}
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
