import { Session, User } from '@prisma/client';

export type currentUserType = User & {
  session?: Session;
};
