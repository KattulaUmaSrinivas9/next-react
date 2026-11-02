export type MessageRole = "assistant" | "user";

export type ChartPoint = Record<string, string | number>;
export type ChartSeries = { key: string; label: string; color: string };
export type TableRow = Record<string, string | number>;

export type AssistantResponse =
  | { type: "text"; content: string }
  | { type: "form"; purpose: "login"; title: string; description?: string; submitLabel: string }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "video"; src: string; caption?: string }
  | { type: "chart"; title: string; chartType: "bar" | "line" | "pie"; data: ChartPoint[]; xKey: string; series: ChartSeries[] }
  | { type: "table"; title: string; columns: string[]; rows: TableRow[] };

export type ChatMessageRequest = { conversationId: string; messageId: string; text: string };
export type ChatSocketEvent =
  | { type: "chat:ack"; messageId: string; accepted: boolean; error?: string }
  | { type: "chat:response"; conversationId: string; messageId: string; response: AssistantResponse };

export type MessageType = AssistantResponse["type"];
export type ChatMessage = AssistantResponse & { id: number; role: MessageRole };
