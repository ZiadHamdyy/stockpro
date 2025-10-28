import { apiSlice } from "../ApiSlice";
import type { CompanyInfo } from "../../../types";

interface CompanyResponse {
  id: string;
  name: string;
  activity: string;
  address: string;
  phone: string;
  taxNumber: string;
  commercialReg: string;
  currency: string;
  capital: number;
  vatRate: number;
  isVatEnabled: boolean;
  logo: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UpsertCompanyRequest {
  name: string;
  activity: string;
  address: string;
  phone: string;
  taxNumber: string;
  commercialReg: string;
  currency: string;
  capital: number;
  vatRate: number;
  isVatEnabled: boolean;
  logo?: string;
}

export const companyApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCompany: builder.query<CompanyInfo, void>({
      query: () => "/company",
      providesTags: ["Company"],
      transformResponse: (response: { data: CompanyResponse }): CompanyInfo => {
        const company = response.data;
        return {
          name: company.name,
          activity: company.activity,
          address: company.address,
          phone: company.phone,
          taxNumber: company.taxNumber,
          commercialReg: company.commercialReg,
          currency: company.currency,
          capital: company.capital,
          vatRate: company.vatRate,
          isVatEnabled: company.isVatEnabled,
          logo: company.logo,
        };
      },
    }),
    upsertCompany: builder.mutation<CompanyInfo, UpsertCompanyRequest>({
      query: (data) => ({
        url: "/company",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Company"],
      transformResponse: (response: { data: CompanyResponse }): CompanyInfo => {
        const company = response.data;
        return {
          name: company.name,
          activity: company.activity,
          address: company.address,
          phone: company.phone,
          taxNumber: company.taxNumber,
          commercialReg: company.commercialReg,
          currency: company.currency,
          capital: company.capital,
          vatRate: company.vatRate,
          isVatEnabled: company.isVatEnabled,
          logo: company.logo,
        };
      },
    }),
  }),
});

export const { useGetCompanyQuery, useUpsertCompanyMutation } = companyApiSlice;
