/**
 * Add organisation default columns to the tenants table.
 * Uses pg (not @neondatabase/serverless) as instructed.
 * Each column uses IF NOT EXISTS so it's safe to re-run.
 */
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const COLUMNS = [
  "ADD COLUMN IF NOT EXISTS company_name text",
  "ADD COLUMN IF NOT EXISTS company_address text",
  "ADD COLUMN IF NOT EXISTS company_number text",
  "ADD COLUMN IF NOT EXISTS vat_number text",
  "ADD COLUMN IF NOT EXISTS default_employment_type text",
  "ADD COLUMN IF NOT EXISTS default_salary_period text",
  "ADD COLUMN IF NOT EXISTS default_fee_period text",
  "ADD COLUMN IF NOT EXISTS default_payment_terms text",
  "ADD COLUMN IF NOT EXISTS default_notice_period text",
  "ADD COLUMN IF NOT EXISTS default_probation_period text",
  "ADD COLUMN IF NOT EXISTS default_pension_scheme text",
  "ADD COLUMN IF NOT EXISTS default_sick_pay text",
  "ADD COLUMN IF NOT EXISTS default_holiday_entitlement text",
  "ADD COLUMN IF NOT EXISTS default_working_hours text",
  "ADD COLUMN IF NOT EXISTS default_confidentiality_period text",
  "ADD COLUMN IF NOT EXISTS ico_registration_number text",
  "ADD COLUMN IF NOT EXISTS dpo_name text",
  "ADD COLUMN IF NOT EXISTS dpo_email text",
];

async function main() {
  const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
  const match = envContent.match(/DATABASE_URL="([^\"]+)"/);
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

  const client = await pool.connect();
  const alterPrefix = "ALTER TABLE tenants";

  try {
    await client.query("BEGIN");
    for (const col of COLUMNS) {
      const sql = `${alterPrefix} ${col};`;
      console.log(`Running: ${col}`);
      await client.query(sql);
    }
    await client.query("COMMIT");
    console.log(`Migration complete — added ${COLUMNS.length} columns.`);
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