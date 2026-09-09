import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import { SensorReadingDocument } from '../models/types';

export const createSensorReading = async (data: SensorReadingDocument): Promise<SensorReadingDocument> => {
  const db = getDatabase();
  const collection = db.collection<SensorReadingDocument>('sensor_readings');
  
  const result = await collection.insertOne(data);
  return { ...data, _id: result.insertedId };
};

export const getLatestReadingByDevice = async (deviceId: string): Promise<SensorReadingDocument | null> => {
  const db = getDatabase();
  const collection = db.collection<SensorReadingDocument>('sensor_readings');
  
  return await collection.findOne(
    { deviceId },
    { sort: { recordedAt: -1 } }
  );
};

export const getLatestReadingByZone = async (zoneId: string): Promise<SensorReadingDocument | null> => {
  if (!ObjectId.isValid(zoneId)) return null;
  const db = getDatabase();
  const collection = db.collection<SensorReadingDocument>('sensor_readings');
  
  return await collection.findOne(
    { zoneId: new ObjectId(zoneId) },
    { sort: { recordedAt: -1 } }
  );
};
