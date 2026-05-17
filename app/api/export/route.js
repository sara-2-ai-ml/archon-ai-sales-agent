import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId");

    let whereClause = {};
    if (campaignId) {
      whereClause = { campaignId };
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        campaign: true,
        research: true,
        outreach: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    // Create CSV content
    const columns = [
      "Company Name",
      "Contact Name",
      "Title",
      "Email",
      "Website",
      "Industry",
      "Company Size",
      "Location",
      "Pain Point",
      "Email Subject",
      "Email Status",
      "Campaign Name",
      "Date"
    ];

    const escapeCSV = (str) => {
      if (!str) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = leads.map(lead => [
      escapeCSV(lead.companyName),
      escapeCSV(lead.contactName),
      escapeCSV("N/A"), // Title is not explicitly stored in Lead model currently
      escapeCSV(lead.email),
      escapeCSV(lead.website),
      escapeCSV(lead.industry),
      escapeCSV(lead.size),
      escapeCSV(lead.location),
      escapeCSV(lead.research?.problem || "N/A"),
      escapeCSV(lead.outreach?.subject || "N/A"),
      escapeCSV(lead.outreach?.status || "N/A"),
      escapeCSV(lead.campaign?.query || "N/A"),
      escapeCSV(lead.createdAt.toISOString().split('T')[0])
    ]);

    const csvContent = [
      columns.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="leads_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("❌ Export error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
