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
  host: string;
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
  host?: string;
  companyId?: string;
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
    getAllCompanies: builder.query<CompanyResponse[], void>({
      query: () => "/company/all",
      providesTags: ["Company"],
      transformResponse: (response: { data: CompanyResponse[] }): CompanyResponse[] => {
        // NestJS wraps responses in { code, success, message, data }
        return response.data || [];
      },
    }),
    createCompany: builder.mutation<CompanyResponse, UpsertCompanyRequest>({
      query: (data) => ({
        url: "/company",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Company"],
    }),
    upsertCompany: builder.mutation<CompanyInfo, UpsertCompanyRequest>({
      query: (data) => {
        // Extract companyId from data if present (for SUPER_ADMIN)
        const { companyId, ...bodyData } = data as any;
        return {
          url: companyId ? `/company?companyId=${companyId}` : "/company",
          method: "PUT",
          body: bodyData, // Exclude companyId from body
        };
      },
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
    createCompanyWithSeed: builder.mutation<CompanyResponse, { host: string }>({
      query: (data) => ({
        url: "/company/create-with-seed",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Company"],
      transformResponse: (response: { data: CompanyResponse }): CompanyResponse => {
        return response.data;
      },
    }),
  }),
});

export const {
  useGetCompanyQuery,
  useGetAllCompaniesQuery,
  useCreateCompanyMutation,
  useUpsertCompanyMutation,
  useCreateCompanyWithSeedMutation,
} = companyApiSlice;
