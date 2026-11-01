import styles from "../chatbot.module.css";

type Props = { src: string; caption?: string };

export default function VideoMessage({ src, caption }: Props) {
  const youtubeId = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)?.[1];
  return (
    <figure className={styles.mediaFigure}>
      {youtubeId ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
          title={caption || "Video shared in chat"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <video src={src} controls preload="metadata">Your browser does not support video playback.</video>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
