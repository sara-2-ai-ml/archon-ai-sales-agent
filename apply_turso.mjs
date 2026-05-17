import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { config } from "dotenv";

// Load .env.local explicitly
config({ path: ".env.local" });

const TURSO_URL   = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error("❌ TURSO_DATABASE_URL or TURSO_AUTH_TOKEN missing from .env.local");
  process.exit(1);
}

console.log("🔗 Connecting to:", TURSO_URL);

const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

const raw = readFileSync("migration.sql", "utf-8")
  .replace(/\r\n/g, "\n")
  .replace(/\r/g, "\n");

const statements = raw
  .split(";\n")
  .map((s) => s.replace(/^--.*\n?/gm, "").trim())
  .filter((s) => s.length > 5);

console.log(`📦 Applying ${statements.length} SQL statements to Turso...\n`);

for (const stmt of statements) {
  const preview = stmt.split("\n")[0].slice(0, 75);
  try {
    await client.execute(stmt);
    console.log("  ✅", preview);
  } catch (e) {
    if (e.message.toLowerCase().includes("already exists")) {
      console.log("  ⚠️  Already exists — skipped:", preview);
    } else {
      console.error("  ❌ Error:", e.message);
      console.error("     Statement:", stmt.slice(0, 120));
    }
  }
}

console.log("\n🎉 Turso schema sync complete!");
client.close();
