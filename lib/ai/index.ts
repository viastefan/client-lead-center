/**
 * AI foundation — no automatic sending in V1.
 * Keep all model calls in this module; UI must never call providers directly.
 */

export type LeadAnalysis = {
  intent: string;
  summary: string;
  suggestedReply: string;
  confidence: number;
};

export async function analyzeLead(input: {
  name: string;
  email: string;
  message: string;
}): Promise<LeadAnalysis> {
  void input;
  throw new Error("AI analysis is not enabled in V1. Configure CLAUDE_API_KEY and implement this adapter later.");
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.CLAUDE_API_KEY);
}
