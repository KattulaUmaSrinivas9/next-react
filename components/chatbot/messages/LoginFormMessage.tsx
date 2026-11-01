"use client";

import { FormEvent, useState } from "react";
import type { AssistantResponse } from "../types";
import styles from "../chatbot.module.css";

type Props = {
  message: Extract<AssistantResponse, { type: "form" }>;
  onSubmit: (credentials: { username: string; password: string }) => Promise<void>;
};

export default function LoginFormMessage({ message, onSubmit }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await onSubmit({ username: username.trim(), password });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Sign in failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.loginFormMessage}>
      <strong>{message.title}</strong>
      {message.description && <p>{message.description}</p>}
      <form onSubmit={handleSubmit} className={styles.loginForm}>
        <label>
          Username
          <input autoComplete="username" required maxLength={64} value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label>
          Password
          <input autoComplete="current-password" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error && <p className={styles.formError} role="alert">{error}</p>}
        <button type="submit" className={styles.sendButton} disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : message.submitLabel}
        </button>
      </form>
    </div>
  );
}
