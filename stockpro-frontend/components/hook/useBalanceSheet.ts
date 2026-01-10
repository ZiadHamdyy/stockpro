import { useMemo } from "react";
import { useGetBalanceSheetQuery } from "../store/slices/balanceSheet/balanceSheetApiSlice";
import { useGetCompanyQuery } from "../store/slices/companyApiSlice";
import type { CompanyInfo } from "../../types";

export const useBalanceSheet = (startDate: string, endDate: string) => {
  const {
    data: balanceSheetData,
    isLoading: isLoadingData,
    isFetching: isFetchingData,
    error: dataError,
    refetch,
  } = useGetBalanceSheetQuery(
    { startDate, endDate },
    {
      skip: !startDate || !endDate,
      refetchOnMountOrArgChange: true,
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
      logo: company.logo || null,
      capital: company.capital || 0,
      vatRate: company.vatRate || 0,
      isVatEnabled: company.isVatEnabled || false,
    };
  }, [company]);

  return {
    data: balanceSheetData,
    companyInfo,
    isLoading: isLoadingData || isFetchingData,
    error: dataError,
    refetch,
  };
};
