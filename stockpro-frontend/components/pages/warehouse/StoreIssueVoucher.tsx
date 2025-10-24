import React, { useState, useEffect, useRef, useCallback } from "react";
import DataTableModal from "../../common/DataTableModal";
import { ListIcon, PrintIcon, SearchIcon, TrashIcon } from "../../icons";
import type {
  CompanyInfo,
  StoreVoucherItem,
  Branch,
  StoreIssueVoucher as StoreIssueVoucherType,
} from "../../../types";
import { useModal } from "../../common/ModalProvider.tsx";
import { useToast } from "../../common/ToastProvider.tsx";

type SelectableItem = { id: string; name: string; unit: string; stock: number };

interface StoreIssueVoucherProps {
  title: string;
  companyInfo: CompanyInfo;
  items: SelectableItem[];
  branches: Branch[];
  vouchers: StoreIssueVoucherType[];
  onSave: (voucher: StoreIssueVoucherType) => void;
  onDelete: (id: string) => void;
}

const DocumentHeader: React.FC<{ companyInfo: CompanyInfo }> = ({
  companyInfo,
}) => (
  <div className="flex justify-between items-start p-4 bg-white">
    <div className="flex items-center gap-4">
      {companyInfo.logo && (
        <img
          src={companyInfo.logo}
          alt="Company Logo"
          className="h-20 w-auto object-contain"
        />
      )}
      <div>
        <h2 className="text-2xl font-bold text-brand-dark">
          {companyInfo.name}
        </h2>
        <p className="text-sm text-gray-600">{companyInfo.address}</p>
        <p className="text-sm text-gray-600">هاتف: {companyInfo.phone}</p>
      </div>
    </div>
    <div className="text-left text-sm">
      <p>
        <span className="font-semibold">الرقم الضريبي:</span>{" "}
        {companyInfo.taxNumber}
      </p>
      <p>
        <span className="font-semibold">السجل التجاري:</span>{" "}
        {companyInfo.commercialReg}
      </p>
    </div>
  </div>
);

const StoreIssueVoucher: React.FC<StoreIssueVoucherProps> = ({
  title,
  companyInfo,
  items: allItems,
  branches,
  vouchers,
  onSave,
  onDelete,
}) => {
  const [items, setItems] = useState<StoreVoucherItem[]>([]);
  const [voucherDetails, setVoucherDetails] = useState({
    id: "",
    date: new Date().toISOString().substring(0, 10),
    branch: branches.length > 0 ? branches[0].name : "",
  });
  const [isReadOnly, setIsReadOnly] = useState(true);
  const { showModal } = useModal();
  const { showToast } = useToast();

  const [activeItemSearch, setActiveItemSearch] = useState<{
    index: number;
    query: string;
  } | null>(null);
  const itemSearchRef = useRef<HTMLTableSectionElement>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const qtyInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const filteredItems =
    activeItemSearch && typeof activeItemSearch.query === "string"
      ? allItems.filter(
          (item) =>
            (item.name &&
              item.name
                .toLowerCase()
                .includes(activeItemSearch.query.toLowerCase())) ||
            (item.id &&
              typeof item.id === "string" &&
              item.id
                .toLowerCase()
                .includes(activeItemSearch.query.toLowerCase())),
        )
      : [];

  const handleNew = useCallback(() => {
    const nextIdNumber =
      vouchers.length > 0
        ? Math.max(...vouchers.map((v) => parseInt(v.id.split("-")[1]) || 0)) +
          1
        : 1;
    setCurrentIndex(-1);
    setItems([]);
    setVoucherDetails({
      id: `SIV-${String(nextIdNumber).padStart(5, "0")}`,
      date: new Date().toISOString().substring(0, 10),
      branch: branches.length > 0 ? branches[0].name : "",
    });
    setIsReadOnly(false);
  }, [vouchers, branches]);

  useEffect(() => {
    if (currentIndex >= 0 && vouchers[currentIndex]) {
      const v = vouchers[currentIndex];
      setVoucherDetails({ id: v.id, date: v.date, branch: v.branch });
      setItems(v.items);
      setIsReadOnly(true);
    } else {
      handleNew();
    }
  }, [currentIndex, vouchers, handleNew]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        itemSearchRef.current &&
        !itemSearchRef.current.contains(event.target as Node)
      ) {
        setActiveItemSearch(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeItemSearch) setHighlightedIndex(-1);
  }, [activeItemSearch]);

  const handleAddItem = () => {
    setItems([...items, { id: "", name: "", unit: "", qty: 1 }]);
  };

  const handleItemChange = (
    index: number,
    field: keyof StoreVoucherItem,
    value: any,
  ) => {
    const newItems = [...items];
    let item = { ...newItems[index], [field]: value };

    if (field === "name") setActiveItemSearch({ index, query: value });
    if (field === "qty") item.qty = parseInt(value) || 1;

    newItems[index] = item;
    setItems(newItems);
  };

  const handleSelectItem = (index: number, selectedItem: SelectableItem) => {
    const newItems = [...items];
    const currentItem = newItems[index];
    const item = { ...currentItem, ...selectedItem, qty: currentItem.qty || 1 };
    newItems[index] = item;
    setItems(newItems);
    setActiveItemSearch(null);
    setHighlightedIndex(-1);
    setTimeout(() => {
      qtyInputRefs.current[index]?.focus();
      qtyInputRefs.current[index]?.select();
    }, 0);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSelectItemFromModal = (selectedItem: SelectableItem) => {
    if (editingItemIndex === null) return;
    handleSelectItem(editingItemIndex, selectedItem);
    setIsItemModalOpen(false);
    setEditingItemIndex(null);
  };

  const handleItemSearchKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (!activeItemSearch || filteredItems.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % filteredItems.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(
          (prev) => (prev - 1 + filteredItems.length) % filteredItems.length,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex > -1 && filteredItems[highlightedIndex]) {
          handleSelectItem(
            activeItemSearch.index,
            filteredItems[highlightedIndex],
          );
        }
        break;
      case "Escape":
        e.preventDefault();
        setActiveItemSearch(null);
        break;
      default:
        break;
    }
  };

  const handleSave = () => {
    if (items.length === 0 || items.some((i) => !i.id || !i.name)) {
      showToast("لا يمكن حفظ إذن فارغ أو يحتوي على أسطر غير مكتملة.");
      return;
    }
    const voucherData: StoreIssueVoucherType = {
      id: voucherDetails.id,
      date: voucherDetails.date,
      branch: voucherDetails.branch,
      items,
    };
    onSave(voucherData);
    showToast("تم حفظ الإذن بنجاح!");
    handleNew();
  };

  const handleEdit = () => {
    if (currentIndex < 0) return;
    showModal({
      title: "تأكيد التعديل",
      message: "هل أنت متأكد من رغبتك في تعديل بيانات هذا الإذن؟",
      onConfirm: () => setIsReadOnly(false),
      type: "edit",
      showPassword: true,
    });
  };

  const handleDelete = () => {
    if (currentIndex === -1) return;
    showModal({
      title: "تأكيد الحذف",
      message: "هل أنت متأكد من حذف هذا الإذن؟",
      onConfirm: () => {
        onDelete(vouchers[currentIndex].id);
        showToast("تم الحذف بنجاح.");
        if (vouchers.length <= 1) handleNew();
        else setCurrentIndex((prev) => Math.max(0, prev - 1));
      },
      type: "delete",
      showPassword: true,
    });
  };

  const navigate = (index: number) => {
    if (vouchers.length > 0) {
      setCurrentIndex(Math.max(0, Math.min(vouchers.length - 1, index)));
    }
  };

  const handleSelectVoucherFromSearch = (row: { id: string }) => {
    const index = vouchers.findIndex((v) => v.id === row.id);
    if (index > -1) setCurrentIndex(index);
    setIsSearchModalOpen(false);
  };

  const inputStyle =
    "block w-full bg-brand-green-bg border-2 border-brand-green rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green py-3 px-4 disabled:bg-gray-200 disabled:cursor-not-allowed";
  const tableInputStyle =
    "text-center bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-green rounded p-1 w-full disabled:bg-transparent";

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="border-2 border-brand-green rounded-lg mb-4">
          <DocumentHeader companyInfo={companyInfo} />
        </div>

        <div className="border-2 border-brand-green rounded-lg mb-4">
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4 border-b-2 border-dashed border-gray-300 pb-2 text-brand-dark">
              {title}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                placeholder="رقم السند"
                className={inputStyle + " bg-gray-200"}
                value={voucherDetails.id}
                readOnly
              />
              <input
                type="date"
                className={inputStyle}
                value={voucherDetails.date}
                onChange={(e) =>
                  setVoucherDetails({ ...voucherDetails, date: e.target.value })
                }
                disabled={isReadOnly}
              />
              <select
                className={inputStyle}
                value={voucherDetails.branch}
                onChange={(e) =>
                  setVoucherDetails({
                    ...voucherDetails,
                    branch: e.target.value,
                  })
                }
                disabled={isReadOnly}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto my-4 border-2 border-brand-green rounded-lg">
          <table className="min-w-full">
            <thead className="bg-brand-green">
              <tr className="divide-x divide-green-400">
                <th className="px-2 py-3 w-10 text-center text-sm font-semibold text-white uppercase">
                  م
                </th>
                <th className="px-2 py-3 w-32 text-right text-sm font-semibold text-white uppercase">
                  رقم الصنف
                </th>
                <th className="px-2 py-3 w-2/5 text-right text-sm font-semibold text-white uppercase">
                  الصنف
                </th>
                <th className="px-2 py-3 w-32 text-center text-sm font-semibold text-white uppercase">
                  الوحدة
                </th>
                <th className="px-2 py-3 w-32 text-center text-sm font-semibold text-white uppercase">
                  الكمية
                </th>
                <th className="px-2 py-3 w-16 text-center"></th>
              </tr>
            </thead>
            <tbody ref={itemSearchRef}>
              {items.map((item, index) => (
                <tr
                  key={index}
                  className="divide-x divide-gray-200 border-b border-gray-200 last:border-b-0 hover:bg-brand-green-bg transition-colors duration-150"
                >
                  <td className="p-2 align-middle text-center">{index + 1}</td>
                  <td className="p-2 align-middle">
                    <input
                      type="text"
                      value={item.id}
                      onChange={(e) =>
                        handleItemChange(index, "id", e.target.value)
                      }
                      className={tableInputStyle}
                      disabled={isReadOnly}
                    />
                  </td>
                  <td className="p-2 align-middle relative">
                    <div className="flex items-center">
                      <input
                        type="text"
                        placeholder="ابحث عن صنف..."
                        value={item.name}
                        onChange={(e) =>
                          handleItemChange(index, "name", e.target.value)
                        }
                        onFocus={() =>
                          setActiveItemSearch({ index, query: item.name })
                        }
                        onKeyDown={handleItemSearchKeyDown}
                        className="bg-transparent w-full focus:outline-none p-1"
                        disabled={isReadOnly}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItemIndex(index);
                          setIsItemModalOpen(true);
                        }}
                        className="p-1 text-gray-400 hover:text-brand-green"
                        disabled={isReadOnly}
                      >
                        <ListIcon className="w-5 h-5" />
                      </button>
                    </div>
                    {activeItemSearch?.index === index &&
                      filteredItems.length > 0 &&
                      !isReadOnly && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {filteredItems.map((result, idx) => (
                            <div
                              key={result.id}
                              onClick={() => handleSelectItem(index, result)}
                              className={`p-2 cursor-pointer ${idx === highlightedIndex ? "bg-brand-green text-white" : "hover:bg-brand-green-bg"}`}
                              onMouseEnter={() => setHighlightedIndex(idx)}
                            >
                              {result.name} ({result.id})
                            </div>
                          ))}
                        </div>
                      )}
                  </td>
                  <td className="p-2 align-middle">
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) =>
                        handleItemChange(index, "unit", e.target.value)
                      }
                      className={tableInputStyle}
                      disabled={isReadOnly}
                    />
                  </td>
                  <td className="p-2 align-middle">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) =>
                        handleItemChange(index, "qty", e.target.value)
                      }
                      ref={(el) => {
                        if (el) qtyInputRefs.current[index] = el;
                      }}
                      className={tableInputStyle}
                      disabled={isReadOnly}
                    />
                  </td>
                  <td className="p-2 align-middle text-center">
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-500 p-1 rounded-full hover:bg-red-100 hover:text-red-700 disabled:text-gray-400 disabled:hover:bg-transparent"
                      disabled={isReadOnly}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={handleAddItem}
          className="mb-4 px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
          disabled={isReadOnly}
        >
          اضافة سطر
        </button>

        <div className="bg-gray-50 -mx-6 -mb-6 mt-4 p-6 rounded-b-lg">
          <div className="flex justify-around items-center mt-8 text-center text-sm font-semibold">
            <div>
              <p>أمين المخزن</p>
              <p className="mt-12">..............................</p>
            </div>
            <div>
              <p>المستلم</p>
              <p className="mt-12">..............................</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-gray-200 flex flex-col items-center space-y-4">
            <div className="flex justify-center gap-2 flex-wrap">
              <button
                onClick={handleNew}
                className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold"
              >
                جديد
              </button>
              <button
                onClick={handleSave}
                disabled={isReadOnly || items.length === 0}
                className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold disabled:bg-gray-400"
              >
                حفظ
              </button>
              <button
                onClick={handleEdit}
                disabled={currentIndex < 0 || !isReadOnly}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 font-semibold disabled:bg-gray-400"
              >
                تعديل
              </button>
              <button
                onClick={handleDelete}
                disabled={currentIndex < 0}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold disabled:bg-gray-400"
              >
                حذف
              </button>
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold"
              >
                بحث
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300 font-semibold flex items-center"
              >
                <PrintIcon className="mr-2 w-5 h-5" /> طباعة
              </button>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => navigate(vouchers.length - 1)}
                disabled={
                  currentIndex >= vouchers.length - 1 || vouchers.length === 0
                }
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                الأخير
              </button>
              <button
                onClick={() => navigate(currentIndex + 1)}
                disabled={
                  currentIndex >= vouchers.length - 1 || vouchers.length === 0
                }
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                التالي
              </button>
              <div className="px-4 py-2 bg-brand-green-bg border-2 border-brand-green rounded-md">
                <span className="font-bold">
                  {currentIndex > -1
                    ? `${currentIndex + 1} / ${vouchers.length}`
                    : `جديد`}
                </span>
              </div>
              <button
                onClick={() => navigate(currentIndex - 1)}
                disabled={currentIndex <= 0}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                السابق
              </button>
              <button
                onClick={() => navigate(0)}
                disabled={currentIndex <= 0}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                الأول
              </button>
            </div>
          </div>
        </div>
      </div>
      <DataTableModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title="قائمة الأصناف"
        columns={[
          { Header: "الكود", accessor: "id" },
          { Header: "الاسم", accessor: "name" },
          { Header: "الرصيد", accessor: "stock" },
          { Header: "الوحدة", accessor: "unit" },
        ]}
        data={allItems}
        onSelectRow={handleSelectItemFromModal}
      />
      <DataTableModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        title="بحث عن إذن صرف"
        columns={[
          { Header: "الرقم", accessor: "id" },
          { Header: "التاريخ", accessor: "date" },
          { Header: "الفرع", accessor: "branch" },
        ]}
        data={vouchers}
        onSelectRow={handleSelectVoucherFromSearch}
      />
    </>
  );
};

export default StoreIssueVoucher;
