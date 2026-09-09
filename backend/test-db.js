const { MongoClient } = require('mongodb');

async function checkDb() {
  const uri = 'mongodb+srv://smartuser:Vdw7OMSxVkXfG7rd@smartassistant-cluster.wgghe0y.mongodb.net/smartassistant_db?retryWrites=true&w=majority&appName=smartassistant-cluster';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('bhushakti_ai');
    
    console.log("=== RISK ZONES ===");
    const zones = await db.collection('risk_zones').find().toArray();
    console.log("Count:", zones.length);
    if (zones.length > 0) console.log("Sample:", zones[0]);
    
    console.log("\n=== ENVIRONMENTAL DATA ===");
    const envData = await db.collection('environmental_data').find().sort({ recordedAt: -1 }).limit(1).toArray();
    const envDataCount = await db.collection('environmental_data').countDocuments();
    console.log("Count:", envDataCount);
    if (envData.length > 0) console.log("Most recent:", envData[0]);
    
    console.log("\n=== SENSOR READINGS ===");
    const sensorData = await db.collection('sensor_readings').find().sort({ recordedAt: -1 }).limit(1).toArray();
    const sensorDataCount = await db.collection('sensor_readings').countDocuments();
    console.log("Count:", sensorDataCount);
    if (sensorData.length > 0) console.log("Most recent:", sensorData[0]);

  } finally {
    await client.close();
  }
}

checkDb().catch(console.error);
