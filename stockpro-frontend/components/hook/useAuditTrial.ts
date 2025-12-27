import { useMemo } from "react";
import { useGetAuditTrialQuery } from "../store/slices/auditTrial/auditTrialApiSlice";
import { useGetCompanyQuery } from "../store/slices/companyApiSlice";
import type { CompanyInfo } from "../../types";

export const useAuditTrial = (startDate: string, endDate: string) => {
  const {
    data: auditTrialData,
    isLoading: isLoadingData,
    error: dataError,
    refetch,
  } = useGetAuditTrialQuery(
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
      logo: company.logo || null,
      capital: company.capital || 0,
      vatRate: company.vatRate || 0,
      isVatEnabled: company.isVatEnabled || false,
    };
  }, [company]);

  return {
    data: auditTrialData,
    companyInfo,
    isLoading: isLoadingData,
    error: dataError,
    refetch,
  };
};

