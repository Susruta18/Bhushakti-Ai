import { JwtPayload } from '../models/types';

declare global {
  namespace Express {
    export interface Request {
      user?: JwtPayload;
    }
  }
}
