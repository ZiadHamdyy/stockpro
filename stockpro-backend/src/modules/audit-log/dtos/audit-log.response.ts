export class AuditLogResponse {
  id: string;
  timestamp: Date;
  userId: number;
  userName: string;
  branchId?: string;
  branchName?: string;
  action: string;
  targetType: string;
  targetId?: string;
  details: string;
}

