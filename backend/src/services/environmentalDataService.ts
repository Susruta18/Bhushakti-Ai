import { ObjectId, Filter } from 'mongodb';
import { getDatabase } from '../config/database';
import { EnvironmentalDataDocument, RiskZoneDocument } from '../models/types';

export const getEnvironmentalData = async (filter: any, page: number, limit: number) => {
  const db = getDatabase();
  const collection = db.collection<EnvironmentalDataDocument>('environmental_data');

  const skip = (page - 1) * limit;
  const total = await collection.countDocuments(filter);
  const data = await collection.find(filter).sort({ recordedAt: -1 }).skip(skip).limit(limit).toArray();

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getEnvironmentalDataById = async (id: string) => {
  if (!ObjectId.isValid(id)) return null;
  const db = getDatabase();
  return db.collection<EnvironmentalDataDocument>('environmental_data').findOne({ _id: new ObjectId(id) });
};

export const getEnvironmentalDataByZone = async (zoneId: string, filter: any, page: number, limit: number) => {
  const fullFilter = { ...filter, zoneId: new ObjectId(zoneId) };
  return getEnvironmentalData(fullFilter, page, limit);
};

export const getLatestEnvironmentalData = async (zoneId: string) => {
  if (!ObjectId.isValid(zoneId)) return null;
  const db = getDatabase();
  const collection = db.collection<EnvironmentalDataDocument>('environmental_data');

  return collection.findOne(
    { zoneId: new ObjectId(zoneId) },
    { sort: { recordedAt: -1 } }
  );
};

export const createEnvironmentalData = async (data: Omit<EnvironmentalDataDocument, '_id' | 'createdAt'>) => {
  const db = getDatabase();
  
  // Verify zone exists
  const zonesCollection = db.collection<RiskZoneDocument>('risk_zones');
  const zoneExists = await zonesCollection.findOne({ _id: data.zoneId });
  
  if (!zoneExists) {
    throw new Error('Risk Zone not found');
  }

  const collection = db.collection<EnvironmentalDataDocument>('environmental_data');

  const newRecord: EnvironmentalDataDocument = {
    ...data,
    createdAt: new Date(),
  };

  const result = await collection.insertOne(newRecord);
  return { ...newRecord, _id: result.insertedId };
};
