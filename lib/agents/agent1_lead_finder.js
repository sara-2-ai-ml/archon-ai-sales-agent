// ============================================
// AGENT 1 - LEAD FINDER
// ============================================

import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { tavily } from "@tavily/core";

export async function findLeads(query, count = 5) {
  console.log("🔍 Agent 1: Looking for leads...");

  // If no Tavily key is provided, fallback to the Claude approach for demo purposes
  if (!process.env.TAVILY_API_KEY) {
    console.warn("⚠️ No TAVILY_API_KEY found! Falling back to AI-generated leads.");
    return await generateMockLeads(query, count);
  }

  try {
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

    console.log(`🌍 Searching web for: "${query}"...`);
    const searchResponse = await tvly.search(query, {
      searchDepth: "advanced",
      maxResults: 10,
    });

    const result = await generateObject({
      model: anthropic("claude-sonnet-4-5-20250929"),
      schema: z.object({
        leads: z.array(
          z.object({
            id: z.string(),
            companyName: z.string(),
            website: z.string(),
            email: z.string(),
            contactName: z.string(),
            industry: z.string(),
            size: z.string(),
            location: z.string(),
          })
        ),
      }),
      prompt: `
        You are an expert sales prospector. 
        I have performed a web search for: "${query}".
        
        Here are the web search results:
        ${JSON.stringify(searchResponse.results)}
        
        Your task is to analyze these search results and extract ${count} realistic B2B companies that match the search query.
        
        For each company produce:
        - id: "lead_1", "lead_2", etc.
        - companyName: The actual name of the company found in the results
        - website: Their actual website URL from the results
        - email: Infer a likely email address based on their domain (e.g. info@domain.com)
        - contactName: If a name is mentioned, use it. Otherwise infer a plausible decision-maker name.
        - industry: Determine their industry (e.g. SaaS, E-commerce)
        - size: Estimate size (e.g. "1-10", "11-50")
        - location: Extract location if available, else say "Unknown"

        IMPORTANT: ONLY extract companies present in the search results. Do NOT hallucinate.
      `,
    });

    console.log(`✅ Agent 1: Found ${result.object.leads.length} REAL leads!`);
    return result.object.leads;

  } catch (error) {
    console.error("❌ Tavily API Error:", error.message);
    console.warn("🔄 Falling back to AI-generated leads.");
    return await generateMockLeads(query, count);
  }
}

// Fallback function for demo mode
async function generateMockLeads(query, count) {
  const result = await generateObject({
    model: anthropic("claude-sonnet-4-5-20250929"),
    schema: z.object({
      leads: z.array(
        z.object({
          id: z.string(),
          companyName: z.string(),
          website: z.string(),
          email: z.string(),
          contactName: z.string(),
          industry: z.string(),
          size: z.string(),
          location: z.string(),
        })
      ),
    }),
    prompt: `
      Generate ${count} realistic B2B companies for this search: "${query}"

      For each company produce:
      - id: "lead_1", "lead_2", etc.
      - companyName: Realistic company name
      - website: https://www.example.com
      - email: info@example.com (use the company domain)
      - contactName: First and last name of a plausible decision-maker
      - industry: e.g. SaaS / FinTech / E-commerce / HealthTech
      - size: one of "1-10" / "11-50" / "51-200" / "201-500"
      - location: City, Country

      Make the companies feel real and varied. Use English only.
    `,
  });

  return result.object.leads;
}
