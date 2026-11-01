"use client";

import { FormEvent, useState } from "react";
import styles from "./chatbot.module.css";

type Props = { onSend: (text: string) => void; disabled?: boolean };

export default function MessageComposer({ onSend, disabled = false }: Props) {
  const [text, setText] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    void onSend(value);
    setText("");
  }

  return (
    <form onSubmit={handleSubmit} className={styles.composer}>
      <label htmlFor="chat-message" className={styles.srOnly}>Message</label>
      <input
        id="chat-message"
        className={styles.messageInput}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Ask for orders by month or top products..."
        disabled={disabled}
      />
      <button type="submit" className={styles.sendButton} disabled={disabled || !text.trim()}>Send</button>
    </form>
  );
}
