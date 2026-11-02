// @ts-check

/** @typedef {Record<string, string | number | boolean | null | undefined>} ChatLogFields */

/**
 * @param {string} event
 * @param {ChatLogFields} fields
 */
function serializeChatLog(event, fields) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    ...fields,
  });
}

/** @param {string} event @param {ChatLogFields} [fields={}] */
export function logChatInfo(event, fields = {}) {
  console.info(serializeChatLog(event, fields));
}

/**
 * @param {string} event
 * @param {unknown} error
 * @param {ChatLogFields} [fields={}]
 */
export function logChatError(event, error, fields = {}) {
  const errorFields = error instanceof Error
    ? { errorName: error.name, errorMessage: error.message }
    : { errorMessage: String(error) };
  console.error(serializeChatLog(event, { ...fields, ...errorFields }));
}
