import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';
import { ROLES } from '../config/permissions';

const router = Router();

// 1. Any authenticated user can access
router.get('/authenticated', authenticate, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Access granted to authenticated route',
    user: req.user,
  });
});

// 2. Only AUTHORITY can access
router.get('/authority', authenticate, authorizeRoles(ROLES.AUTHORITY), (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Access granted to authority route',
    user: req.user,
  });
});

// 3. FIELD_OFFICER and AUTHORITY can access
router.get('/field-officer', authenticate, authorizeRoles(ROLES.FIELD_OFFICER, ROLES.AUTHORITY), (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Access granted to field-officer route',
    user: req.user,
  });
});

// 4. Only CITIZEN can access
router.get('/citizen', authenticate, authorizeRoles(ROLES.CITIZEN), (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Access granted to citizen route',
    user: req.user,
  });
});

export default router;
