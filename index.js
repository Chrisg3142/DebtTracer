import { MongoClient } from "mongodb";

// Replace the uri string with your connection string

const client = new MongoClient(uri);
import { connectToDatabase } from "./db.js";

app.get("/", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const users = await db.collection("users").find().toArray();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
async function run() {
  try {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");

    // Queries for a movie that has a title value of 'Back to the Future'
    const query = { title: "Back to the Future" };
    const movie = await movies.findOne(query);

    console.log(movie);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
