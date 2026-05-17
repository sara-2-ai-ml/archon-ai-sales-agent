// ============================================
// AGENT 4 - OUTREACH
// ============================================

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(email) {
  console.log(`📧 Agent 4: Sending to ${email.companyName}...`);

  try {
    // Demo mode - if no Resend API key
    if (!process.env.RESEND_API_KEY ||
        process.env.RESEND_API_KEY === "shto_api_key_ketu") {
      console.log(`🎭 DEMO: Simulating send to ${email.to}`);
      return {
        leadId: email.leadId,
        companyName: email.companyName,
        email: email.to,
        status: "sent",
        sentAt: new Date().toISOString(),
        followUpScheduled: email.followUpDate,
      };
    }

    // Send real email
    await resend.emails.send({
      from: "onboarding@resend.dev", // Resend requires this for free tier testing
      to: "saraperplexity12@gmail.com", // Për qëllime testimi, dërgohen të gjitha tek ti
      subject: `[TO: ${email.to}] ${email.subject}`, // E shkruajmë origjinalin tek subjekti që ta dallosh
      text: email.body,
    });

    console.log(`✅ Agent 4: Sent to ${email.companyName}`);
    return {
      leadId: email.leadId,
      companyName: email.companyName,
      email: email.to,
      status: "sent",
      sentAt: new Date().toISOString(),
      followUpScheduled: email.followUpDate,
    };

  } catch (error) {
    console.error(`❌ Failed for ${email.companyName}:`, error);
    return {
      leadId: email.leadId,
      companyName: email.companyName,
      email: email.to,
      status: "failed",
      sentAt: new Date().toISOString(),
      followUpScheduled: email.followUpDate,
    };
  }
}

export async function sendAllEmails(emails) {
  const results = [];
  for (const email of emails) {
    const result = await sendEmail(email);
    results.push(result);
    // Wait 1 second between emails
    await new Promise(r => setTimeout(r, 1000));
  }
  return results;
}