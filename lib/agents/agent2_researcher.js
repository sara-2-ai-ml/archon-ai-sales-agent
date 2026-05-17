// ============================================
// AGENT 2 - COMPANY RESEARCHER
// ============================================

import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import FirecrawlApp from "@mendable/firecrawl-js";

export async function researchCompany(lead) {
  console.log(`🧠 Agent 2: Researching ${lead.companyName}...`);

  let websiteContent = "No website content available. Generate insights based on the company name and industry.";

  if (process.env.FIRECRAWL_API_KEY && lead.website) {
    try {
      console.log(`🕷️ Scraping ${lead.website} with Firecrawl...`);
      const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
      const scrapeResult = await firecrawl.scrapeUrl(lead.website, {
        formats: ["markdown"]
      });

      if (scrapeResult.success) {
        websiteContent = scrapeResult.markdown || scrapeResult.content || websiteContent;
        websiteContent = websiteContent.substring(0, 5000);
      } else {
        console.warn(`⚠️ Firecrawl failed for ${lead.website}: ${scrapeResult.error}`);
      }
    } catch (err) {
      console.warn(`⚠️ Firecrawl error for ${lead.website}:`, err.message);
    }
  } else {
    console.warn("⚠️ No FIRECRAWL_API_KEY found or no website provided! Falling back to hallucinated research.");
  }

  const result = await generateObject({
    model: anthropic("claude-sonnet-4-5-20250929"),
    schema: z.object({
      problem: z.string(),
      product: z.string(),
      opportunity: z.string(),
      techStack: z.array(z.string()),
    }),
    prompt: `
      Analyze this company based on the provided data and website content, and generate a sales intelligence brief.

      Company: ${lead.companyName}
      Website: ${lead.website}
      Industry: ${lead.industry}
      Size: ${lead.size} employees
      Location: ${lead.location}

      --- SCRAPED WEBSITE CONTENT ---
      ${websiteContent}
      -------------------------------

      Return:
      - problem: Their most likely sales/growth pain point (1-2 sentences)
      - product: What they sell or build based on the website text (1 sentence)
      - opportunity: Why our AI Sales Outreach Agent would help them specifically (1-2 sentences)
      - techStack: 3-5 technologies they likely use (array of strings)

      Use English only. Be specific and realistic based ONLY on the provided scraped content if available.
    `,
  });

  console.log(`✅ Agent 2: Researched ${lead.companyName}`);

  return {
    leadId: lead.id,
    companyName: lead.companyName,
    ...result.object,
  };
}

export async function researchAllLeads(leads) {
  const researches = [];
  for (const lead of leads) {
    researches.push(await researchCompany(lead));
  }
  return researches;
}
