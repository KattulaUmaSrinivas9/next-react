import type { ChatMessage } from "../types";
import ChartMessage from "./ChartMessage";
import ImageMessage from "./ImageMessage";
import TableMessage from "./TableMessage";
import TextMessage from "./TextMessage";
import VideoMessage from "./VideoMessage";
import LoginFormMessage from "./LoginFormMessage";

export default function MessageContent({
  message,
  onLoginSubmit,
}: {
  message: ChatMessage;
  onLoginSubmit?: (credentials: { username: string; password: string }) => Promise<void>;
}) {
  switch (message.type) {
    case "text": return <TextMessage content={message.content} />;
    case "form": return <LoginFormMessage message={message} onSubmit={onLoginSubmit ?? (async () => undefined)} />;
    case "image": return <ImageMessage src={message.src} alt={message.alt} caption={message.caption} />;
    case "video": return <VideoMessage src={message.src} caption={message.caption} />;
    case "chart": return <ChartMessage message={message} />;
    case "table": return <TableMessage message={message} />;
  }
}
