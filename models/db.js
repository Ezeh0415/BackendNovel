const { MongoClient } = require("mongodb");
const uri = process.env.MONGODB_URI;
let dbConnection;

async function connectDB() {

  if (!uri) {
    throw new Error("❌ MONGODB_URI is not defined in Railway variables.");
  }
  try {
    const client = await MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    dbConnection = client.db();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

function getDB() {
  if (!dbConnection) {
    throw new Error("Database not connected. Call connectDB() first.");
  }
  return dbConnection;
}

module.exports = {
  connectDB,
  getDB,
};
