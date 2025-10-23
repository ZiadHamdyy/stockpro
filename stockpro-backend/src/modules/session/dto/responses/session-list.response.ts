import { Expose, Type } from 'class-transformer';

export class SessionInfo {
  @Expose()
  id: string;

  @Expose()
  ipAddress: string;

  @Expose()
  userAgent: string;

  @Expose()
  status: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  isCurrent: boolean;
}

export class SessionMeta {
  @Expose()
  total: number;

  @Expose()
  active: number;
}

export class SessionListResponse {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  @Type(() => SessionInfo)
  data: SessionInfo[];

  @Expose()
  @Type(() => SessionMeta)
  meta: SessionMeta;
}
