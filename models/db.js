const { MongoClient } = require("mongodb");

let dbConnection;

async function connectDB() {
  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI, {
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
