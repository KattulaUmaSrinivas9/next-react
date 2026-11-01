import styles from "../chatbot.module.css";

export default function TextMessage({ content }: { content: string }) {
  return <p className={styles.plainText}>{content}</p>;
}
