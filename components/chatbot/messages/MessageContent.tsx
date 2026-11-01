import type { ChatMessage } from "../types";
import ChartMessage from "./ChartMessage";
import ImageMessage from "./ImageMessage";
import TableMessage from "./TableMessage";
import TextMessage from "./TextMessage";
import VideoMessage from "./VideoMessage";

export default function MessageContent({ message }: { message: ChatMessage }) {
  switch (message.type) {
    case "text": return <TextMessage content={message.content} />;
    case "image": return <ImageMessage src={message.src} alt={message.alt} caption={message.caption} />;
    case "video": return <VideoMessage src={message.src} caption={message.caption} />;
    case "chart": return <ChartMessage message={message} />;
    case "table": return <TableMessage message={message} />;
  }
}
