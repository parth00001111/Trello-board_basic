const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("node:path");
const dns = require("dns");
dns.setServers([
  "8.8.8.8", "1.1.1.1"
])

dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });

const dnsSetting = process.env.DNS_SERVERS?.trim();
const usesSrvConnection = process.env.MONGO_URI?.startsWith("mongodb+srv://");

if (usesSrvConnection && dnsSetting?.toLowerCase() !== "system") {
  const dns = require("node:dns");
  const configuredDnsServers = dnsSetting
    ? dnsSetting.split(",").map((server) => server.trim()).filter(Boolean)
    : ["8.8.8.8", "1.1.1.1"];

  if (configuredDnsServers.length) {
    dns.setServers(configuredDnsServers);
  }
}

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
