import { JwtPayload } from '../models/types';

export type Role = JwtPayload['role'];

export const ROLES = {
  AUTHORITY: 'AUTHORITY' as Role,
  FIELD_OFFICER: 'FIELD_OFFICER' as Role,
  CITIZEN: 'CITIZEN' as Role,
};
