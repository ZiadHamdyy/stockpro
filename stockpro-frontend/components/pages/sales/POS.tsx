import React, { useState, useEffect, useMemo, useRef } from "react";
import type {
  Item,
  ItemGroup,
  InvoiceItem,
  User,
  Customer,
  CompanyInfo,
} from "../../../types";
import {
  SearchIcon,
  BoxIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  CreditCardIcon,
  BanknoteIcon,
  ShoppingCartIcon,
  PauseIcon,
  CalculatorIcon,
  ClockIcon,
  UserIcon,
  XIcon,
  CheckIcon,
  HistoryIcon,
  MaximizeIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  TagIcon,
  WifiIcon,
  WifiOffIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  LockIcon,
  EditIcon,
  UsersIcon,
} from "../../icons";
import { useToast } from "../../common/ToastProvider";
import { formatNumber } from "../../../utils/formatting";
import InvoicePrintPreview from "./InvoicePrintPreview";
import { useAppSelector } from "../../store/hooks";
import PermissionWrapper from "../../common/PermissionWrapper";
import { Resources, Actions, buildPermission } from "../../../enums/permissions.enum";
import {
  useGetItemsQuery,
  useGetItemGroupsQuery,
} from "../../store/slices/items/itemsApi";
import { useGetCustomersQuery } from "../../store/slices/customer/customerApiSlice";
import { useGetSafesQuery } from "../../store/slices/safe/safeApiSlice";
import { useGetBanksQuery } from "../../store/slices/bank/bankApiSlice";
import { useGetCompanyQuery } from "../../store/slices/companyApiSlice";
import { useGetStoresQuery } from "../../store/slices/store/storeApi";
import {
  useCreateSalesInvoiceMutation,
  type CreateSalesInvoiceRequest,
} from "../../store/slices/salesInvoice/salesInvoiceApiSlice";
import { showApiErrorToast } from "../../../utils/errorToast";

type POSProps = {
  title?: string;
};

// Visual Card for Product - Professional Design with Bottom Info Footer
const ProductCard: React.FC<{ item: Item; onAdd: (item: Item) => void }> = ({
  item,
  onAdd,
}) => {
  const hasStock = item.stock > 0;
  return (
    <div
      onClick={() => onAdd(item)}
      className={`
                relative rounded-2xl shadow-sm border border-blue-200/60 cursor-pointer 
                transition-all duration-200 active:scale-95 flex flex-col h-56 overflow-hidden group select-none
                hover:shadow-xl hover:-translate-y-1 bg-gradient-to-b
                ${hasStock ? "from-white to-blue-50/50 hover:to-blue-100" : "from-gray-100 to-gray-200 opacity-75"}
            `}
    >
      {/* Top Section: Icon & Name */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center pt-4 pb-2">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-2xl mb-3 shadow-md border-2 border-white
                    ${hasStock ? "bg-blue-100 text-blue-600" : "bg-gray-300 text-gray-500"}`}
        >
          {item.name.charAt(0)}
        </div>
        <h3 className="font-bold text-slate-800 text-xl leading-tight line-clamp-2 drop-shadow-sm group-hover:text-blue-700 transition-colors">
          {item.name}
        </h3>
      </div>

      {/* Bottom Section: Info Bar (Footer) */}
      <div
        className={`mt-auto px-4 py-3 flex justify-between items-center border-t ${hasStock ? "bg-blue-100/50 border-blue-200" : "bg-gray-200 border-gray-300"}`}
      >
        <div className="flex flex-col items-start">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">
            السعر
          </span>
          <span className="text-xl font-black text-slate-900 leading-none">
            {formatNumber(item.salePrice)}
          </span>
        </div>

        <div
          className={`w-px h-8 mx-2 ${hasStock ? "bg-blue-300/50" : "bg-gray-400/30"}`}
        ></div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">
            الكمية
          </span>
          <span
            className={`text-xl font-black leading-none ${hasStock ? "text-emerald-600" : "text-red-500"}`}
          >
            {item.stock}
          </span>
        </div>
      </div>
    </div>
  );
};

const CartItemRow: React.FC<{
  item: InvoiceItem;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}> = ({ item, onUpdateQty, onRemove }) => {
  const isReturn = item.qty < 0;
  return (
    <div
      className={`p-3 rounded-xl border flex items-center justify-between mb-2 group transition-all shadow-sm ${isReturn ? "bg-red-900/40 border-red-700/50" : "bg-white/5 hover:bg-white/10 border-white/10"}`}
    >
      <div className="flex-1 min-w-0 pr-3">
        <h4
          className={`font-bold text-sm truncate ${isReturn ? "text-red-200" : "text-white"}`}
        >
          {item.name}
        </h4>
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
          <span className="font-mono">
            {formatNumber(Math.abs(item.price))}
          </span>
          <span>x</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <PermissionWrapper
          requiredPermission={buildPermission(
            Resources.SALES_INVOICE,
            Actions.UPDATE
          )}
          fallback={
            <div className="flex items-center bg-black/20 rounded-lg p-0.5 border border-white/10 shadow-inner opacity-50 cursor-not-allowed">
              <button disabled className="w-8 h-8 flex items-center justify-center rounded text-slate-500 cursor-not-allowed">
                <MinusIcon className="w-4 h-4" />
              </button>
              <span
                className={`w-8 text-center font-bold text-sm font-mono ${isReturn ? "text-red-400" : "text-white"}`}
              >
                {Math.abs(item.qty)}
              </span>
              <button disabled className="w-8 h-8 flex items-center justify-center rounded text-slate-500 cursor-not-allowed">
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
          }
        >
          <div className="flex items-center bg-black/20 rounded-lg p-0.5 border border-white/10 shadow-inner">
            <button
              onClick={() => onUpdateQty(item.id, -1)}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded text-slate-300 hover:text-white transition-all"
            >
              <MinusIcon className="w-4 h-4" />
            </button>
            <span
              className={`w-8 text-center font-bold text-sm font-mono ${isReturn ? "text-red-400" : "text-white"}`}
            >
              {Math.abs(item.qty)}
            </span>
            <button
              onClick={() => onUpdateQty(item.id, 1)}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded text-slate-300 hover:text-white transition-all"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
        </PermissionWrapper>
        <div className="flex flex-col items-end min-w-[70px]">
          <span
            className={`font-bold text-base font-mono ${isReturn ? "text-red-400" : "text-emerald-400"}`}
          >
            {formatNumber(item.total)}
          </span>
          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.SALES_INVOICE,
              Actions.UPDATE
            )}
            fallback={null}
          >
            <button
              onClick={() => onRemove(item.id)}
              className="text-[10px] text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-0.5"
            >
              <TrashIcon className="w-3 h-3" /> حذف
            </button>
          </PermissionWrapper>
        </div>
      </div>
    </div>
  );
};

const getUserBranchId = (user: User | null): string | null => {
  if (!user) return null;
  return (user as any)?.branchId || (user as any)?.branch || null;
};

const POS: React.FC<POSProps> = () => {
  const currentUser = useAppSelector((state) => state.auth.user);

  // --- Data from API / Redux ---
  const { data: company } = useGetCompanyQuery();
  const vatRate = company?.vatRate ?? 0;
  const isVatEnabled = company?.isVatEnabled ?? false;
  const companyInfo: CompanyInfo = {
    name: company?.name ?? "",
    activity: company?.activity ?? "",
    address: company?.address ?? "",
    phone: company?.phone ?? "",
    taxNumber: company?.taxNumber ?? "",
    commercialReg: (company as any)?.commercialReg ?? "",
    currency: company?.currency ?? "SAR",
    logo: (company as any)?.logo ?? null,
    capital: (company as any)?.capital ?? 0,
    vatRate,
    isVatEnabled,
  };

  const { data: stores = [] } = useGetStoresQuery();
  const userBranchId = getUserBranchId(currentUser);
  const userStore = stores.find((store) => store.branchId === userBranchId);

  const { data: itemsData = [] } = useGetItemsQuery(
    userStore ? { storeId: userStore.id } : undefined,
  );
  const { data: itemGroupsData = [] } = useGetItemGroupsQuery(undefined);
  const { data: customersData = [] } = useGetCustomersQuery();
  const { data: safesData = [] } = useGetSafesQuery();
  const { data: banks = [] } = useGetBanksQuery();

  const filteredSafes = useMemo(
    () =>
      userBranchId
        ? safesData.filter((safe) => safe.branchId === userBranchId)
        : safesData,
    [safesData, userBranchId],
  );

  const items: Item[] = useMemo(
    () =>
      (itemsData as any[]).map((item) => ({
        id: item.id ?? item.code ?? 0,
        code: item.code ?? String(item.id ?? ""),
        barcode: item.barcode ?? "",
        name: item.name ?? "",
        group:
          item.group?.name || item.group?.title || item.groupName || "غير مصنف",
        unit: item.unit?.name || item.unitName || item.unit || "",
        purchasePrice: Number(item.purchasePrice ?? item.cost ?? 0),
        salePrice: Number(item.salePrice ?? item.price ?? 0),
        stock: Number(item.stock ?? item.balance ?? 0),
        reorderLimit: item.reorderLimit ?? 0,
      })),
    [itemsData],
  );

  const itemGroups: ItemGroup[] = useMemo(
    () =>
      (itemGroupsData as any[]).map((group) => ({
        id: group.id ?? group.code ?? 0,
        name: group.name ?? group.title ?? "",
      })),
    [itemGroupsData],
  );

  const customers: Customer[] = useMemo(
    () =>
      (customersData as any[]).map((cust) => ({
        id: cust.id?.toString() ?? "",
        code: cust.code ?? "",
        name: cust.name ?? "",
        commercialReg: cust.commercialReg ?? "",
        taxNumber: cust.taxNumber ?? "",
        nationalAddress: cust.nationalAddress ?? "",
        phone: cust.phone ?? "",
        openingBalance: Number(cust.openingBalance ?? 0),
        currentBalance: Number(cust.currentBalance ?? 0),
      })),
    [customersData],
  );

  const [createSalesInvoice, { isLoading: isCreatingInvoice }] =
    useCreateSalesInvoiceMutation();

  // --- State ---
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string;
  }>({ id: "cash", name: "عميل نقدي" });
  const [discount, setDiscount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isReturnMode, setIsReturnMode] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notes, setNotes] = useState("");

  // --- Modals ---
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPriceCheckOpen, setIsPriceCheckOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [priceCheckItem, setPriceCheckItem] = useState<Item | null>(null);
  
  // Calculator state
  const [calcDisplay, setCalcDisplay] = useState("0");
  const [calcEquation, setCalcEquation] = useState("");
  const [calcPreviousValue, setCalcPreviousValue] = useState<number | null>(null);
  const [calcOperator, setCalcOperator] = useState<string | null>(null);
  const [calcWaitingForNewValue, setCalcWaitingForNewValue] = useState(false);
  const [calcLastOperand, setCalcLastOperand] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement | null>(null);
  const sidebarClasses = useMemo(() => {
    const base =
      "flex flex-col bg-slate-800 text-white border-r border-slate-700 shadow-2xl z-40 relative overflow-hidden transition-[transform,width] duration-300 lg:h-screen";
    const desktopState = isSidebarOpen
      ? "lg:w-[420px] xl:w-[460px] lg:translate-x-0"
      : "lg:w-0 lg:-translate-x-full";
    const mobilePosition = isMobile
      ? "fixed inset-y-0 left-0 w-full max-w-md"
      : "lg:static lg:relative";
    const slideState = isSidebarOpen
      ? "translate-x-0"
      : "-translate-x-full lg:translate-x-0";
    return `${base} ${desktopState} ${mobilePosition} ${slideState}`;
  }, [isSidebarOpen, isMobile]);

  const categoryOptions = useMemo(
    () => [{ id: "all", name: "الكل" }, ...itemGroups.map((g) => ({ id: g.name, name: g.name }))],
    [itemGroups]
  );

  // --- Data Management ---
  const [holdList, setHoldList] = useState<
    {
      id: number;
      time: string;
      items: InvoiceItem[];
      customer: any;
      total: number;
    }[]
  >([]);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit">("cash");
  const [invoiceNumber, setInvoiceNumber] = useState(
    `POS-${Date.now().toString().slice(-6)}`,
  );

  const { showToast } = useToast();

  // --- Effects ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const onlineListener = () => setIsOnline(true);
    const offlineListener = () => setIsOnline(false);
    window.addEventListener("online", onlineListener);
    window.addEventListener("offline", offlineListener);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", onlineListener);
      window.removeEventListener("offline", offlineListener);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1280;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isCategoryDropdownOpen &&
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCategoryDropdownOpen]);

  // Filter Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.barcode && item.barcode.includes(searchQuery));
      const matchesCategory =
        selectedCategory === "all" || item.group === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  // --- Cart Logic ---
  const addToCart = (item: Item) => {
    if (isPriceCheckOpen) {
      setPriceCheckItem(item);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.code);
      const quantityModifier = isReturnMode ? -1 : 1;

      if (existing) {
        const newQty = existing.qty + quantityModifier;
        if (newQty === 0) return prev.filter((i) => i.id !== item.code);

        return prev.map((i) =>
          i.id === item.code
            ? {
                ...i,
                qty: newQty,
                total: newQty * i.price,
                taxAmount: isVatEnabled
                  ? newQty * i.price * (vatRate / 100)
                  : 0,
              }
            : i
        );
      }

      const total = item.salePrice * quantityModifier;
      const taxAmount = isVatEnabled ? total * (vatRate / 100) : 0;
      return [
        ...prev,
        {
          id: item.code,
          name: item.name,
          unit: item.unit,
          qty: quantityModifier,
          price: item.salePrice,
          taxAmount: taxAmount,
          total: total,
        },
      ];
    });

    if (isReturnMode) showToast("تم إضافة صنف كمرتجع");
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          if (newQty === 0) return item;

          return {
            ...item,
            qty: newQty,
            total: newQty * item.price,
            taxAmount: isVatEnabled ? newQty * item.price * (vatRate / 100) : 0,
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: string) =>
    setCart((prev) => prev.filter((i) => i.id !== id));

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, i) => sum + i.total, 0);
    const tax = isVatEnabled
      ? cart.reduce((sum, i) => sum + i.taxAmount, 0)
      : 0;
    const totalBeforeDiscount = subtotal + tax;
    const net = totalBeforeDiscount - discount;
    return { subtotal, tax, discount, net };
  }, [cart, isVatEnabled, discount]);

  // --- Actions ---
  const handleCheckoutOpen = () => {
    if (cart.length === 0) return;
    setPaymentAmount(Math.abs(totals.net).toString());
    setIsCheckoutOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (cart.length === 0) return;

    const safeId = filteredSafes[0]?.id?.toString();
    const bankId = banks[0]?.id?.toString();

    const payload: CreateSalesInvoiceRequest = {
      customerId: selectedCustomer.id !== "cash" ? selectedCustomer.id : undefined,
      date: new Date().toISOString().substring(0, 10),
      items: cart.map((i) => ({
        id: i.id,
        name: i.name,
        unit: i.unit,
        qty: i.qty,
        price: i.price,
        taxAmount: i.taxAmount,
        total: i.total,
      })),
      discount,
      paymentMethod,
      paymentTargetType: paymentMethod === "cash" ? "safe" : "bank",
      paymentTargetId:
        paymentMethod === "cash" ? safeId ?? undefined : bankId ?? undefined,
      bankTransactionType: paymentMethod === "credit" ? "POS" : undefined,
      notes,
    };

    try {
      const created = await createSalesInvoice(payload).unwrap();
      if (created?.code) {
        setInvoiceNumber(created.code);
      }

      setCart([]);
      setDiscount(0);
      setSearchQuery("");
      setNotes("");
      setSelectedCustomer({ id: "cash", name: "عميل نقدي" });
      setIsReturnMode(false);
      setIsCheckoutOpen(false);
      showToast("تم إصدار الفاتورة بنجاح");
    } catch (error: any) {
      showApiErrorToast(error);
    }
  };

  const handleHold = () => {
    if (cart.length === 0) return;
    setHoldList([
      ...holdList,
      {
        id: Date.now(),
        time: currentTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        items: [...cart],
        customer: selectedCustomer,
        total: totals.net,
      },
    ]);
    setCart([]);
    setDiscount(0);
    setSelectedCustomer({ id: "cash", name: "عميل نقدي" });
    setIsReturnMode(false);
    showToast("تم تعليق الفاتورة");
  };

  const handleRecall = (index: number) => {
    const held = holdList[index];
    setCart(held.items);
    setSelectedCustomer(held.customer);
    setHoldList((prev) => prev.filter((_, i) => i !== index));
    setIsHoldModalOpen(false);
  };

  const handleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log(
          `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
        );
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleLock = () => {
    showToast("تم قفل الشاشة (محاكاة)");
  };

  // Calculator functions
  const formatDisplay = (value: number | string): string => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "0";
    // Remove trailing zeros for whole numbers, but keep decimals if needed
    const str = num.toString();
    if (str.includes(".")) {
      return str.replace(/\.?0+$/, "") || "0";
    }
    return str;
  };

  const handleCalculatorNumber = (num: string) => {
    if (calcWaitingForNewValue) {
      setCalcDisplay(num);
      // Start new operand after operator
      if (calcEquation && calcOperator) {
        // Replace operator and start new number
        const parts = calcEquation.split(/[\+\-\*\/]/);
        if (parts.length > 0) {
          setCalcEquation(parts[0].trim() + " " + calcOperator + " " + num);
        } else {
          setCalcEquation(calcEquation + " " + num);
        }
      } else {
        setCalcEquation(num);
      }
      setCalcWaitingForNewValue(false);
    } else {
      const newDisplay = calcDisplay === "0" ? num : calcDisplay + num;
      setCalcDisplay(newDisplay);
      // Update equation: replace the current number being typed
      if (calcEquation && calcOperator) {
        // If we have an operator, update the second operand
        const parts = calcEquation.split(/[\+\-\*\/]/);
        if (parts.length >= 2) {
          setCalcEquation(parts[0].trim() + " " + calcOperator + " " + newDisplay);
        } else if (parts.length === 1) {
          setCalcEquation(parts[0].trim() + " " + calcOperator + " " + newDisplay);
        }
      } else {
        // No operator yet, just building the first number
        setCalcEquation(newDisplay);
      }
    }
  };

  const handleCalculatorOperator = (op: string) => {
    const inputValue = parseFloat(calcDisplay);

    if (calcPreviousValue === null) {
      setCalcPreviousValue(inputValue);
      setCalcLastOperand(inputValue);
      setCalcEquation(formatDisplay(inputValue) + " " + op);
    } else if (calcOperator && !calcWaitingForNewValue) {
      // Calculate previous operation if operator was already set
      const result = calculate(calcPreviousValue, inputValue, calcOperator);
      const formattedResult = formatDisplay(result);
      setCalcDisplay(formattedResult);
      setCalcPreviousValue(result);
      setCalcLastOperand(inputValue);
      setCalcEquation(formattedResult + " " + op);
    } else {
      // Just update the operator if we're waiting for new value
      setCalcPreviousValue(inputValue);
      setCalcLastOperand(inputValue);
      // Update operator in equation (replace old operator)
      const parts = calcEquation.split(/[\+\-\*\/]/);
      if (parts.length > 0) {
        setCalcEquation(parts[0].trim() + " " + op);
      }
    }

    setCalcWaitingForNewValue(true);
    setCalcOperator(op);
  };

  const calculate = (prev: number, current: number, operator: string): number => {
    switch (operator) {
      case "+":
        return prev + current;
      case "-":
        return prev - current;
      case "*":
        return prev * current;
      case "/":
        return current !== 0 ? prev / current : 0;
      default:
        return current;
    }
  };

  const handleCalculatorEquals = () => {
    if (calcPreviousValue !== null && calcOperator) {
      const inputValue = calcWaitingForNewValue && calcLastOperand !== null 
        ? calcLastOperand 
        : parseFloat(calcDisplay);
      const result = calculate(calcPreviousValue, inputValue, calcOperator);
      const formattedResult = formatDisplay(result);
      setCalcDisplay(formattedResult);
      
      // Show full equation with result
      let fullEquation = calcEquation;
      // If equation already has result (from previous equals), use current display as starting point
      if (calcEquation.includes("=")) {
        // Repeated equals - use last result
        const lastResult = parseFloat(calcDisplay);
        const operand = calcLastOperand || inputValue;
        const newResult = calculate(lastResult, operand, calcOperator);
        const newFormattedResult = formatDisplay(newResult);
        fullEquation = formatDisplay(lastResult) + " " + calcOperator + " " + formatDisplay(operand) + " = " + newFormattedResult;
        setCalcDisplay(newFormattedResult);
        setCalcPreviousValue(newResult);
      } else {
        // First equals press - build equation from current state
        if (calcWaitingForNewValue && calcLastOperand !== null) {
          fullEquation = formatDisplay(calcPreviousValue) + " " + calcOperator + " " + formatDisplay(calcLastOperand);
        } else {
          // Ensure equation has both operands
          const parts = calcEquation.split(/[\+\-\*\/]/);
          if (parts.length < 2) {
            fullEquation = formatDisplay(calcPreviousValue) + " " + calcOperator + " " + formatDisplay(inputValue);
          }
        }
        setCalcEquation(fullEquation + " = " + formattedResult);
        setCalcPreviousValue(result);
        if (calcLastOperand === null) {
          setCalcLastOperand(inputValue);
        }
      }
      
      setCalcWaitingForNewValue(true);
    }
  };

  const handleCalculatorClear = () => {
    setCalcDisplay("0");
    setCalcEquation("");
    setCalcPreviousValue(null);
    setCalcOperator(null);
    setCalcWaitingForNewValue(false);
    setCalcLastOperand(null);
  };

  const handleCalculatorDecimal = () => {
    if (calcWaitingForNewValue) {
      setCalcDisplay("0.");
      if (calcEquation && calcOperator) {
        const parts = calcEquation.split(/[\+\-\*\/]/);
        if (parts.length > 0) {
          setCalcEquation(parts[0].trim() + " " + calcOperator + " 0.");
        } else {
          setCalcEquation(calcEquation + " 0.");
        }
      } else {
        setCalcEquation("0.");
      }
      setCalcWaitingForNewValue(false);
    } else if (calcDisplay.indexOf(".") === -1) {
      const newDisplay = calcDisplay + ".";
      setCalcDisplay(newDisplay);
      // Update equation: replace the current number being typed
      if (calcEquation && calcOperator) {
        const parts = calcEquation.split(/[\+\-\*\/]/);
        if (parts.length >= 2) {
          setCalcEquation(parts[0].trim() + " " + calcOperator + " " + newDisplay);
        } else if (parts.length === 1) {
          setCalcEquation(parts[0].trim() + " " + calcOperator + " " + newDisplay);
        }
      } else {
        setCalcEquation(newDisplay);
      }
    }
  };

  const handleCalculatorButton = (value: string) => {
    if (value === "C") {
      handleCalculatorClear();
    } else if (value === "=") {
      handleCalculatorEquals();
    } else if (["+", "-", "*", "/"].includes(value)) {
      handleCalculatorOperator(value);
    } else if (value === ".") {
      handleCalculatorDecimal();
    } else {
      handleCalculatorNumber(value);
    }
  };

  // Reset calculator when modal opens
  useEffect(() => {
    if (isCalculatorOpen) {
      setCalcDisplay("0");
      setCalcEquation("");
      setCalcPreviousValue(null);
      setCalcOperator(null);
      setCalcWaitingForNewValue(false);
      setCalcLastOperand(null);
    }
  }, [isCalculatorOpen]);

  return (
    <div
      className="flex min-h-screen bg-[#f1f5f9] overflow-hidden font-sans text-slate-800 select-none flex-col lg:flex-row items-stretch"
      dir="rtl"
    >
      {/* MAIN CONTENT: PRODUCTS (RIGHT SIDE) - Appears First in Code for RTL Layout Order */}
      <div className="flex-1 flex flex-col h-full relative bg-[#f8fafc] order-1 border-l border-slate-300 w-full">
        {/* FLOATING ACTIONS */}
        <div className="fixed bottom-4 right-4 lg:bottom-6 lg:right-[calc(280px+1rem)] xl:right-[calc(300px+1rem)] z-50 flex flex-col gap-2">
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white shadow-lg border border-slate-700 font-bold hover:bg-slate-800 transition-colors"
            >
              {isSidebarOpen ? "إخفاء السلة" : "عرض السلة"}
            </button>
            <button
              onClick={() => setIsPreviewOpen((prev) => !prev)}
              className="px-4 py-2 rounded-lg bg-white shadow-lg border border-slate-200 text-slate-800 font-bold hover:bg-blue-50 hover:border-blue-200 transition-colors"
            >
              {isPreviewOpen ? "إغلاق المعاينة" : "فتح المعاينة"}
            </button>
          </div>
    
        {/* Header Bar */}
        <div className="h-auto lg:h-20 bg-white border-b border-slate-200 px-4 md:px-6 py-3 lg:py-0 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between flex-shrink-0 shadow-sm z-10">
          <div className="flex flex-col sm:flex-row items-start lg:items-center gap-3 lg:gap-4 flex-1 w-full">
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.SALES_INVOICE,
                Actions.SEARCH
              )}
              fallback={
                <div className="relative w-full sm:flex-1 sm:min-w-[180px] md:min-w-[220px] lg:min-w-[260px] max-w-full lg:max-w-[420px] group">
                  <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    className="w-full min-w-0 pl-3 pr-10 sm:pl-4 sm:pr-12 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium shadow-sm cursor-not-allowed opacity-50"
                    placeholder="بحث عن صنف (الاسم / الباركود)..."
                    value=""
                    disabled
                    readOnly
                  />
                </div>
              }
            >
              <div className="relative w-full sm:flex-1 sm:min-w-[180px] md:min-w-[220px] lg:min-w-[260px] max-w-full lg:max-w-[420px] group">
                <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  className="w-full min-w-0 pl-3 pr-10 sm:pl-4 sm:pr-12 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm transition-all outline-none font-medium shadow-sm"
                  placeholder="بحث عن صنف (الاسم / الباركود)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </PermissionWrapper>

            <div className="hidden md:block h-8 w-px bg-gray-300 mx-2"></div>

            <div
              className="relative w-full sm:flex-1 sm:min-w-[160px] md:min-w-[200px] lg:min-w-[240px] max-w-full lg:max-w-[320px]"
              ref={categoryDropdownRef}
            >
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
              >
                <span className="truncate">
                  {selectedCategory === "all" ? "الكل" : selectedCategory}
                </span>
                <span className="text-xs text-slate-500">▾</span>
              </button>
              {isCategoryDropdownOpen && (
                <div className="absolute mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-72 overflow-y-auto z-20">
                  {categoryOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setSelectedCategory(option.id);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full text-right px-4 py-2.5 text-sm font-medium hover:bg-blue-50 transition-colors ${
                        selectedCategory === option.id
                          ? "bg-blue-50 text-blue-700 font-bold"
                          : "text-slate-700"
                      }`}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3 w-full lg:w-auto justify-between lg:justify-end flex-wrap lg:flex-nowrap">
            <div className="text-left hidden xl:block flex-shrink-0">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {new Date().toLocaleDateString("ar-SA", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <div className="flex items-center justify-end gap-2 text-slate-800 mt-0.5">
                <span className="font-mono font-black text-2xl tracking-tight">
                  {currentTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <ClockIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>

            {/* INTERACTIVE ICONS */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <PermissionWrapper
                requiredPermission={buildPermission(
                  Resources.SALES_INVOICE,
                  Actions.UPDATE
                )}
                fallback={
                  <button
                    disabled
                    className="p-2.5 bg-white border border-slate-200 rounded-lg text-amber-300 opacity-50 cursor-not-allowed shadow-sm"
                    title="ملاحظة"
                  >
                    <EditIcon className="w-5 h-5" />
                  </button>
                }
              >
                <button
                  onClick={() => setIsNoteModalOpen(true)}
                  className="p-2.5 bg-white border border-slate-200 rounded-lg text-amber-600 hover:bg-amber-50 hover:border-amber-200 transition-all shadow-sm tooltip"
                  title="ملاحظة"
                >
                  <EditIcon className="w-5 h-5" />
                </button>
              </PermissionWrapper>
              <button
                onClick={() => setIsCalculatorOpen(true)}
                className="p-2.5 bg-white border border-slate-200 rounded-lg text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm"
                title="آلة حاسبة"
              >
                <CalculatorIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleLock}
                className="p-2.5 bg-white border border-slate-200 rounded-lg text-red-500 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                title="قفل الشاشة"
              >
                <LockIcon className="w-5 h-5" />
              </button>
            </div>

            {/* <div className="flex gap-2">
                            <button onClick={() => window.location.reload()} className="p-3 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm" title="تحديث"><RefreshCwIcon className="w-6 h-6"/></button>
                            <button onClick={handleFullScreen} className="p-3 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all shadow-sm" title="ملء الشاشة"><MaximizeIcon className="w-6 h-6"/></button>
                        </div> */}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 scrollbar-hide bg-slate-50">
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-5 pb-24 justify-items-stretch">
              {filteredItems.map((item) => (
                <PermissionWrapper
                  key={item.id}
                  requiredPermission={buildPermission(
                    Resources.SALES_INVOICE,
                    Actions.CREATE
                  )}
                >
                  <ProductCard item={item} onAdd={addToCart} />
                </PermissionWrapper>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                <BoxIcon className="w-12 h-12 text-slate-300" />
              </div>
              <p className="text-2xl font-bold text-slate-400">
                لا توجد منتجات
              </p>
              <p className="text-sm">
                جرب البحث بكلمة أخرى أو اختر تصنيفاً مختلفاً
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SIDEBAR: CART (LEFT SIDE) - Appears Second in Code */}
      <div className={`${sidebarClasses} order-2 lg:flex-shrink-0`}>
        {/* 1. Header Info */}
        <div className="h-12 bg-slate-900 flex items-center justify-between px-4 border-b border-slate-700 text-xs text-slate-400 relative z-10">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1 ${isOnline ? "text-emerald-500" : "text-red-500"}`}
            >
              {isOnline ? (
                <WifiIcon className="w-3 h-3" />
              ) : (
                <WifiOffIcon className="w-3 h-3" />
              )}
              <span>{isOnline ? "متصل" : "غير متصل"}</span>
            </div>
            <span className="w-px h-3 bg-slate-700"></span>
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-300">الوردية #12</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>
              {(currentUser as any)?.branch?.name ||
                currentUser?.branch ||
                "الفرع الرئيسي"}
            </span>
            <span className="w-px h-3 bg-slate-700"></span>
            <span className="font-bold text-white">
              {currentUser?.fullName}
            </span>
          </div>
        </div>

        {/* 2. Transaction Header */}
        <div
          className={`p-4 border-b border-slate-700 transition-colors relative z-10 ${isReturnMode ? "bg-red-900/20" : "bg-slate-800"}`}
        >
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600">
                <ChevronRightIcon className="w-4 h-4" />
              </button>
              <span className="text-sm font-mono text-blue-200 font-bold bg-slate-900 px-3 py-1 rounded border border-slate-700 shadow-sm">
                {invoiceNumber}
              </span>
              <button className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600">
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600"
                title="إخفاء السلة"
              >
                <XIcon className="w-4 h-4" />
              </button>
              <PermissionWrapper
                requiredPermission={buildPermission(
                  Resources.SALES_INVOICE,
                  Actions.READ
                )}
                fallback={null}
              >
                <button
                  onClick={() => setIsPreviewOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-700 border border-slate-600 text-blue-300 hover:text-white hover:bg-slate-600 transition-all"
                  title="معاينة"
                >
                  <EyeIcon className="w-3 h-3" />
                </button>
              </PermissionWrapper>
              <PermissionWrapper
                requiredPermission={buildPermission(
                  Resources.SALES_INVOICE,
                  Actions.UPDATE
                )}
                fallback={null}
              >
                <button
                  onClick={() => setIsReturnMode(!isReturnMode)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm ${isReturnMode ? "bg-red-600 border-red-500 text-white animate-pulse" : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"}`}
                >
                  <RotateCcwIcon className="w-3 h-3" />
                  {isReturnMode ? "وضع المرتجع" : "بيع جديد"}
                </button>
              </PermissionWrapper>
            </div>
          </div>

          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.SALES_INVOICE,
              Actions.READ
            )}
            fallback={
              <div className="flex items-center justify-between bg-slate-700 cursor-not-allowed p-3 rounded-xl border border-slate-600 opacity-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center border border-slate-500">
                    <UserIcon className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      العميل
                    </p>
                    <p className="text-sm font-bold text-slate-400 truncate w-40">
                      {selectedCustomer.name}
                    </p>
                  </div>
                </div>
                <ChevronLeftIcon className="w-4 h-4 text-slate-600" />
              </div>
            }
          >
            <div
              onClick={() => setIsCustomerModalOpen(true)}
              className="flex items-center justify-between bg-slate-700 hover:bg-slate-600 cursor-pointer p-3 rounded-xl border border-slate-600 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center group-hover:bg-blue-600 transition-colors border border-slate-500 group-hover:border-blue-500">
                  <UserIcon className="w-5 h-5 text-slate-300 group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    العميل
                  </p>
                  <p className="text-sm font-bold text-white truncate w-40">
                    {selectedCustomer.name}
                  </p>
                </div>
              </div>
              <ChevronLeftIcon className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
            </div>
          </PermissionWrapper>
        </div>

        {/* 3. Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 relative z-10 custom-scrollbar bg-slate-800">
          {cart.length > 0 ? (
            cart.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onUpdateQty={updateQty}
                onRemove={removeFromCart}
              />
            ))
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 opacity-50">
              <ShoppingCartIcon className="w-24 h-24" />
              <p className="text-lg font-medium">السلة فارغة</p>
              <p className="text-xs text-slate-500 bg-slate-900 px-3 py-1 rounded-full">
                ابدأ بإضافة منتجات
              </p>
            </div>
          )}
        </div>

        {/* 4. Footer & Totals */}
        <div className="bg-slate-900 p-4 border-t border-slate-700 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] relative z-20">
          <div className="space-y-2 mb-4 text-sm font-medium">
            <div className="flex justify-between text-slate-400">
              <span>المجموع</span>
              <span className="font-mono">{formatNumber(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>الضريبة ({vatRate}%)</span>
              <span className="font-mono">{formatNumber(totals.tax)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center text-red-400">
                <span>الخصم</span>
                <span className="font-mono">-{formatNumber(discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-3 border-t border-slate-700 mt-2">
              <span className="text-xl font-bold text-white">الإجمالي</span>
              <span
                className={`text-4xl font-black tracking-tighter font-mono ${totals.net < 0 ? "text-red-400" : "text-emerald-400"}`}
              >
                {formatNumber(totals.net)}{" "}
                <span className="text-sm text-slate-500 font-sans font-bold">
                  SAR
                </span>
              </span>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.SALES_INVOICE,
                Actions.UPDATE
              )}
              fallback={
                <button
                  disabled
                  className="col-span-1 bg-red-900/10 text-red-600 border border-red-900/20 rounded-lg p-2 flex flex-col items-center justify-center gap-1 opacity-50 cursor-not-allowed"
                >
                  <TrashIcon className="w-5 h-5" />
                  <span className="text-[10px] font-bold">إلغاء</span>
                </button>
              }
            >
              <button
                onClick={() => {
                  setCart([]);
                  setDiscount(0);
                }}
                className="col-span-1 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded-lg p-2 flex flex-col items-center justify-center gap-1 transition-all"
              >
                <TrashIcon className="w-5 h-5" />
                <span className="text-[10px] font-bold">إلغاء</span>
              </button>
            </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.SALES_INVOICE,
                Actions.CREATE
              )}
              fallback={
                <button
                  disabled
                  className="col-span-1 bg-orange-900/10 text-orange-600 border border-orange-900/20 rounded-lg p-2 flex flex-col items-center justify-center gap-1 opacity-50 cursor-not-allowed"
                >
                  <PauseIcon className="w-5 h-5" />
                  <span className="text-[10px] font-bold">تعليق</span>
                </button>
              }
            >
              <button
                onClick={handleHold}
                className="col-span-1 bg-orange-900/20 hover:bg-orange-900/40 text-orange-400 border border-orange-900/30 rounded-lg p-2 flex flex-col items-center justify-center gap-1 transition-all"
              >
                <PauseIcon className="w-5 h-5" />
                <span className="text-[10px] font-bold">تعليق</span>
              </button>
            </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.SALES_INVOICE,
                Actions.READ
              )}
              fallback={
                <button
                  disabled
                  className="col-span-1 bg-slate-700 text-slate-500 border border-slate-600 rounded-lg p-2 flex flex-col items-center justify-center gap-1 opacity-50 cursor-not-allowed"
                >
                  <HistoryIcon className="w-5 h-5" />
                  <span className="text-[10px] font-bold">استعادة</span>
                </button>
              }
            >
              <button
                onClick={() => setIsHoldModalOpen(true)}
                className="col-span-1 bg-slate-700 hover:bg-slate-600 text-blue-400 border border-slate-600 rounded-lg p-2 flex flex-col items-center justify-center gap-1 transition-all"
              >
                <HistoryIcon className="w-5 h-5" />
                <span className="text-[10px] font-bold">استعادة</span>
              </button>
            </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.SALES_INVOICE,
                Actions.READ
              )}
              fallback={
                <button
                  disabled
                  className="col-span-1 bg-slate-700 text-slate-500 border border-slate-600 rounded-lg p-2 flex flex-col items-center justify-center gap-1 opacity-50 cursor-not-allowed"
                >
                  <TagIcon className="w-5 h-5" />
                  <span className="text-[10px] font-bold">سعر</span>
                </button>
              }
            >
              <button
                onClick={() => setIsPriceCheckOpen(true)}
                className="col-span-1 bg-slate-700 hover:bg-slate-600 text-purple-400 border border-slate-600 rounded-lg p-2 flex flex-col items-center justify-center gap-1 transition-all"
              >
                <TagIcon className="w-5 h-5" />
                <span className="text-[10px] font-bold">سعر</span>
              </button>
            </PermissionWrapper>
          </div>

          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.SALES_INVOICE,
              Actions.CREATE
            )}
            fallback={
              <button
                disabled
                className="w-full h-16 rounded-xl font-bold text-2xl shadow-lg flex justify-between px-8 items-center border border-white/5 bg-slate-700 opacity-50 cursor-not-allowed"
              >
                <span>دفع</span>
                <div className="flex items-center gap-2 bg-black/20 px-4 py-1.5 rounded-lg">
                  <BanknoteIcon className="w-7 h-7" />
                </div>
              </button>
            }
          >
            <button
              onClick={handleCheckoutOpen}
              disabled={cart.length === 0}
              className={`w-full h-16 rounded-xl font-bold text-2xl shadow-lg flex justify-between px-8 items-center transition-all active:scale-[0.98] border border-white/5
                            ${
                              totals.net < 0
                                ? "bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white shadow-red-900/30"
                                : "bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white shadow-emerald-900/30"
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:from-transparent disabled:to-transparent
                        `}
            >
              <span>{totals.net < 0 ? "استرجاع" : "دفع"}</span>
              <div className="flex items-center gap-2 bg-black/20 px-4 py-1.5 rounded-lg">
                <BanknoteIcon className="w-7 h-7" />
              </div>
            </button>
          </PermissionWrapper>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#0f172a] p-6 flex justify-between items-center text-white">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <BanknoteIcon className="w-8 h-8 text-emerald-400" />
                الدفع وإصدار الفاتورة
              </h2>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 flex-1 overflow-y-auto">
              <div className="text-center mb-8 bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <p className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-2">
                  المبلغ الإجمالي المستحق
                </p>
                <div className="text-6xl font-black text-slate-800 tracking-tighter">
                  {formatNumber(Math.abs(totals.net))}{" "}
                  <span className="text-2xl text-gray-400">SAR</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${paymentMethod === "cash" ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md ring-2 ring-emerald-200" : "border-gray-100 bg-gray-50 text-gray-500 hover:bg-white"}`}
                >
                  <BanknoteIcon className="w-10 h-10" />
                  <span className="font-bold text-lg">نقداً (Cash)</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("credit")}
                  className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${paymentMethod === "credit" ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md ring-2 ring-blue-200" : "border-gray-100 bg-gray-50 text-gray-500 hover:bg-white"}`}
                >
                  <CreditCardIcon className="w-10 h-10" />
                  <span className="font-bold text-lg">شبكة (Card)</span>
                </button>
              </div>

              {paymentMethod === "cash" && (
                <div className="space-y-6 animate-slide-up">
                  <div className="relative">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      المبلغ المدفوع
                    </label>
                    <input
                      type="number"
                      className="w-full text-right text-4xl font-bold p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3 justify-center">
                    {[10, 50, 100, 500].map((amt) => (
                      <button
                        key={amt}
                        onClick={() =>
                          setPaymentAmount(
                            (parseFloat(paymentAmount || "0") + amt).toString()
                          )
                        }
                        className="bg-white hover:bg-gray-50 text-gray-800 font-bold py-3 px-5 rounded-xl border border-gray-200 transition-all shadow-sm active:scale-95"
                      >
                        +{amt}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        setPaymentAmount(Math.abs(totals.net).toString())
                      }
                      className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold py-3 px-5 rounded-xl border border-emerald-200 transition-all shadow-sm active:scale-95"
                    >
                      بالضبط
                    </button>
                  </div>

                  {parseFloat(paymentAmount) > Math.abs(totals.net) && (
                    <div className="bg-slate-800 text-white p-6 rounded-2xl flex justify-between items-center shadow-lg border-2 border-slate-700">
                      <span className="font-bold text-lg text-slate-300">
                        الباقي للعميل:
                      </span>
                      <span className="text-4xl font-black text-emerald-400">
                        {formatNumber(
                          parseFloat(paymentAmount) - Math.abs(totals.net)
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={handleConfirmPayment}
                disabled={isCreatingInvoice}
                className="w-full py-5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xl shadow-lg transition-all flex items-center justify-center gap-3 active:scale-[0.99]"
              >
                <CheckIcon className="w-6 h-6" />
                إتمام العملية وطباعة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER MODAL */}
      {isCustomerModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsCustomerModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
              <UsersIcon className="w-6 h-6" /> اختيار عميل
            </h3>
            <div className="max-h-80 overflow-y-auto space-y-2 mb-4 pr-1">
              <div
                onClick={() => {
                  setSelectedCustomer({ id: "cash", name: "عميل نقدي" });
                  setIsCustomerModalOpen(false);
                }}
                className="p-3 rounded-lg border border-gray-200 hover:bg-blue-50 cursor-pointer flex justify-between items-center font-bold"
              >
                <span>عميل نقدي (افتراضي)</span>
                {selectedCustomer.id === "cash" && (
                  <CheckIcon className="w-5 h-5 text-blue-600" />
                )}
              </div>
              {customers?.map((cust) => (
                <div
                  key={cust.id}
                  onClick={() => {
                    setSelectedCustomer({
                      id: cust.id.toString(),
                      name: cust.name,
                    });
                    setIsCustomerModalOpen(false);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center transition-colors ${selectedCustomer.id === cust.id.toString() ? "bg-blue-50 border-blue-500 text-blue-800" : "border-gray-200 hover:bg-gray-50"}`}
                >
                  <div>
                    <p className="font-bold">{cust.name}</p>
                    <p className="text-xs text-gray-500">{cust.phone}</p>
                  </div>
                  {selectedCustomer.id === cust.id.toString() && (
                    <CheckIcon className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setIsCustomerModalOpen(false)}
              className="w-full py-2 bg-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-300"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* PRICE CHECK MODAL */}
      {isPriceCheckOpen && (
        <div
          className="fixed inset-0 bg-purple-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsPriceCheckOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <TagIcon className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              فحص السعر
            </h2>
            <p className="text-slate-500 mb-6">
              قم بمسح الباركود أو اختيار منتج لمعرفة السعر
            </p>

            {priceCheckItem ? (
              <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-100 mb-6 animate-pop-in">
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {priceCheckItem.name}
                </h3>
                <p className="text-4xl font-black text-purple-600 mb-1">
                  {formatNumber(priceCheckItem.salePrice)}
                </p>
                <p className="text-sm font-bold text-purple-400 uppercase tracking-widest">
                  SAR
                </p>
                <div className="mt-4 pt-4 border-t border-purple-200 flex justify-between text-sm">
                  <span className="text-slate-500">المخزون المتوفر:</span>
                  <span className="font-bold text-slate-800">
                    {priceCheckItem.stock} {priceCheckItem.unit}
                  </span>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 mb-6 bg-slate-50">
                <p className="text-slate-400 font-medium">بانتظار المسح...</p>
              </div>
            )}

            <button
              onClick={() => {
                setIsPriceCheckOpen(false);
                setPriceCheckItem(null);
              }}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* NOTE MODAL */}
      {isNoteModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsNoteModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-amber-600">
              <EditIcon className="w-6 h-6" /> إضافة ملاحظة
            </h3>
            <textarea
              className="w-full border-2 border-gray-200 rounded-lg p-3 h-32 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none mb-4 resize-none text-lg"
              placeholder="اكتب ملاحظات الفاتورة هنا..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="flex-1 py-3 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700"
              >
                حفظ
              </button>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR MODAL */}
      {isCalculatorOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onClick={() => setIsCalculatorOpen(false)}
        >
          <div
            className="bg-white w-72 rounded-2xl shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-gray-700">آلة حاسبة</span>
              <button
                onClick={() => setIsCalculatorOpen(false)}
                className="text-gray-400 hover:text-red-500"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            {/* Calculator Equation Display */}
            {calcEquation && (
              <div className="bg-gray-50 p-3 rounded-lg text-right text-sm font-mono text-gray-600 mb-2 border border-gray-200 min-h-[32px] flex items-center justify-end overflow-x-auto">
                {calcEquation}
              </div>
            )}
            {/* Calculator Result Display */}
            <div className="bg-gray-100 p-4 rounded-lg text-right text-2xl font-mono font-bold mb-4 border border-gray-300 min-h-[64px] flex items-center justify-end overflow-x-auto">
              {calcDisplay}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {["C", "/", "*", "-"].map((k) => (
                <button
                  key={k}
                  onClick={() => handleCalculatorButton(k)}
                  className="p-3 bg-gray-200 rounded font-bold hover:bg-gray-300 active:scale-95 transition-transform"
                >
                  {k}
                </button>
              ))}
              {["7", "8", "9", "+"].map((k) => (
                <button
                  key={k}
                  onClick={() => handleCalculatorButton(k)}
                  className={`p-3 rounded font-bold hover:opacity-80 active:scale-95 transition-transform ${k === "+" ? "bg-orange-500 text-white row-span-2" : "bg-white border border-gray-200"}`}
                >
                  {k}
                </button>
              ))}
              {["4", "5", "6"].map((k) => (
                <button
                  key={k}
                  onClick={() => handleCalculatorButton(k)}
                  className="p-3 bg-white border border-gray-200 rounded font-bold hover:bg-gray-50 active:scale-95 transition-transform"
                >
                  {k}
                </button>
              ))}
              {["1", "2", "3", "="].map((k) => (
                <button
                  key={k}
                  onClick={() => handleCalculatorButton(k)}
                  className={`p-3 rounded font-bold hover:opacity-80 active:scale-95 transition-transform ${k === "=" ? "bg-blue-600 text-white" : "bg-white border border-gray-200"}`}
                >
                  {k}
                </button>
              ))}
              <button
                onClick={() => handleCalculatorButton("0")}
                className="col-span-2 p-3 bg-white border border-gray-200 rounded font-bold hover:bg-gray-50 active:scale-95 transition-transform"
              >
                0
              </button>
              <button
                onClick={() => handleCalculatorButton(".")}
                className="p-3 bg-white border border-gray-200 rounded font-bold hover:bg-gray-50 active:scale-95 transition-transform"
              >
                .
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HOLD LIST MODAL */}
      {isHoldModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsHoldModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
              <HistoryIcon className="w-6 h-6" /> الفواتير المعلقة
            </h3>
            <div className="max-h-80 overflow-y-auto space-y-3 mb-4">
              {holdList.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  لا توجد فواتير معلقة حالياً
                </p>
              ) : (
                holdList.map((held, idx) => (
                  <div
                    key={held.id}
                    className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800">
                          {held.customer?.name}
                        </span>
                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">
                          {held.time}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {held.items.length} أصناف • الإجمالي:{" "}
                        {formatNumber(held.total)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRecall(idx)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm"
                    >
                      استعادة
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setIsHoldModalOpen(false)}
              className="w-full py-2 bg-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-300"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobile && (
        <div
          className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <InvoicePrintPreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        invoiceData={{
          companyInfo: companyInfo,
          vatRate,
          isVatEnabled,
          items: cart,
          totals,
          paymentMethod,
          customer: selectedCustomer,
          details: {
            invoiceNumber,
            invoiceDate: new Date().toISOString().substring(0, 10),
            userName: currentUser?.fullName || "Cashier",
            branchName:
              (currentUser as any)?.branch?.name ||
              currentUser?.branch ||
              "Main",
          },
        }}
        printSettings={{
          template: "thermal", // Default to thermal for POS
          showLogo: true,
          showTaxNumber: true,
          showAddress: true,
          headerText: "فاتورة ضريبية مبسطة",
          footerText: "شكراً لزيارتكم",
          termsText: "",
        }}
      />
    </div>
  );
};

export default POS;
