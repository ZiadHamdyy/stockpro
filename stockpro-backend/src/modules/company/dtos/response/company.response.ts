export class CompanyResponse {
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
  logoPath: string | null;
  createdAt: Date;
  updatedAt: Date;
}

