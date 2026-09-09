import dotenv from 'dotenv';
import { connectDatabase, getDatabase, closeDatabase } from '../config/database';
import { hashPassword } from '../utils/password';
import { UserDocument } from '../models/types';

dotenv.config();

const usersToSeed = [
  {
    name: 'Admin Authority',
    email: process.env.SEED_AUTHORITY_EMAIL,
    password: process.env.SEED_AUTHORITY_PASSWORD,
    role: 'AUTHORITY' as const,
  },
  {
    name: 'Field Officer 1',
    email: process.env.SEED_OFFICER_EMAIL,
    password: process.env.SEED_OFFICER_PASSWORD,
    role: 'FIELD_OFFICER' as const,
  },
  {
    name: 'Jane Citizen',
    email: process.env.SEED_CITIZEN_EMAIL,
    password: process.env.SEED_CITIZEN_PASSWORD,
    role: 'CITIZEN' as const,
  },
];

const seedUsers = async () => {
  try {
    console.log('Starting user seed process...');
    await connectDatabase();
    const db = getDatabase();
    const usersCollection = db.collection<UserDocument>('users');

    for (const userData of usersToSeed) {
      if (!userData.email || !userData.password) {
        console.warn(`Skipping user ${userData.role} due to missing email or password in environment variables.`);
        continue;
      }

      const existingUser = await usersCollection.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`User with email ${userData.email} already exists. Skipping.`);
        continue;
      }

      console.log(`Hashing password for ${userData.email}...`);
      const passwordHash = await hashPassword(userData.password);

      const newUser: UserDocument = {
        name: userData.name,
        email: userData.email,
        passwordHash,
        role: userData.role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await usersCollection.insertOne(newUser);
      console.log(`Successfully created user: ${userData.email} with role ${userData.role}.`);
    }

    console.log('User seed process completed successfully.');
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await closeDatabase();
  }
};

seedUsers();
