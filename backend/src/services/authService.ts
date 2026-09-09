import { getDatabase } from '../config/database';
import { LoginRequest, LoginResponse, UserDocument } from '../models/types';
import { comparePassword } from '../utils/password';
import { generateAccessToken } from '../utils/jwt';

export const loginUser = async (
  credentials: LoginRequest
): Promise<LoginResponse> => {
  const email = credentials.email?.trim();
  const password = credentials.password;

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const db = getDatabase();
  const usersCollection =
    db.collection<UserDocument>('users');

  const user = await usersCollection.findOne({ email });

  if (!user || !user.isActive) {
    throw new Error('Invalid credentials');
  }

  const isPasswordValid =
    await comparePassword(
      password,
      user.passwordHash
    );

  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  const token = generateAccessToken({
    userId: user._id!.toString(),
    role: user.role,
  });

  return {
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id!.toString(),
        email: user.email,
        role: user.role,
      },
      token,
    },
  };
};