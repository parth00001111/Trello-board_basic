const dotenv = require("dotenv");
const mongoose = require("mongoose");
const dns = require("dns")
dns.setServers([ 
  "8.8.8.8", "1.1.1.1"
])
dotenv.config({ quiet: true });

async function connectDb() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  const connection = await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`Database connection established (${connection.connection.host})`);
  return connection;
}

module.exports = connectDb;
