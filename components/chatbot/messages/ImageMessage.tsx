import Image from "next/image";
import styles from "../chatbot.module.css";

type Props = { src: string; alt: string; caption?: string };

export default function ImageMessage({ src, alt, caption }: Props) {
  return (
    <figure className={styles.mediaFigure}>
      <Image src={src} alt={alt} width={720} height={450} unoptimized loading="lazy" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}