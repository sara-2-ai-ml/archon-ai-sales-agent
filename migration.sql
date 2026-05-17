-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "requestedLeadCount" INTEGER NOT NULL DEFAULT 5,
    "totalLeads" INTEGER NOT NULL DEFAULT 0,
    "emailsSent" INTEGER NOT NULL DEFAULT 0,
    "openRate" INTEGER,
    "replyRate" INTEGER,
    "companySize" TEXT,
    "targetRole" TEXT,
    "techStack" TEXT,
    "status" TEXT NOT NULL DEFAULT 'running',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Research" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "opportunity" TEXT NOT NULL,
    "techStack" TEXT NOT NULL,
    "reviewStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Research_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Outreach" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewStatus" TEXT NOT NULL DEFAULT 'pending',
    "regenerateCount" INTEGER NOT NULL DEFAULT 0,
    "sentAt" DATETIME,
    "followUpScheduled" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Outreach_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Research_leadId_key" ON "Research"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "Outreach_leadId_key" ON "Outreach"("leadId");

