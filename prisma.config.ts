// Prisma 7 config — CLI uses local SQLite, app uses Turso adapter
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // CLI (db push / migrate) uses local file — cannot target Turso directly
    url: "file:./dev.db",
  },
});
