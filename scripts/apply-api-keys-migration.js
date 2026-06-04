/**
 * Apply the 0008 api_keys migration to the production DB.
 * Uses pg (not @neondatabase/serverless) as instructed.
 */
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

async function main() {
  const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
  const match = envContent.match(/DATABASE_URL="([^"]+)"/);
  if (!match) throw new Error("DATABASE_URL not found in .env.local");
  const rawUrl = match[1];

  const uStart = rawUrl.indexOf("://");
  const rest = rawUrl.substring(uStart + 3);
  const atIx = rest.indexOf("@");
  const creds = rest.substring(0, atIx);
  const hostRest = rest.substring(atIx + 1);
  const colonIx = creds.indexOf(":");
  const user = creds.substring(0, colonIx);
  const pass = creds.substring(colonIx + 1);

  console.log(`Connecting as ${user} to ${hostRest}...`);

  const pool = new Pool({
    host: hostRest.split("?")[0].split("/")[0],
    port: 5432,
    database: "neondb",
    user: user,
    password: pass,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  const sqlPath = path.join(__dirname, "..", "lib", "db", "migrations", "0008_messy_black_panther.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const stmt of statements) {
      const snippet = stmt.length > 80 ? stmt.substring(0, 80) + "..." : stmt;
      console.log(`Running: ${snippet}`);
      await client.query(stmt);
    }
    await client.query("COMMIT");
    console.log("Migration 0008 applied successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});