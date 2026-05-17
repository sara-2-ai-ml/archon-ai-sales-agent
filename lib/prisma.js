import { config } from "dotenv";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Load env files when this module runs (covers API routes / scripts before Next injects env)
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const globalForPrisma = globalThis;

function resolveTursoConfig(url, authToken) {
  const resolvedUrl = url ?? process.env.TURSO_DATABASE_URL;
  const resolvedToken = authToken ?? process.env.TURSO_AUTH_TOKEN;

  if (!resolvedUrl) {
    throw new Error(
      "TURSO_DATABASE_URL is not set. Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to .env.local, then restart `npm run dev`."
    );
  }

  return { url: resolvedUrl, authToken: resolvedToken };
}

/**
 * Returns a singleton PrismaClient backed by Turso (libSQL).
 * Env is read at call time so Turbopack does not inline undefined at build.
 */
export function getPrisma(url, authToken) {
  const { url: resolvedUrl, authToken: resolvedToken } = resolveTursoConfig(
    url,
    authToken
  );

  if (!globalForPrisma.prisma) {
    const adapter = new PrismaLibSql({
      url: resolvedUrl,
      authToken: resolvedToken,
    });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }

  return globalForPrisma.prisma;
}

/** Lazy proxy for `import { prisma } from "@/lib/prisma"` */
export const prisma = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getPrisma();
      const value = client[prop];
      return typeof value === "function" ? value.bind(client) : value;
    },
  }
);
