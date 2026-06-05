/**
 * Apply jurisdiction columns to tenants and documents tables.
 * Uses the same pattern as apply-migration-defaults.js for consistency.
 */
const { Pool } = require("pg");
const path = require("path");

// Load .env.local manually
const envPath = path.resolve(__dirname, "..", ".env.local");
const envContent = require("fs").readFileSync(envPath, "utf-8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) return;
  let val = trimmed.slice(eqIdx + 1).trim();
  // Strip surrounding quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  envVars[trimmed.slice(0, eqIdx).trim()] = val;
});

const DATABASE_URL = envVars.DATABASE_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not found — set it in .env.local");
  process.exit(1);
}

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    // Use DO block to safely create enum type (IF NOT EXISTS for types)
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE jurisdiction AS ENUM ('england_wales', 'scotland');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    console.log("✓ jurisdiction enum type ensured");

    // Add columns with IF NOT EXISTS for safe re-runs
    await client.query(`
      ALTER TABLE tenants
      ADD COLUMN IF NOT EXISTS jurisdiction text DEFAULT 'england_wales' NOT NULL;
    `);
    console.log("✓ tenants.jurisdiction column added");

    await client.query(`
      ALTER TABLE documents
      ADD COLUMN IF NOT EXISTS jurisdiction text;
    `);
    console.log("✓ documents.jurisdiction column added");

    console.log("\nMigration complete.");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();