import type { ChatMessage } from "./types";
import MessageContent from "./messages/MessageContent";
import styles from "./chatbot.module.css";

export default function MessageList({
  messages,
  onLoginSubmit,
}: {
  messages: ChatMessage[];
  onLoginSubmit?: (credentials: { username: string; password: string }) => Promise<void>;
}) {
  return (
    <div className={styles.messageList} role="log" aria-label="Messages" aria-live="polite">
      {messages.map((message) => (
        <div key={message.id} className={`${styles.messageRow} ${message.role === "user" ? styles.userRow : ""}`}>
          <div className={`${styles.messageBubble} ${message.role === "user" ? styles.userBubble : styles.assistantBubble} ${message.type !== "text" ? styles.richBubble : ""}`}>
            {message.type !== "text" && <span className={styles.typeBadge}>{message.type}</span>}
            <MessageContent message={message} onLoginSubmit={onLoginSubmit} />
          </div>
        </div>
      ))}
    </div>
  );
}
