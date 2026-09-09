import { ObjectId, Filter } from 'mongodb';
import { getDatabase } from '../config/database';
import { RiskZoneDocument } from '../models/types';

export const getRiskZones = async (filter: any, page: number, limit: number) => {
  const db = getDatabase();
  const collection = db.collection<RiskZoneDocument>('risk_zones');

  const skip = (page - 1) * limit;
  const total = await collection.countDocuments(filter);
  const data = await collection.find(filter).skip(skip).limit(limit).toArray();

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

export const getRiskZoneById = async (id: string) => {
  if (!ObjectId.isValid(id)) return null;
  const db = getDatabase();
  return db.collection<RiskZoneDocument>('risk_zones').findOne({ _id: new ObjectId(id) });
};

export const getNearbyRiskZones = async (lat: number, lng: number, radius: number) => {
  const db = getDatabase();
  const collection = db.collection<RiskZoneDocument>('risk_zones');

  const filter: Filter<RiskZoneDocument> = {
    location: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        $maxDistance: radius,
      },
    },
    isActive: true, // usually want to return only active zones for nearby
  };

  return collection.find(filter).toArray();
};

export const createRiskZone = async (data: Omit<RiskZoneDocument, '_id' | 'createdAt' | 'updatedAt'>) => {
  const db = getDatabase();
  const collection = db.collection<RiskZoneDocument>('risk_zones');

  const newZone: RiskZoneDocument = {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(newZone);
  return { ...newZone, _id: result.insertedId };
};

export const updateRiskZone = async (id: string, updates: Partial<RiskZoneDocument>) => {
  if (!ObjectId.isValid(id)) return null;
  const db = getDatabase();
  const collection = db.collection<RiskZoneDocument>('risk_zones');

  // Prevent overriding protected fields
  delete updates._id;
  delete updates.createdAt;

  updates.updatedAt = new Date();

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updates },
    { returnDocument: 'after' }
  );

  return result;
};
