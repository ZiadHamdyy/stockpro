export interface ImportItemsResponse {
  totalRows: number;
  importedCount: number;
  failedCount: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
}


