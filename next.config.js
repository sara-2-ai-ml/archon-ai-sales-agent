/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "resend",
    "@prisma/client",
    "@prisma/adapter-libsql",
    "@libsql/client",
  ],
};

module.exports = nextConfig;