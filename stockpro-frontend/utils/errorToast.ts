import { showToastExternal } from "../components/common/ToastProvider";

type KnownError = {
  status?: number;
  data?: { code?: string; message?: string } | any;
};

function deriveCodeFromMessage(message?: string): string | undefined {
  if (!message) return undefined;
  const msg = message.toLowerCase();
  if (msg.includes("insufficient stock")) return "INV_STOCK_INSUFFICIENT";
  if (msg.includes("customer is required")) return "INV_CUSTOMER_REQUIRED";
  if (msg.includes("supplier is required")) return "INV_SUPPLIER_REQUIRED";
  if (msg.includes("items are required") || msg.includes("at least one item"))
    return "INV_ITEMS_REQUIRED";
  if (
    msg.includes("safe or bank is required") ||
    msg.includes("select safe") ||
    msg.includes("select bank")
  )
    return "INV_PAYMENT_ACCOUNT_REQUIRED";
  if (
    msg.includes("credit") &&
    (msg.includes("must be empty") || msg.includes("not allowed"))
  )
    return "INV_PAYMENT_ACCOUNT_FOR_CREDIT_NOT_ALLOWED";
  if (msg.includes("not found")) return "INV_NOT_FOUND";
  return undefined;
}

const CODE_MESSAGES: Record<string, string> = {
  INV_STOCK_INSUFFICIENT: "لا توجد كمية كافية لهذا الصنف.",
  INV_CUSTOMER_REQUIRED: "يجب اختيار العميل.",
  INV_SUPPLIER_REQUIRED: "يجب اختيار المورد.",
  INV_ITEMS_REQUIRED: "يجب إضافة صنف واحد على الأقل.",
  INV_PAYMENT_ACCOUNT_REQUIRED: "يجب اختيار خزنة أو بنك عند الدفع نقداً.",
  INV_PAYMENT_ACCOUNT_FOR_CREDIT_NOT_ALLOWED:
    "لا يجب اختيار خزنة/بنك عند الدفع الآجل.",
  INV_ITEM_NOT_FOUND: "لم يتم العثور على أحد الأصناف.",
  INV_NOT_FOUND: "السجل غير موجود.",
};

export function showApiErrorToast(error: unknown) {
  const err = (error || {}) as KnownError;
  const code = (err.data && (err.data as any).code) || "";
  const message = (err.data && (err.data as any).message) || "";

  const effectiveCode = code || deriveCodeFromMessage(message) || "";
  let text = CODE_MESSAGES[effectiveCode];
  if (!text) {
    if (err.status === 409) text = "يوجد تعارض في المخزون.";
    else if (err.status === 422) text = "بعض البيانات غير صحيحة.";
    else if (err.status === 404) text = "العنصر المطلوب غير موجود.";
    else text = message || "حدث خطأ أثناء العملية.";
  }
  showToastExternal(text);
}


