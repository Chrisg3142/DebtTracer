import { MongoClient } from "mongodb";

const uri =
  "mongodb+srv://debtTracer:Secret123@debttracer.1x9t793.mongodb.net/";
let cachedDb = null;
let cachedClient = null;

export async function connectToDatabase() {
  if (cachedDb) return cachedDb;

  try {
    const client = new MongoClient(uri, {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    const db = client.db("sample_mflix"); // Specify your database name here

    cachedClient = client;
    cachedDb = db;

    console.log("Connected to MongoDB");
    return db;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}

// Graceful shutdown handler
process.on("SIGINT", async () => {
  if (cachedClient) {
    await cachedClient.close();
    console.log("MongoDB connection closed");
  }
  process.exit();
});
