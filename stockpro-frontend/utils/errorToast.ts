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
  if (
    msg.includes("insufficient balance") ||
    msg.includes("الرصيد غير كافي") ||
    msg.includes("balance insufficient")
  )
    return "INV_SAFE_BALANCE_INSUFFICIENT";
  if (msg.includes("not found")) return "INV_NOT_FOUND";
  if (
    msg.includes("no open fiscal period") || 
    msg.includes("no open period") ||
    (msg.includes("cannot create") && msg.includes("no open"))
  )
    return "FISCAL_NO_OPEN_PERIOD";
  if (
    msg.includes("closed fiscal period") || 
    msg.includes("closed period") ||
    (msg.includes("cannot create") && msg.includes("closed"))
  )
    return "FISCAL_CLOSED_PERIOD";
  if (msg.includes("future year") || msg.includes("future fiscal"))
    return "FISCAL_FUTURE_YEAR";
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
  INV_SAFE_BALANCE_INSUFFICIENT: "الرصيد غير كافي في الخزنة.",
  FISCAL_NO_OPEN_PERIOD: "لا يمكن إنشاء السند: لا توجد فترة محاسبية مفتوحة لهذا التاريخ.",
  FISCAL_CLOSED_PERIOD: "لا يمكن تعديل السند: الفترة المحاسبية مغلقة.",
  FISCAL_FUTURE_YEAR: "لا يمكن فتح فترة محاسبية لسنة مستقبلية.",
};

export function showApiErrorToast(error: unknown) {
  const err = (error || {}) as KnownError;
  
  // Try multiple locations for error message (RTK Query can structure errors differently)
  let message = "";
  let code = "";
  
  // Check if data exists and extract message
  if (err.data) {
    // If data is a string, use it directly
    if (typeof err.data === "string") {
      message = err.data;
    } 
    // If data is an object, check common properties
    else if (typeof err.data === "object") {
      // Check for message property (most common)
      if (err.data.message && typeof err.data.message === "string") {
        message = err.data.message;
      }
      // Check for error property
      else if (err.data.error && typeof err.data.error === "string") {
        message = err.data.error;
      }
      // Check for code property
      if (err.data.code) {
        code = String(err.data.code);
      }
    }
  }
  
  // Fallback to error.message if no message found yet
  if (!message) {
    const errorObj = err as any;
    if (errorObj.message && typeof errorObj.message === "string") {
      message = errorObj.message;
    }
  }

  const effectiveCode = code || deriveCodeFromMessage(message) || "";
  let text = CODE_MESSAGES[effectiveCode];
  
  // If no code match but message contains fiscal period keywords, try to translate
  if (!text && message) {
    const msgLower = message.toLowerCase();
    if (msgLower.includes("fiscal period") || msgLower.includes("no open") || msgLower.includes("closed period")) {
      const detectedCode = deriveCodeFromMessage(message);
      if (detectedCode) {
        text = CODE_MESSAGES[detectedCode];
      }
    }
  }
  
  // Fallback to raw message if still no translation
  if (!text) {
    if (typeof message === "string" && message.trim().length > 0) {
      text = message.trim();
    }
  }

  if (!text) {
    if (err.status === 409) {
      text = "لا يمكن إتمام العملية لوجود تعارض.";
    } else if (err.status === 422) {
      text = "بعض البيانات غير صحيحة.";
    } else if (err.status === 404) {
      text = "العنصر المطلوب غير موجود.";
    } else if (err.status === 403) {
      text = "غير مصرح لك بهذا الإجراء.";
    } else if (err.status === 401) {
      text = "غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.";
    } else if (err.status === 400) {
      text = "البيانات المدخلة غير صحيحة.";
    } else if (err.status >= 500) {
      text = "خطأ في الخادم، يرجى المحاولة لاحقاً.";
    } else {
      text = "حدث خطأ أثناء العملية.";
    }
  }
  showToastExternal(text, 'error');
}


