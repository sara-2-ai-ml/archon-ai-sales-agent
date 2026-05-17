import { NextResponse } from "next/server";
import { findLeads } from "@/lib/agents/agent1_lead_finder";
import { researchAllLeads } from "@/lib/agents/agent2_researcher";
import { writeAllEmails } from "@/lib/agents/agent3_email_writer";
import { sendEmail } from "@/lib/agents/agent4_outreach";
import { generateReport, generateInsights } from "@/lib/agents/agent5_reporter";

import { getPrisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const { query, count = 5, companySize, targetRole, techStack } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Please enter what companies you are looking for!" }, { status: 400 });
    }

    console.log("🚀 Starting campaign:", query);

    let dbCampaignId = "demo_id";
    try {
      // 0. Create Campaign in DB
      const dbCampaign = await getPrisma().campaign.create({
        data: { 
          query, 
          requestedLeadCount: count,
          companySize: companySize || null,
          targetRole: targetRole || null,
          techStack: techStack || null
        }
      });
      dbCampaignId = dbCampaign.id;
    } catch (e) { console.error("Prisma error:", e.message); }

    // 1. Leads
    const leads = await findLeads(query, count);
    
    try {
      const dbLeads = await Promise.all(
        leads.map(lead => getPrisma().lead.create({
          data: {
            campaignId: dbCampaignId,
            companyName: lead.companyName,
            website: lead.website,
            email: lead.email,
            contactName: lead.contactName,
            industry: lead.industry,
            size: lead.size,
            location: lead.location,
          }
        }))
      );
      leads.forEach((l, i) => l.dbId = dbLeads[i].id);
    } catch (e) { console.error("Prisma error:", e.message); leads.forEach(l => l.dbId = "mock_" + l.id); }

    // 2. Research
    const researches = await researchAllLeads(leads);
    researches.forEach((r) => {
      const lead = leads.find((l) => l.id === r.leadId);
      r.dbLeadId = lead?.dbId || null;
      r.reviewStatus = "pending";
    });
    
    try {
      await Promise.all(
        researches.map(r => getPrisma().research.create({
          data: {
            leadId: leads.find(l => l.id === r.leadId).dbId,
            problem: r.problem,
            product: r.product,
            opportunity: r.opportunity,
            techStack: JSON.stringify(r.techStack || []),
          }
        }))
      );
    } catch (e) { console.error("Prisma error:", e.message); }

    // 3. Write Emails (draft queue)
    const emails = await writeAllEmails(leads, researches);
    emails.forEach((e) => {
      const lead = leads.find((l) => l.id === e.leadId);
      e.dbLeadId = lead?.dbId || null;
      e.reviewStatus = "pending";
      e.regenerateCount = 0;
      e.status = "unsent";
    });

    try {
      await Promise.all(
        emails.map(email => {
          return getPrisma().outreach.create({
            data: {
              leadId: leads.find(l => l.id === email.leadId).dbId,
              subject: email.subject || "No Subject",
              body: email.body || "No Body",
              status: "pending",
              reviewStatus: "pending",
              sentAt: null,
              followUpScheduled: email.followUpDate ? new Date(email.followUpDate) : null,
            }
          });
        })
      );
    } catch (e) { console.error("Prisma error:", e.message); }

    // 4. Draft report (before approval/send)
    const draftResults = emails.map((email) => ({
      leadId: email.leadId,
      companyName: email.companyName,
      email: email.to,
      status: "unsent",
      sentAt: null,
      followUpScheduled: email.followUpDate,
    }));
    const report = await generateReport(draftResults);
    const insights = await generateInsights(report);

    try {
      // Finalize Campaign in DB
      await getPrisma().campaign.update({
        where: { id: dbCampaignId },
        data: {
          totalLeads: report.totalLeads,
          emailsSent: report.emailsSent || 0,
          openRate: report.openRate,
          replyRate: report.replyRate,
          status: "completed"
        }
      });
    } catch (e) { console.error("Prisma error:", e.message); }

    console.log("✅ Campaign completed & saved to DB!");

    return NextResponse.json({
      success: true,
      campaignId: dbCampaignId,
      leads,
      researches,
      emails,
      report,
      insights,
    });

  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = getPrisma();
    const campaignsRaw = await db.campaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        leads: {
          include: {
            outreach: true
          }
        }
      }
    });

    const campaigns = campaignsRaw.map(c => {
      const sentEmails = c.leads.filter(l => l.outreach?.status === "sent").length;
      return {
        id: c.id,
        query: c.query,
        requestedLeadCount: c.requestedLeadCount,
        totalLeads: c.totalLeads,
        emailsSent: sentEmails,
        status: c.status,
        createdAt: c.createdAt,
      };
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("❌ History fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Missing campaign id" }, { status: 400 });
    }

    await getPrisma().campaign.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { type, action, dbLeadId, subject, body } = await req.json();

    if (!type || !action || !dbLeadId) {
      return NextResponse.json({ error: "type, action and dbLeadId are required" }, { status: 400 });
    }

    if (String(dbLeadId).startsWith("mock_")) {
      return NextResponse.json({ success: true, skipped: true });
    }

    if (type === "research") {
      if (!["approved", "skipped"].includes(action)) {
        return NextResponse.json({ error: "Invalid research action" }, { status: 400 });
      }

      await getPrisma().research.update({
        where: { leadId: dbLeadId },
        data: { reviewStatus: action },
      });

      return NextResponse.json({ success: true, reviewStatus: action });
    }

    if (type === "email") {
      const outreach = await getPrisma().outreach.findUnique({
        where: { leadId: dbLeadId },
        include: { lead: true },
      });
      if (!outreach) {
        return NextResponse.json({ error: "Outreach not found" }, { status: 404 });
      }

      if (action === "regenerated") {
        await getPrisma().outreach.update({
          where: { leadId: dbLeadId },
          data: {
            subject: subject || undefined,
            body: body || undefined,
            reviewStatus: "pending",
            regenerateCount: { increment: 1 },
          },
        });
        return NextResponse.json({ success: true, reviewStatus: "regenerated" });
      }

      if (!["approved", "skipped", "edit", "approve_all"].includes(action)) {
        return NextResponse.json({ error: "Invalid email action" }, { status: 400 });
      }

      if (action === "edit") {
        await getPrisma().outreach.update({
          where: { leadId: dbLeadId },
          data: {
            subject: subject,
            body: body,
          },
        });
        return NextResponse.json({ success: true, reviewStatus: outreach.reviewStatus });
      }

      if (action === "approve_all") {
        // Fetch all pending outreach for this campaign based on lead's campaign
        const pendingOutreach = await getPrisma().outreach.findMany({
          where: { 
            reviewStatus: "pending",
            lead: { campaignId: outreach.lead.campaignId }
          },
          include: { lead: true }
        });

        let sentCount = 0;
        for (const outr of pendingOutreach) {
          const sendResult = await sendEmail({
            leadId: outr.leadId,
            companyName: outr.lead.companyName,
            to: outr.lead.email,
            subject: outr.subject,
            body: outr.body,
            followUpDate: outr.followUpScheduled ? outr.followUpScheduled.toISOString() : null,
          });

          await getPrisma().outreach.update({
            where: { id: outr.id },
            data: {
              reviewStatus: "approved",
              status: sendResult.status === "sent" ? "sent" : "failed",
              sentAt: sendResult.sentAt ? new Date(sendResult.sentAt) : null,
            },
          });
          if (sendResult.status === "sent") sentCount++;
          // Wait briefly to avoid rate limits
          await new Promise(r => setTimeout(r, 200));
        }

        return NextResponse.json({
          success: true,
          reviewStatus: "approved",
          sentCount,
          totalApproved: pendingOutreach.length
        });
      }

      if (action === "approved") {
        if (outreach.status === "sent") {
          return NextResponse.json({
            success: true,
            reviewStatus: outreach.reviewStatus,
            status: "sent",
            sentAt: outreach.sentAt,
          });
        }

        const sendResult = await sendEmail({
          leadId: outreach.leadId,
          companyName: outreach.lead.companyName,
          to: outreach.lead.email,
          subject: outreach.subject,
          body: outreach.body,
          followUpDate: outreach.followUpScheduled ? outreach.followUpScheduled.toISOString() : null,
        });

        const updated = await getPrisma().outreach.update({
          where: { leadId: dbLeadId },
          data: {
            reviewStatus: "approved",
            status: sendResult.status === "sent" ? "sent" : "failed",
            sentAt: sendResult.sentAt ? new Date(sendResult.sentAt) : null,
          },
        });
        return NextResponse.json({
          success: true,
          reviewStatus: "approved",
          status: updated.status === "sent" ? "sent" : "unsent",
          sentAt: updated.sentAt,
        });
      }

      await getPrisma().outreach.update({
        where: { leadId: dbLeadId },
        data: { reviewStatus: action },
      });
      return NextResponse.json({ success: true, reviewStatus: action, status: "unsent" });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("❌ Action update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
