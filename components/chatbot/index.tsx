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
  const [userId, setUserId] = useState<string | null>(null);
  const connectionRef = useRef<ReturnType<typeof connectChatSocket> | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 1,
      role: "assistant",
      type: "form",
      purpose: "login",
      title: "Sign in to chat",
      description: "Choose a username. Use the shared demo password to continue.",
      submitLabel: "Sign in",
    },
  ]);

  const appendMessage = useCallback((response: AssistantResponse, role: MessageRole) => {
    setMessages((current) => {
      const id = (current[current.length - 1]?.id ?? 0) + 1;
      return [...current, { ...response, id, role }];
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((session: { authenticated?: boolean; userId?: string | null }) => {
        if (cancelled || !session.authenticated || !session.userId) return;
        setUserId(session.userId);
        setMessages([{ id: 1, role: "assistant", type: "text", content: `Welcome back, ${session.userId}. How can I help?` }]);
      })
      .catch((error: unknown) => console.error("Could not restore chat session:", error));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!userId) {
      setConnectionStatus("disconnected");
      return;
    }

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
  }, [appendMessage, userId]);

  async function signIn(credentials: { username: string; password: string }) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const result = await response.json() as { userId?: string; error?: string };
    if (!response.ok || !result.userId) throw new Error(result.error ?? "Sign in failed.");

    setUserId(result.userId);
    setMessages([{ id: 1, role: "assistant", type: "text", content: `Welcome, ${result.userId}. Ask for a chart or table.` }]);
  }

  async function signOut() {
    await fetch("/api/auth/session", { method: "DELETE" });
    connectionRef.current?.close();
    connectionRef.current = null;
    setUserId(null);
    setMessages([{
      id: 1,
      role: "assistant",
      type: "form",
      purpose: "login",
      title: "Sign in to chat",
      description: "Choose a username. Use the shared demo password to continue.",
      submitLabel: "Sign in",
    }]);
  }

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
        <div><h2>AI Assistant</h2><p>{userId ? `${userId} · ${connectionStatus === "connected" ? "Connected" : connectionStatus === "connecting" ? "Connecting…" : "Disconnected"}` : "Sign in to connect"}</p></div>
        {userId && <button type="button" className={styles.signOutButton} onClick={() => void signOut()}>Sign out</button>}
        <button type="button" className={styles.closeButton} onClick={() => setIsOpen(false)} aria-label="Close chatbot">×</button>
      </header>
      <MessageList messages={messages} onLoginSubmit={signIn} />
      {userId && <MessageComposer onSend={sendMessage} disabled={connectionStatus !== "connected"} />}
    </section>
  );
}

