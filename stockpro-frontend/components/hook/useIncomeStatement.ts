import { useMemo } from "react";
import { useGetIncomeStatementQuery } from "../store/slices/incomeStatement/incomeStatementApiSlice";
import { useGetCompanyQuery } from "../store/slices/companyApiSlice";
import type { CompanyInfo } from "../../types";

export const useIncomeStatement = (startDate: string, endDate: string) => {
  const {
    data: incomeStatementData,
    isLoading: isLoadingData,
    error: dataError,
    refetch,
  } = useGetIncomeStatementQuery(
    { startDate, endDate },
    {
      skip: !startDate || !endDate,
    },
  );

  const { data: company } = useGetCompanyQuery();

  const companyInfo = useMemo<CompanyInfo | null>(() => {
    if (!company) return null;
    return {
      name: company.name || "",
      activity: company.activity || "",
      address: company.address || "",
      phone: company.phone || "",
      taxNumber: company.taxNumber || "",
      commercialReg: company.commercialReg || "",
      currency: company.currency || "SAR",
      logo: company.logoPath || null,
      capital: company.capital || 0,
      vatRate: company.vatRate || 0,
      isVatEnabled: company.isVatEnabled || false,
    };
  }, [company]);

  return {
    data: incomeStatementData,
    companyInfo,
    isLoading: isLoadingData,
    error: dataError,
    refetch,
  };
};
