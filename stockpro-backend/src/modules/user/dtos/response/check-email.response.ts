import { Expose } from 'class-transformer';

export class CheckEmailResponse {
  @Expose()
  success: boolean;

  @Expose()
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}
