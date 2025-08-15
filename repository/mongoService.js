const { MongoClient } = require('mongodb');

let client;
let db;

const mongoUri = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'patient_management';
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 1000; // 1 second

async function connectToMongoDB() {
  try {
    if (!client) {
      client = new MongoClient(mongoUri, { useUnifiedTopology: true });
      await client.connect();
      console.log('✅ MongoDB connected');
    }
    if (!db) {
      db = client.db(DB_NAME);
      console.log('✅ DB instance loaded.');
    }
  } catch (error) {
    throw Error('Cannot connect to mongoDB server : ' + error);
  }

}

async function getDb() {
  let retries = 0;

  while ((!client || !db) && retries < MAX_RETRIES) {
    try {
      await connectToMongoDB();
    } catch (error) {
      retries++;
      console.warn(`⚠️ MongoDB connection failed (attempt ${retries}/${MAX_RETRIES}). Retrying in ${RETRY_DELAY_MS}ms...`);
      await new Promise(res => setTimeout(res, RETRY_DELAY_MS));
    }
  }

  if (!db) {
    throw new Error(`❌ Could not connect to MongoDB after ${MAX_RETRIES} retries`);
  }

  return db;
}

async function closeMongoDB() {
  try {
    if (client) {
      await client.close();
      client = null;
      db = null;
      console.log('✅ MongoDB connection closed');
    }
  } catch (error) {
    throw Error('Could not close mongoDb client : ' + error);
  }

}

module.exports = {
  connectToMongoDB,
  getDb,
  closeMongoDB
};
