const { MongoClient, ObjectId } = require('mongodb');

async function updateDb() {
  const uri = 'mongodb+srv://smartuser:Vdw7OMSxVkXfG7rd@smartassistant-cluster.wgghe0y.mongodb.net/smartassistant_db?retryWrites=true&w=majority&appName=smartassistant-cluster';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('bhushakti_ai');
    
    // Deactivate all except Feature Test Zone (6a95aa3ed00e111b9f4d41e2)
    const result = await db.collection('risk_zones').updateMany(
      { _id: { $ne: new ObjectId('6a95aa3ed00e111b9f4d41e2') } },
      { $set: { isActive: false } }
    );
    console.log("Deactivated zones:", result.modifiedCount);
    
  } finally {
    await client.close();
  }
}

updateDb().catch(console.error);
