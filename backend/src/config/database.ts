import { MongoClient, Db } from 'mongodb';
import { config } from './index';

let client: MongoClient | null = null;
let db: Db | null = null;

export const connectDatabase = async (): Promise<void> => {
  if (client && db) {
    return;
  }

  try {
    client = new MongoClient(config.mongoDbUri);
    await client.connect();
    db = client.db(config.mongoDbName);
    
    // Verify connection using ping
    await db.command({ ping: 1 });
    console.log('MongoDB connection successful');
  } catch (error) {
    console.error('MongoDB connection failed');
    throw error;
  }
};

export const getDatabase = (): Db => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDatabase first.');
  }
  return db;
};

export const getMongoClient = (): MongoClient => {
  if (!client) {
    throw new Error('MongoClient not initialized. Call connectDatabase first.');
  }
  return client;
};

export const closeDatabase = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
};

export const isDatabaseConnected = (): boolean => {
  return !!client && !!db;
};
