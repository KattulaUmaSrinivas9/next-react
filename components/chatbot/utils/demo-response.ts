import { sampleAssistantResponses } from "../sample-responses";
import type { AssistantResponse } from "../types";

export function getDemoResponse(query: string): AssistantResponse {
  const normalizedQuery = query.toLowerCase();

  if (/(chart|graph|trend|month|orders|sales)/.test(normalizedQuery)) {
    return sampleAssistantResponses[0];
  }

  if (/(table|product|top|list|revenue|units)/.test(normalizedQuery)) {
    return sampleAssistantResponses[1];
  }

  return {
    type: "text",
    content: 'Try asking “Show orders by month as a chart” or “Show top selling products as a table”.',
  };
}
