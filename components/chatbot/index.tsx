"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MessageComposer from "./MessageComposer";
import MessageList from "./MessageList";
import type { AssistantResponse, ChatMessage, ChatMessageRequest, MessageRole } from "./types";
import { connectChatSocket } from "./socket";
import styles from "./chatbot.module.css";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const connectionRef = useRef<ReturnType<typeof connectChatSocket> | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: 1, role: "assistant", type: "text", content: "Hi! How can I help you today?" },
  ]);

  const appendMessage = useCallback((response: AssistantResponse, role: MessageRole) => {
    setMessages((current) => {
      const id = (current[current.length - 1]?.id ?? 0) + 1;
      return [...current, { ...response, id, role }];
    });
  }, []);

  useEffect(() => {
    const connection = connectChatSocket({
      onStatusChange: setConnectionStatus,
      onEvent: (event) => {
        if (event.type === "chat:response") appendMessage(event.response, "assistant");
        if (event.type === "chat:ack" && !event.accepted) {
          appendMessage({ type: "text", content: event.error ?? "Message could not be sent." }, "assistant");
        }
      },
    });
    connectionRef.current = connection;

    return () => {
      connection.close();
      connectionRef.current = null;
    };
  }, [appendMessage]);

  function sendMessage(content: string) {
    const payload: ChatMessageRequest = { messageId: crypto.randomUUID(), text: content };
    if (!connectionRef.current?.send(payload)) return;
    appendMessage({ type: "text", content }, "user");
  }

  if (!isOpen) {
    return <button type="button" onClick={() => setIsOpen(true)} className={styles.launcher} aria-label="Open chatbot">Chat</button>;
  }

  return (
    <section className={styles.chatWindow} aria-label="AI Assistant chat">
      <header className={styles.header}>
        <div><h2>AI Assistant</h2><p>{connectionStatus === "connected" ? "Connected" : connectionStatus === "connecting" ? "Connecting…" : "Disconnected"}</p></div>
        <button type="button" className={styles.closeButton} onClick={() => setIsOpen(false)} aria-label="Close chatbot">×</button>
      </header>
      <MessageList messages={messages} />
      <MessageComposer onSend={sendMessage} disabled={connectionStatus !== "connected"} />
    </section>
  );
}

