export function chatConversationRoom(userId: string, conversationId: string) {
  return `chat:${encodeURIComponent(userId)}:${conversationId}`;
}
