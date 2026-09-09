import { Request, Response } from 'express';
import { loginUser } from '../services/authService';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await loginUser(req.body);
    res.status(200).json(result);
  } catch (error: any) {
    const message = error.message === 'Invalid credentials' ? 'Invalid credentials' : 'Login failed';
    res.status(401).json({
      success: false,
      message,
    });
  }
};
