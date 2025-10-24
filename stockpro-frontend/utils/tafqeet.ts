const ones = [
  "",
  "واحد",
  "اثنان",
  "ثلاثة",
  "أربعة",
  "خمسة",
  "ستة",
  "سبعة",
  "ثمانية",
  "تسعة",
  "عشرة",
  "أحد عشر",
  "اثنا عشر",
  "ثلاثة عشر",
  "أربعة عشر",
  "خمسة عشر",
  "ستة عشر",
  "سبعة عشر",
  "ثمانية عشر",
  "تسعة عشر",
];
const tens = [
  "",
  "",
  "عشرون",
  "ثلاثون",
  "أربعون",
  "خمسون",
  "ستون",
  "سبعون",
  "ثمانون",
  "تسعون",
];
const hundreds = [
  "",
  "مائة",
  "مئتان",
  "ثلاثمائة",
  "أربعمائة",
  "خمسمائة",
  "ستمائة",
  "سبعمائة",
  "ثمانمائة",
  "تسعمائة",
];
const thousands = ["", "ألف", "ألفان", "آلاف"];
const millions = ["", "مليون", "مليونان", "ملايين"];

const currencies: {
  [key: string]: {
    singular: string;
    plural: string;
    fraction: string;
    fractionPlural: string;
  };
} = {
  SAR: {
    singular: "ريال سعودي",
    plural: "ريالات سعودية",
    fraction: "هللة",
    fractionPlural: "هللات",
  },
  USD: {
    singular: "دولار أمريكي",
    plural: "دولارات أمريكية",
    fraction: "سنت",
    fractionPlural: "سنتات",
  },
  EGP: {
    singular: "جنيه مصري",
    plural: "جنيهات مصرية",
    fraction: "قرش",
    fractionPlural: "قروش",
  },
  AED: {
    singular: "درهم إماراتي",
    plural: "دراهم إماراتية",
    fraction: "فلس",
    fractionPlural: "فلوس",
  },
};

function convertThreeDigits(num: number): string {
  if (num === 0) return "";
  let str = "";
  const h = Math.floor(num / 100);
  const t = Math.floor((num % 100) / 10);
  const o = num % 10;

  if (h > 0) {
    str += hundreds[h];
    if (t > 0 || o > 0) str += " و";
  }

  const remainder = num % 100;
  if (remainder > 0) {
    if (remainder < 20) {
      str += ones[remainder];
    } else {
      str += ones[o];
      if (o > 0 && t > 0) str += " و";
      str += tens[t];
    }
  }
  return str;
}

function getCurrencyName(num: number, singular: string, plural: string) {
  if (num === 1) return singular;
  if (num === 2) return singular.replace("واحد", "اثنان"); // For dual form like 'ريالان' - simplified here
  if (num >= 3 && num <= 10) return plural;
  return singular;
}

export function tafqeet(number: number, currency: string = "SAR"): string {
  if (number === 0) return "صفر";

  const currencyInfo = currencies[currency] || currencies["SAR"];
  const integerPart = Math.floor(number);
  const fractionalPart = Math.round((number - integerPart) * 100);

  let result = "";

  const m = Math.floor(integerPart / 1000000);
  const t = Math.floor((integerPart % 1000000) / 1000);
  const o = integerPart % 1000;

  if (m > 0) {
    if (m === 1) result += millions[1];
    else if (m === 2) result += millions[2];
    else if (m >= 3 && m <= 10)
      result += convertThreeDigits(m) + " " + millions[3];
    else result += convertThreeDigits(m) + " " + millions[1];
  }

  if (t > 0) {
    if (result !== "") result += " و";
    if (t === 1) result += thousands[1];
    else if (t === 2) result += thousands[2];
    else if (t >= 3 && t <= 10)
      result += convertThreeDigits(t) + " " + thousands[3];
    else result += convertThreeDigits(t) + " " + thousands[1];
  }

  if (o > 0) {
    if (result !== "") result += " و";
    result += convertThreeDigits(o);
  }

  if (integerPart > 0) {
    result +=
      " " +
      getCurrencyName(integerPart, currencyInfo.singular, currencyInfo.plural);
  }

  if (fractionalPart > 0) {
    if (integerPart > 0) result += " و";
    result +=
      convertThreeDigits(fractionalPart) +
      " " +
      getCurrencyName(
        fractionalPart,
        currencyInfo.fraction,
        currencyInfo.fractionPlural,
      );
  }

  return `فقط ${result.trim()} لا غير`;
}
