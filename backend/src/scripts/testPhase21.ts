import { getDatabase, connectDatabase, closeDatabase } from '../config/database';
import { ObjectId } from 'mongodb';
import { evaluateCurrentRisk } from '../services/alertService';
import { predictLandslideRisk } from '../services/riskPredictionService';
import * as analyticsService from '../services/analyticsService';
import * as notificationService from '../services/notificationService';
import { generateAccessToken } from '../utils/jwt';

async function runPhase21Tests() {
  await connectDatabase();
  const db = getDatabase();
  const zoneId = new ObjectId();
  let passed = true;

  try {
    console.log('--- Step 2: Authentication (Logic verification) ---');
    // Auth logic generates JWT with role.
    const token = generateAccessToken({ userId: new ObjectId().toString(), email: 'auth@test.com', role: 'AUTHORITY' });
    if (token) {
      console.log('✅ JWT generation works');
    } else {
      passed = false;
      console.error('❌ JWT generation failed');
    }

    console.log('\n--- Step 3: Risk Prediction E2E (Regression) ---');
    const predictionResponse = await predictLandslideRisk({
      rainfall24h: 85,
      elevation: 500,
      slope: 25,
      soilMoisture: 40
    });
    
    if (predictionResponse.prediction.warning === true && predictionResponse.prediction.risk_probability > 0.98) {
      console.log('✅ ML Prediction consistent (Probability:', predictionResponse.prediction.risk_probability, 'Warning:', predictionResponse.prediction.warning, ')');
    } else {
      passed = false;
      console.error('❌ ML Prediction regression failed');
    }

    console.log('\n--- Step 4 & 5 & 6: Risk Zone + Environmental Data + Evaluation ---');
    await db.collection('risk_zones').insertOne({
      _id: zoneId,
      name: 'Phase 21 Test Zone',
      code: 'TEST-21',
      description: 'E2E Test zone',
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
    
    await db.collection('environmental_data').insertOne({
      zoneId,
      location: { type: 'Point', coordinates: [0, 0] },
      rainfall: 85,
      soilMoisture: 40,
      recordedAt: new Date(),
      source: 'MANUAL',
      createdAt: new Date()
    });

    const evalResult = await evaluateCurrentRisk(zoneId.toString());
    if (evalResult.success && evalResult.alert) {
      console.log('✅ Risk Evaluation succeeded and generated an alert:', evalResult.alert.severity);
    } else {
      passed = false;
      console.error('❌ Risk Evaluation failed or did not generate alert', evalResult);
    }

    console.log('\n--- Step 7: Alert Deduplication ---');
    const evalResult2 = await evaluateCurrentRisk(zoneId.toString());
    if (evalResult2.message === 'Active alert already exists for this severity.') {
      console.log('✅ Alert Deduplication prevented a duplicate active alert of the same severity.');
    } else {
      passed = false;
      console.error('❌ Duplicate alert was created or unexpected deduplication message!', evalResult2);
    }

    console.log('\n--- Step 8: Notification E2E ---');
    if (evalResult.alert) {
      const notificationsCollection = db.collection('notifications');
      const notifications = await notificationsCollection.find({ alertId: evalResult.alert._id }).toArray();
      if (notifications.length > 0) {
        console.log(`✅ Created ${notifications.length} notifications correctly linked to the alert.`);
        
        // Test mark as read logic for the first notification
        const notifId = notifications[0]._id;
        const userId = notifications[0].userId;
        const readSuccess = await notificationService.markAsRead(notifId.toString(), userId.toString());
        if (readSuccess) {
           console.log('✅ Mark as read successfully applied using isolated user ID.');
        } else {
           passed = false;
           console.error('❌ Mark as read failed.');
        }
      } else {
        console.log('⚠️ No notifications created (likely 0 active target users in test DB).');
      }
    }

    console.log('\n--- Step 9: Analytics (Honest Empty State Verification) ---');
    const dashboardStats = await analyticsService.getOverviewMetrics();
    if (dashboardStats) {
      console.log('✅ Analytics overview fetched successfully.');
      console.log(`   Active alerts count: ${dashboardStats.activeAlerts}`);
      console.log(`   Highest risk: ${dashboardStats.highestRisk}`);
    } else {
      passed = false;
      console.error('❌ Analytics overview failed.');
    }

    console.log(`\nOVERALL STATUS: ${passed ? 'PASS' : 'FAIL'}`);

  } catch (error) {
    console.error('❌ Test failed with exception:', error);
  } finally {
    console.log('\nCleaning up Phase 21 temporary test data...');
    await db.collection('risk_zones').deleteOne({ _id: zoneId });
    await db.collection('environmental_data').deleteMany({ zoneId });
    await db.collection('alerts').deleteMany({ zoneId });
    await db.collection('notifications').deleteMany({ zoneId });
    await closeDatabase();
  }
}

runPhase21Tests();
