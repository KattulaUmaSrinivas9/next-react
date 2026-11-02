type ChatLogFields = Record<string, string | number | boolean | null | undefined>;

function serializeChatLog(event: string, fields: ChatLogFields) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    ...fields,
  });
}

export function logChatInfo(event: string, fields: ChatLogFields = {}) {
  console.info(serializeChatLog(event, fields));
}

export function logChatError(event: string, error: unknown, fields: ChatLogFields = {}) {
  const errorFields = error instanceof Error
    ? { errorName: error.name, errorMessage: error.message }
    : { errorMessage: String(error) };
  console.error(serializeChatLog(event, { ...fields, ...errorFields }));
}
