import app from './app';
import { config } from './config';
import { connectDatabase, getDatabase } from './config/database';
import { setupDatabaseIndexes } from './config/setupDb';

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDatabase();
    
    // 1.5 Setup Database Indexes
    const db = getDatabase();
    await setupDatabaseIndexes(db);
    
    // 2. Start Express server
    const port = config.port;
    app.listen(port, () => {
      console.log(`Server running in ${config.nodeEnv} mode on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
