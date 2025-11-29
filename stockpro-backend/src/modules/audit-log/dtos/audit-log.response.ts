export class AuditLogResponse {
  id: string;
  timestamp: string;
  userId: number;
  userName: string;
  branchId?: string;
  branchName?: string;
  action: string;
  targetType: string;
  targetId?: string;
  details: string;
}

