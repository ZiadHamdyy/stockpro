export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';

export interface Branch {
  id: string;
  name: string;
  color: string;
}

export interface SalesRecord {
  monthName: string;
  monthIndex: number;
  data: Record<string, number>; // branch id -> sales amount
}




