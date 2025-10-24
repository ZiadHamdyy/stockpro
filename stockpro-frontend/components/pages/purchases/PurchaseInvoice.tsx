import React, { useState, useEffect, useRef } from "react";
import DataTableModal from "../../common/DataTableModal";
import {
  BarcodeIcon,
  PdfIcon,
  ListIcon,
  PrintIcon,
  SearchIcon,
  TrashIcon,
} from "../../icons";
import { tafqeet } from "../../../utils/tafqeet";
import type {
  CompanyInfo,
  InvoiceItem,
  Supplier,
  Invoice,
  User,
  Item,
  Safe,
  Bank,
} from "../../../types";
import PurchaseInvoicePrintPreview from "./PurchaseInvoicePrintPreview";
import { useModal } from "../../common/ModalProvider";
import { useToast } from "../../common/ToastProvider";
import BarcodeScannerModal from "../../common/BarcodeScannerModal";

type SelectableItem = {
  id: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
  barcode?: string;
};

interface PurchaseInvoiceProps {
  title: string;
  vatRate: number;
  isVatEnabled: boolean;
  companyInfo: CompanyInfo;
  items: SelectableItem[];
  suppliers: Supplier[];
  invoices: Invoice[];
  onSave: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
  currentUser: User | null;
  viewingId: string | number | null;
  onClearViewingId: () => void;
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  safes: Safe[];
  banks: Bank[];
}

const InvoiceHeader: React.FC<{ companyInfo: CompanyInfo }> = ({
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

const PurchaseInvoice: React.FC<PurchaseInvoiceProps> = ({
  title,
  vatRate,
  isVatEnabled,
  companyInfo,
  items: allItems,
  suppliers: allSuppliers,
  invoices,
  onSave,
  onDelete,
  currentUser,
  viewingId,
  onClearViewingId,
  setItems: setGlobalItems,
  safes,
  banks,
}) => {
  const createEmptyItem = (): InvoiceItem => ({
    id: "",
    name: "",
    unit: "",
    qty: 1,
    price: 0,
    taxAmount: 0,
    total: 0,
  });

  const [items, setItems] = useState<InvoiceItem[]>(
    Array(6).fill(null).map(createEmptyItem),
  );
  const [totals, setTotals] = useState({
    subtotal: 0,
    discount: 0,
    tax: 0,
    net: 0,
  });
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit">("cash");
  const [invoiceDetails, setInvoiceDetails] = useState({
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().substring(0, 10),
  });
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [paymentTargetType, setPaymentTargetType] = useState<"safe" | "bank">(
    "safe",
  );
  const [paymentTargetId, setPaymentTargetId] = useState<number | null>(null);
  const { showModal } = useModal();
  const { showToast } = useToast();

  const [supplierQuery, setSupplierQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const supplierRef = useRef<HTMLDivElement>(null);

  const [activeItemSearch, setActiveItemSearch] = useState<{
    index: number;
    query: string;
  } | null>(null);
  const itemSearchRef = useRef<HTMLTableSectionElement>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const qtyInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const priceInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const tableInputSizerRef = useRef<HTMLSpanElement | null>(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const filteredSuppliers = supplierQuery
    ? allSuppliers.filter((s) =>
        s.name.toLowerCase().includes(supplierQuery.toLowerCase()),
      )
    : allSuppliers;

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

  const handleNew = () => {
    setCurrentIndex(-1);
    setItems(Array(6).fill(null).map(createEmptyItem));
    setTotals({ subtotal: 0, discount: 0, tax: 0, net: 0 });
    setPaymentMethod("cash");
    setInvoiceDetails({
      invoiceNumber: `PUR-${Math.floor(10000 + Math.random() * 90000)}`,
      invoiceDate: new Date().toISOString().substring(0, 10),
    });
    setSelectedSupplier(null);
    setSupplierQuery("");
    setPaymentTargetType("safe");
    setPaymentTargetId(safes.length > 0 ? safes[0].id : null);
    setIsReadOnly(false);
  };

  useEffect(() => {
    if (viewingId) {
      const index = invoices.findIndex((inv) => inv.id === viewingId);
      if (index !== -1) {
        setCurrentIndex(index);
      } else {
        showToast(`الفاتورة رقم ${viewingId} غير موجودة.`);
      }
      onClearViewingId();
    }
  }, [viewingId, invoices, onClearViewingId, showToast]);

  useEffect(() => {
    if (currentIndex >= 0 && invoices[currentIndex]) {
      const inv = invoices[currentIndex];
      setInvoiceDetails({ invoiceNumber: inv.id, invoiceDate: inv.date });
      setSelectedSupplier(inv.customerOrSupplier);
      setSupplierQuery(inv.customerOrSupplier?.name || "");
      setItems(inv.items);
      setTotals(inv.totals);
      setPaymentMethod(inv.paymentMethod);
      setPaymentTargetType(inv.paymentTargetType || "safe");
      setPaymentTargetId(inv.paymentTargetId || null);
      setIsReadOnly(true);
    } else {
      handleNew();
    }
  }, [currentIndex, invoices]);

  useEffect(() => {
    const sizer = document.createElement("span");
    sizer.style.position = "absolute";
    sizer.style.top = "-9999px";
    sizer.style.left = "-9999px";
    sizer.style.visibility = "hidden";
    sizer.style.whiteSpace = "pre";
    sizer.className = "font-sans text-base";
    document.body.appendChild(sizer);
    tableInputSizerRef.current = sizer;
    return () => {
      if (sizer.parentNode) sizer.parentNode.removeChild(sizer);
    };
  }, []);

  const autosizeInput = (input: HTMLInputElement | null) => {
    if (input && tableInputSizerRef.current) {
      tableInputSizerRef.current.textContent = input.value || input.placeholder;
      const newWidth = tableInputSizerRef.current.offsetWidth + 24;
      input.style.width = `${Math.max(80, newWidth)}px`;
    }
  };

  useEffect(() => {
    items.forEach((_, index) => {
      autosizeInput(qtyInputRefs.current[index]);
      autosizeInput(priceInputRefs.current[index]);
    });
  }, [items]);

  useEffect(() => {
    const subtotal = items.reduce(
      (acc, item) => acc + item.qty * item.price,
      0,
    );
    const taxTotal = isVatEnabled
      ? items.reduce((acc, item) => acc + item.taxAmount, 0)
      : 0;
    const net = subtotal + taxTotal - totals.discount;
    setTotals((prev) => ({ ...prev, subtotal, tax: taxTotal, net }));
  }, [items, totals.discount, isVatEnabled]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        itemSearchRef.current &&
        !itemSearchRef.current.contains(event.target as Node)
      )
        setActiveItemSearch(null);
      if (
        supplierRef.current &&
        !supplierRef.current.contains(event.target as Node)
      )
        setIsSupplierDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeItemSearch) setHighlightedIndex(-1);
  }, [activeItemSearch]);

  const handleAddItem = () => {
    setItems([...items, createEmptyItem()]);
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: any,
  ) => {
    const newItems = [...items];
    let item = { ...newItems[index], [field]: value };

    if (field === "name") setActiveItemSearch({ index, query: value });

    if (field === "qty" || field === "price") {
      const qty = parseFloat(item.qty as any) || 0;
      const price = parseFloat(item.price as any) || 0;
      const total = qty * price;
      item.total = total;
      item.taxAmount = isVatEnabled ? total * (vatRate / 100) : 0;
    }
    newItems[index] = item;
    setItems(newItems);
  };

  const handleSelectItem = (index: number, selectedItem: SelectableItem) => {
    const newItems = [...items];
    const currentItem = newItems[index];
    const item = { ...currentItem, ...selectedItem, qty: currentItem.qty || 1 };
    const total = item.qty * (item.price || 0);
    item.total = total;
    item.taxAmount = isVatEnabled ? total * (vatRate / 100) : 0;
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
    const newItems = items.filter((_, i) => i !== index);
    while (newItems.length < 6) {
      newItems.push(createEmptyItem());
    }
    setItems(newItems);
  };

  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplier({ id: supplier.id.toString(), name: supplier.name });
    setSupplierQuery(supplier.name);
    setIsSupplierDropdownOpen(false);
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

  const handleScanSuccess = (barcode: string) => {
    const foundItem = allItems.find((item) => item.barcode === barcode);
    if (foundItem) {
      const emptyRowIndex = items.findIndex((i) => !i.id && !i.name);
      const indexToFill = emptyRowIndex !== -1 ? emptyRowIndex : items.length;

      const newItems = [...items];
      if (emptyRowIndex === -1) {
        newItems.push(createEmptyItem());
      }

      const item = {
        ...newItems[indexToFill],
        ...foundItem,
        qty: 1,
        price: foundItem.price,
      };
      const total = item.qty * (item.price || 0);
      item.total = total;
      item.taxAmount = isVatEnabled ? total * (vatRate / 100) : 0;
      newItems[indexToFill] = item;

      setItems(newItems);

      showToast(`تم إضافة الصنف: ${foundItem.name}`);
    } else {
      showToast("الصنف غير موجود. لم يتم العثور على باركود مطابق.");
    }
  };

  const handleSave = () => {
    const finalItems = items.filter((i) => i.id && i.name && i.qty > 0);

    if (finalItems.length === 0) {
      showToast("الرجاء إضافة صنف واحد على الأقل للفاتورة.");
      return;
    }

    if (paymentMethod === "credit" && !selectedSupplier) {
      showToast("الرجاء اختيار المورد للفواتير الآجلة.");
      return;
    }

    const invoiceData: Invoice = {
      id: invoiceDetails.invoiceNumber,
      date: invoiceDetails.invoiceDate,
      customerOrSupplier: selectedSupplier,
      items: finalItems,
      totals,
      paymentMethod,
      userName: currentUser?.fullName || "غير محدد",
      branchName: currentUser?.branch || "غير محدد",
    };

    if (paymentMethod === "cash") {
      invoiceData.paymentTargetType = paymentTargetType;
      invoiceData.paymentTargetId = paymentTargetId;
    }

    onSave(invoiceData);

    // Update global items state
    setGlobalItems((prevItems) => {
      const newItems = [...prevItems];
      invoiceData.items.forEach((invItem) => {
        const itemIndex = newItems.findIndex((i) => i.code === invItem.id);
        if (itemIndex !== -1) {
          newItems[itemIndex] = {
            ...newItems[itemIndex],
            purchasePrice: invItem.price,
          };
        }
      });
      return newItems;
    });

    showToast("تم حفظ الفاتورة بنجاح! وتم تحديث سعر الشراء ورصيد الأصناف.");
    setIsReadOnly(true);
    const savedIndex = invoices.findIndex((inv) => inv.id === invoiceData.id);
    if (savedIndex !== -1) {
      setCurrentIndex(savedIndex);
    } else {
      setCurrentIndex(invoices.length);
    }
  };

  const handleEdit = () => {
    if (currentIndex < 0) return;
    showModal({
      title: "تأكيد التعديل",
      message:
        "هل أنت متأكد من رغبتك في تعديل بيانات هذه الفاتورة؟ لا يمكن تعديل الكميات بعد الحفظ.",
      onConfirm: () => setIsReadOnly(false),
      type: "edit",
      showPassword: true,
    });
  };

  const handleDelete = () => {
    if (currentIndex === -1) {
      showToast("لا يمكن حذف فاتورة جديدة لم يتم حفظها.");
      return;
    }
    showModal({
      title: "تأكيد الحذف",
      message:
        "هل أنت متأكد من حذف هذه الفاتورة؟ سيتم عكس تأثيرها على المخزون.",
      onConfirm: () => {
        const invoiceToDelete = invoices[currentIndex];
        onDelete(invoiceToDelete.id);
        // Revert stock changes
        setGlobalItems((prevItems) => {
          const newItems = [...prevItems];
          invoiceToDelete.items.forEach((invItem) => {
            const itemIndex = newItems.findIndex((i) => i.code === invItem.id);
            if (itemIndex !== -1) {
              newItems[itemIndex].stock -= invItem.qty;
            }
          });
          return newItems;
        });
        showToast("تم الحذف بنجاح.");
        if (invoices.length <= 1) {
          handleNew();
        } else {
          setCurrentIndex((prev) => Math.max(0, prev - 1));
        }
      },
      type: "delete",
      showPassword: true,
    });
  };

  const navigate = (index: number) => {
    if (invoices.length > 0) {
      setCurrentIndex(Math.max(0, Math.min(invoices.length - 1, index)));
    }
  };

  const handleSelectInvoiceFromSearch = (row: { id: string }) => {
    const index = invoices.findIndex((inv) => inv.id === row.id);
    if (index > -1) {
      setCurrentIndex(index);
    }
    setIsSearchModalOpen(false);
  };

  const inputStyle =
    "block w-full bg-brand-green-bg border-2 border-brand-green rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green py-3 px-4 disabled:bg-gray-200 disabled:cursor-not-allowed";
  const tableInputStyle =
    "text-center bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-green rounded p-1 disabled:bg-transparent";

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="border-2 border-brand-green rounded-lg mb-4">
          <InvoiceHeader companyInfo={companyInfo} />
        </div>

        <div className="border-2 border-brand-green rounded-lg">
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4 border-b-2 border-dashed border-gray-300 pb-2 text-brand-dark">
              {title}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-1">
                <div className="relative bg-brand-green-bg border-2 border-brand-green rounded-md p-1 flex items-center">
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    className={`w-1/2 py-2 rounded ${paymentMethod === "cash" ? "bg-brand-green text-white shadow" : "text-gray-600"} transition-all duration-200`}
                    disabled={isReadOnly}
                  >
                    نقداً
                  </button>
                  <button
                    onClick={() => setPaymentMethod("credit")}
                    className={`w-1/2 py-2 rounded ${paymentMethod === "credit" ? "bg-brand-green text-white shadow" : "text-gray-600"} transition-all duration-200`}
                    disabled={isReadOnly}
                  >
                    آجل
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="رقم الفاتورة"
                className={inputStyle}
                value={invoiceDetails.invoiceNumber}
                onChange={(e) =>
                  setInvoiceDetails({
                    ...invoiceDetails,
                    invoiceNumber: e.target.value,
                  })
                }
                readOnly={currentIndex > -1 || isReadOnly}
              />
              <input
                type="date"
                className={inputStyle}
                value={invoiceDetails.invoiceDate}
                onChange={(e) =>
                  setInvoiceDetails({
                    ...invoiceDetails,
                    invoiceDate: e.target.value,
                  })
                }
                disabled={isReadOnly}
              />
              <div className="relative" ref={supplierRef}>
                <input
                  type="text"
                  placeholder="ابحث عن مورد..."
                  className={inputStyle}
                  value={supplierQuery}
                  onChange={(e) => {
                    setSupplierQuery(e.target.value);
                    setIsSupplierDropdownOpen(true);
                    setSelectedSupplier(null);
                  }}
                  onFocus={() => setIsSupplierDropdownOpen(true)}
                  disabled={isReadOnly}
                />
                {isSupplierDropdownOpen && !isReadOnly && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredSuppliers.map((supplier) => (
                      <div
                        key={supplier.id}
                        onClick={() => handleSelectSupplier(supplier)}
                        className="p-2 cursor-pointer hover:bg-brand-green-bg"
                      >
                        {supplier.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {paymentMethod === "cash" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
                <div className="md:col-start-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    نوع الدفع
                  </label>
                  <select
                    value={paymentTargetType}
                    onChange={(e) =>
                      setPaymentTargetType(e.target.value as "safe" | "bank")
                    }
                    className={inputStyle}
                    disabled={isReadOnly}
                  >
                    <option value="safe">خزنة</option>
                    <option value="bank">بنك</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {paymentTargetType === "safe"
                      ? "اختر الخزنة"
                      : "اختر البنك"}
                  </label>
                  <select
                    value={paymentTargetId || ""}
                    onChange={(e) => setPaymentTargetId(Number(e.target.value))}
                    className={inputStyle}
                    disabled={isReadOnly}
                  >
                    <option value="">اختر...</option>
                    {(paymentTargetType === "safe" ? safes : banks).map(
                      (target) => (
                        <option key={target.id} value={target.id}>
                          {target.name}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto my-4 border-2 border-brand-green rounded-lg">
          <table className="min-w-full border-collapse">
            <thead className="bg-brand-green text-white">
              <tr>
                <th className="px-2 py-3 w-10 text-center text-sm font-semibold uppercase border border-green-300">
                  م
                </th>
                <th className="px-2 py-3 w-24 text-right text-sm font-semibold uppercase border border-green-300">
                  رقم الصنف
                </th>
                <th className="px-2 py-3 w-2/5 text-right text-sm font-semibold uppercase border border-green-300">
                  الصنف
                </th>
                <th className="px-2 py-3 w-20 text-center text-sm font-semibold uppercase border border-green-300">
                  الوحدة
                </th>
                <th
                  className="px-2 py-3 text-center text-sm font-semibold uppercase border border-green-300"
                  style={{ minWidth: "100px" }}
                >
                  الكمية
                </th>
                <th
                  className="px-2 py-3 text-center text-sm font-semibold uppercase border border-green-300"
                  style={{ minWidth: "100px" }}
                >
                  السعر
                </th>
                {isVatEnabled && (
                  <th className="px-2 py-3 w-36 text-center text-sm font-semibold uppercase border border-green-300">
                    مبلغ الضريبة
                  </th>
                )}
                <th className="px-2 py-3 w-36 text-center text-sm font-semibold uppercase border border-green-300">
                  الاجمالي
                </th>
                <th className="px-2 py-3 w-16 text-center border border-green-300"></th>
              </tr>
            </thead>
            <tbody ref={itemSearchRef} className="divide-y divide-gray-300">
              {items.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-brand-green-bg transition-colors duration-150"
                >
                  <td className="p-2 align-middle text-center border-x border-gray-300">
                    {index + 1}
                  </td>
                  <td className="p-2 align-middle border-x border-gray-300">
                    <input
                      type="text"
                      value={item.id}
                      onChange={(e) =>
                        handleItemChange(index, "id", e.target.value)
                      }
                      className={tableInputStyle + " w-full"}
                      disabled={isReadOnly}
                    />
                  </td>
                  <td className="p-2 align-middle relative border-x border-gray-300">
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
                    {activeItemSearch &&
                      activeItemSearch.index === index &&
                      filteredItems.length > 0 &&
                      !isReadOnly && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
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
                  <td className="p-2 align-middle border-x border-gray-300">
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) =>
                        handleItemChange(index, "unit", e.target.value)
                      }
                      className={tableInputStyle + " w-full"}
                      disabled={isReadOnly}
                    />
                  </td>
                  <td className="p-2 align-middle border-x border-gray-300">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => {
                        handleItemChange(
                          index,
                          "qty",
                          parseFloat(e.target.value),
                        );
                        autosizeInput(e.target);
                      }}
                      ref={(el) => {
                        if (el) qtyInputRefs.current[index] = el;
                      }}
                      className={tableInputStyle}
                      disabled={isReadOnly}
                    />
                  </td>
                  <td className="p-2 align-middle border-x border-gray-300">
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => {
                        handleItemChange(
                          index,
                          "price",
                          parseFloat(e.target.value),
                        );
                        autosizeInput(e.target);
                      }}
                      ref={(el) => {
                        if (el) priceInputRefs.current[index] = el;
                      }}
                      className={tableInputStyle}
                      disabled={isReadOnly}
                    />
                  </td>
                  {isVatEnabled && (
                    <td className="p-2 align-middle text-center border-x border-gray-300">
                      {item.taxAmount.toFixed(2)}
                    </td>
                  )}
                  <td className="p-2 align-middle text-center border-x border-gray-300">
                    {item.total.toFixed(2)}
                  </td>
                  <td className="p-2 align-middle text-center border-x border-gray-300">
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
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={handleAddItem}
            className="px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={isReadOnly}
          >
            اضافة سطر
          </button>
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isReadOnly}
          >
            <BarcodeIcon className="w-5 h-5" />
            <span>مسح باركود</span>
          </button>
        </div>

        <div className="bg-gray-50 -mx-6 -mb-6 mt-4 p-6 rounded-b-lg">
          <div className="flex justify-between items-start">
            <div className="w-1/2">
              <div className="mt-6 pt-4 text-center text-sm text-gray-600 font-semibold border-t-2 border-dashed border-gray-300 mr-4">
                استلمت البضاعة كاملة و بجودة سليمة
              </div>
            </div>
            <div className="w-full md:w-2/5">
              <div className="border-2 border-brand-green rounded-lg bg-white shadow-inner">
                <div className="flex justify-between p-3">
                  <span className="font-semibold text-gray-600">
                    الاجمالي قبل الضريبة
                  </span>
                  <span className="font-bold text-lg text-brand-dark">
                    {totals.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 border-t-2 border-dashed border-gray-200">
                  <span className="font-semibold text-gray-600">خصم</span>
                  <input
                    type="number"
                    value={totals.discount}
                    onChange={(e) =>
                      setTotals({
                        ...totals,
                        discount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-28 text-left p-1 rounded border-2 border-gray-600 bg-gray-700 text-white focus:ring-brand-green focus:border-brand-green font-bold"
                    disabled={isReadOnly}
                  />
                </div>
                {isVatEnabled && (
                  <div className="flex justify-between p-3 border-t-2 border-dashed border-gray-200">
                    <span className="font-semibold text-gray-600">
                      إجمالي الضريبة ({vatRate}%)
                    </span>
                    <span className="font-bold text-lg text-brand-dark">
                      {totals.tax.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xl text-brand-dark bg-brand-green-bg p-4 border-t-4 border-brand-green rounded-b-md">
                  <span>الصافي</span>
                  <span>{totals.net.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-300">
            <div className="bg-brand-green-bg p-3 rounded-md text-center text-brand-dark font-semibold">
              {tafqeet(totals.net, companyInfo.currency)}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t-2 border-gray-200 flex flex-col items-center space-y-4">
            <div className="flex justify-center gap-2 flex-wrap">
              <button
                onClick={handleNew}
                className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold"
              >
                جديد
              </button>
              <button
                onClick={handleSave}
                disabled={isReadOnly}
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
                onClick={() => setIsPreviewOpen(true)}
                className="px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300 font-semibold flex items-center"
              >
                <PrintIcon className="mr-2 w-5 h-5" /> معاينة وطباعة
              </button>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => navigate(invoices.length - 1)}
                disabled={
                  currentIndex >= invoices.length - 1 || invoices.length === 0
                }
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                الأخير
              </button>
              <button
                onClick={() => navigate(currentIndex + 1)}
                disabled={
                  currentIndex >= invoices.length - 1 || invoices.length === 0
                }
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                التالي
              </button>
              <div className="px-4 py-2 bg-brand-green-bg border-2 border-brand-green rounded-md">
                <span className="font-bold">
                  {currentIndex > -1
                    ? `${currentIndex + 1} / ${invoices.length}`
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
          { Header: "السعر", accessor: "price" },
        ]}
        data={allItems}
        onSelectRow={handleSelectItemFromModal}
      />
      <DataTableModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        title="بحث عن فاتورة مشتريات"
        columns={[
          { Header: "الرقم", accessor: "id" },
          { Header: "التاريخ", accessor: "date" },
          { Header: "المورد", accessor: "supplier" },
          { Header: "الصافي", accessor: "total" },
        ]}
        data={invoices.map((inv) => ({
          id: inv.id,
          date: inv.date,
          supplier: inv.customerOrSupplier?.name || "-",
          total: inv.totals.net.toFixed(2),
        }))}
        onSelectRow={handleSelectInvoiceFromSearch}
      />
      <PurchaseInvoicePrintPreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        invoiceData={{
          companyInfo,
          vatRate,
          isVatEnabled,
          items,
          totals,
          paymentMethod,
          supplier: selectedSupplier,
          details: {
            ...invoiceDetails,
            userName: currentUser?.fullName || "غير محدد",
            branchName: currentUser?.branch || "غير محدد",
          },
        }}
      />
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </>
  );
};

export default PurchaseInvoice;
