import { Session, User, Role, Permission, Branch } from '@prisma/client';

export type currentUserType = User & {
  session?: Session;
  role?: Role & {
    rolePermissions?: {
      permission: Permission;
    }[];
  };
  branch?: Branch;
};
