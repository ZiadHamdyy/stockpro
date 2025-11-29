import { apiSlice } from '../../ApiSlice';
import type { AuditLogEntry } from '../../../../types';

export interface GetAuditLogsQuery {
  userId?: string;
  action?: string;
  branchId?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
}

export const auditLogApiSlice = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAuditLogs: builder.query<AuditLogEntry[], GetAuditLogsQuery | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.userId) searchParams.append('userId', params.userId);
        if (params?.action) searchParams.append('action', params.action);
        if (params?.branchId) searchParams.append('branchId', params.branchId);
        if (params?.targetType) searchParams.append('targetType', params.targetType);
        if (params?.startDate) searchParams.append('startDate', params.startDate);
        if (params?.endDate) searchParams.append('endDate', params.endDate);
        
        const queryString = searchParams.toString();
        return `audit-logs${queryString ? `?${queryString}` : ''}`;
      },
      transformResponse: (response: any) => {
        // Handle the response format: { code, success, message, data: { data: AuditLogEntry[] } }
        if (
          response &&
          response.data &&
          response.data.data &&
          Array.isArray(response.data.data)
        ) {
          return response.data.data;
        }
        // Fallback for direct data array
        if (response && response.data && Array.isArray(response.data)) {
          return response.data;
        }
        // Fallback if response is already an array
        if (Array.isArray(response)) {
          return response;
        }
        // Return empty array if no valid data
        return [];
      },
      providesTags: ['AuditLog'],
    }),
  }),
});

export const { useGetAuditLogsQuery } = auditLogApiSlice;

