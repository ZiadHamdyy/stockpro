import { Session, User, Role, Permission } from '@prisma/client';

export type currentUserType = User & {
  session?: Session;
  role?: Role & {
    rolePermissions?: {
      permission: Permission;
    }[];
  };
};
