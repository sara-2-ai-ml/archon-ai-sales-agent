// ============================================
// AGENT 3 - EMAIL WRITER
// ============================================

import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

export async function writeEmail(lead, research) {
  console.log(`✍️ Agent 3: Writing email for ${lead.companyName}...`);

  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + 3);

  const result = await generateObject({
    model: anthropic("claude-sonnet-4-5-20250929"),
    schema: z.object({
      subject: z.string(),
      body: z.string(),
    }),
    prompt: `
      Write a cold outreach email on behalf of our AI Sales Outreach Agent product.

      Recipient company: ${lead.companyName}
      Contact person: ${lead.contactName}
      Their product: ${research.product}
      Their pain point: ${research.problem}
      Why we can help: ${research.opportunity}

      Rules:
      - Subject line: max 8 words, specific and curiosity-driven
      - Body: 100-150 words maximum
      - Open with one specific, genuine observation about their company
      - Briefly pitch the AI Sales Agent (saves 7+ hours/day on lead gen & emails)
      - End with a soft CTA for a 15-minute discovery call
      - Tone: human, warm, direct — NOT robotic or salesy
      - Language: English only
      - Do NOT use placeholders like [Your Name]
    `,
  });

  console.log(`✅ Agent 3: Written email for ${lead.companyName}`);

  return {
    leadId: lead.id,
    companyName: lead.companyName,
    to: lead.email,
    subject: result.object.subject,
    body: result.object.body,
    followUpDate: followUpDate.toISOString(),
  };
}

export async function writeAllEmails(leads, researches) {
  const emails = await Promise.all(
    leads.map((lead) => {
      const research = researches.find((r) => r.leadId === lead.id);
      return writeEmail(lead, research);
    })
  );
  return emails;
}
