const { MongoClient } = require('mongodb');

let client;
let db;

const mongoUri = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'patient_management';

async function connectToMongoDB() {
  try {
    if (!client) {
      client = new MongoClient(mongoUri, { useUnifiedTopology: true });
      await client.connect();
      console.log('✅ MongoDB connected');
    }
  } catch (error) {
    throw Error('Cannot connect to mongoDB server : ' + error);
  }

}

function getDb() {
  try {
    if (!db) {
      db = client.db(DB_NAME);
      console.log('✅ DB instance loaded.');
    }
    return db;
  } catch (error) {
    throw Error('Error occurred while getting db instance : ' + error);
  }
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
