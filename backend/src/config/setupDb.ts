import { Db } from 'mongodb';

export const setupDatabaseIndexes = async (db: Db): Promise<void> => {
  try {
    // 1. Users Indexes
    const usersCollection = db.collection('users');
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    // Phone might be sparse if some users don't provide it
    await usersCollection.createIndex({ phone: 1 }, { unique: true, sparse: true });

    // 2. Risk Zones Indexes
    const riskZonesCollection = db.collection('risk_zones');
    await riskZonesCollection.createIndex({ location: '2dsphere' });

    // 3. Environmental Data Indexes
    const environmentalDataCollection = db.collection('environmental_data');
    await environmentalDataCollection.createIndex({ zoneId: 1, recordedAt: -1 });
    await environmentalDataCollection.createIndex({ location: '2dsphere' });

    // 4. Risk Predictions Indexes
    const riskPredictionsCollection = db.collection('risk_predictions');
    await riskPredictionsCollection.createIndex({ zoneId: 1, predictedAt: -1 });

    // 5. Alerts Indexes
    const alertsCollection = db.collection('alerts');
    await alertsCollection.createIndex({ zoneId: 1, status: 1 });
    await alertsCollection.createIndex({ createdAt: -1 });

    // 6. Field Reports Indexes
    const fieldReportsCollection = db.collection('field_reports');
    await fieldReportsCollection.createIndex({ location: '2dsphere' });
    await fieldReportsCollection.createIndex({ verificationStatus: 1 });

    // 7. Infrastructure Indexes
    const infrastructureCollection = db.collection('infrastructure');
    await infrastructureCollection.createIndex({ location: '2dsphere' });

    // 8. Response Priorities Indexes
    const responsePrioritiesCollection = db.collection('response_priorities');
    await responsePrioritiesCollection.createIndex({ zoneId: 1, calculatedAt: -1 });

    // 9. Response Actions Indexes
    const responseActionsCollection = db.collection('response_actions');
    await responseActionsCollection.createIndex({ priorityId: 1, status: 1 });

    // 10. Sensor Readings Indexes
    const sensorReadingsCollection = db.collection('sensor_readings');
    await sensorReadingsCollection.createIndex({ deviceId: 1, recordedAt: -1 });
    await sensorReadingsCollection.createIndex({ zoneId: 1, recordedAt: -1 });

    console.log('Database indexes successfully created.');
  } catch (error) {
    console.error('Failed to setup database indexes:', error);
    throw error;
  }
};
