const { Client } = require("pg");
require("dotenv").config();

const testConnection = async () => {
  console.log("Testing database connection...");
  console.log("Host:", process.env.DB_HOST);
  console.log("Port:", process.env.DB_PORT);
  console.log("Database:", process.env.DB_NAME);
  console.log("User:", process.env.DB_USER);
  console.log("SSL:", process.env.DB_SSL);
  console.log("---");

  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl:
      process.env.DB_SSL === "true"
        ? {
            rejectUnauthorized: false,
          }
        : false,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log("Attempting to connect...");
    await client.connect();
    console.log("✓ Connection successful!");

    const result = await client.query("SELECT NOW()");
    console.log("✓ Query successful!");
    console.log("Server time:", result.rows[0].now);

    await client.end();
    console.log("✓ Connection closed");
    process.exit(0);
  } catch (error) {
    console.error("✗ Connection failed:");
    console.error("Error:", error.message);
    console.error("Code:", error.code);

    if (error.message.includes("timeout")) {
      console.error("\nPossible causes:");
      console.error("1. Firewall blocking connection");
      console.error("2. Incorrect host/port");
      console.error("3. Network connectivity issues");
      console.error("4. Neon database is paused (check Neon console)");
    }

    if (error.message.includes("SSL")) {
      console.error("\nSSL Issue:");
      console.error("Make sure DB_SSL=true in your .env file");
    }

    process.exit(1);
  }
};

testConnection();
