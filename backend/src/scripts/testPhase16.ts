import { getDatabase, connectDatabase, closeDatabase } from '../config/database';
import { ObjectId } from 'mongodb';
import { evaluateCurrentRisk } from '../services/alertService';
import { predictLandslideRisk } from '../services/riskPredictionService';
import { config } from '../config';

async function runTest() {
  await connectDatabase();
  const db = getDatabase();
  const zoneId = new ObjectId();
  
  try {
    console.log('--- Phase 16 ML Regression Test ---');
    const predictionResponse = await predictLandslideRisk({
      rainfall24h: 85,
      elevation: 500,
      slope: 25,
      soilMoisture: 40
    });
    console.log('ML Prediction Result:');
    console.log(`Risk Probability: ${predictionResponse.prediction.risk_probability}`);
    console.log(`Risk Level: ${predictionResponse.prediction.risk_level}`);
    console.log(`Warning: ${predictionResponse.prediction.warning}`);
    
    console.log('\n--- Phase 16 E2E Test ---');
    console.log('Creating mock zone and environmental data (temporary test data)...');
    
    // Seed zone
    await db.collection('risk_zones').insertOne({
      _id: zoneId,
      name: 'Phase 16 Test Zone',
      code: 'TEST-16',
      description: 'Test zone',
      riskLevel: 'LOW',
      currentProbability: 0.1,
      location: { type: 'Point', coordinates: [0, 0] },
      populationExposure: 100,
      criticalAssetCount: 1,
      slope: 25,
      elevation: 500,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Seed environmental data
    await db.collection('environmental_data').insertOne({
      zoneId,
      location: { type: 'Point', coordinates: [0, 0] },
      rainfall: 85,
      soilMoisture: 40,
      recordedAt: new Date(),
      source: 'MANUAL',
      createdAt: new Date()
    });
    
    console.log('Evaluating risk...');
    const evalResult = await evaluateCurrentRisk(zoneId.toString());
    console.log('Evaluation Result:', evalResult.message);
    if (evalResult.alert) {
      console.log('Created Alert:', JSON.stringify(evalResult.alert, null, 2));
    }
    
    console.log('Evaluating risk again to test deduplication...');
    const evalResult2 = await evaluateCurrentRisk(zoneId.toString());
    console.log('Evaluation Result (Run 2):', evalResult2.message);
    
    // Verify Notifications
    console.log('\n--- Phase 19 Notification Verification ---');
    if (evalResult.alert) {
      const notificationsCollection = db.collection('notifications');
      const notifications = await notificationsCollection.find({ alertId: evalResult.alert._id }).toArray();
      console.log(`Created ${notifications.length} notifications for the alert.`);
      if (notifications.length > 0) {
        console.log('Sample Notification:', JSON.stringify(notifications[0], null, 2));
      } else {
        console.log('WARNING: No notifications were created (perhaps no users in the DB).');
      }
    } else {
      console.log('WARNING: No alert was created, skipping notification check.');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    console.log('\nCleaning up temporary test data...');
    await db.collection('risk_zones').deleteOne({ _id: zoneId });
    await db.collection('environmental_data').deleteMany({ zoneId });
    await db.collection('alerts').deleteMany({ zoneId });
    await db.collection('notifications').deleteMany({ zoneId });
    await closeDatabase();
  }
}

runTest();
