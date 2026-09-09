const { MongoClient, ObjectId } = require('mongodb');

async function checkDb() {
  const uri = 'mongodb+srv://smartuser:Vdw7OMSxVkXfG7rd@smartassistant-cluster.wgghe0y.mongodb.net/smartassistant_db?retryWrites=true&w=majority&appName=smartassistant-cluster';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('bhushakti_ai');
    
    const zone = await db.collection('risk_zones').findOne({ _id: new ObjectId('6a95aa3ed00e111b9f4d41e2') });
    console.log("Zone with Env Data:", zone);
    
    const activeZones = await db.collection('risk_zones').find({ isActive: true }).toArray();
    console.log("Active zones:", activeZones.map(z => z._id + " - " + z.name));
    
  } finally {
    await client.close();
  }
}

checkDb().catch(console.error);
