import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChatMessage } from "../types";
import styles from "../chatbot.module.css";

type ChartMessageData = Extract<ChatMessage, { type: "chart" }>;

export default function ChartMessage({ message }: { message: ChartMessageData }) {
  const chart = message.chartType === "pie" ? (
    <PieChart>
      <Tooltip />
      <Legend />
      <Pie data={message.data} dataKey={message.series[0]?.key ?? "value"} nameKey={message.xKey} outerRadius="72%" label>
        {message.data.map((_, index) => <Cell key={index} fill={message.series[index % message.series.length]?.color ?? "#2867d8"} />)}
      </Pie>
    </PieChart>
  ) : message.chartType === "line" ? (
    <LineChart data={message.data} margin={{ top: 10, right: 8, bottom: 0, left: -18 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey={message.xKey} tickLine={false} axisLine={false} />
      <YAxis tickLine={false} axisLine={false} />
      <Tooltip />
      <Legend />
      {message.series.map((series) => <Line key={series.key} type="monotone" dataKey={series.key} name={series.label} stroke={series.color} strokeWidth={2.5} dot={{ r: 3 }} />)}
    </LineChart>
  ) : (
    <BarChart data={message.data} margin={{ top: 10, right: 8, bottom: 0, left: -18 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey={message.xKey} tickLine={false} axisLine={false} />
      <YAxis tickLine={false} axisLine={false} />
      <Tooltip />
      <Legend />
      {message.series.map((series) => <Bar key={series.key} dataKey={series.key} name={series.label} fill={series.color} radius={[5, 5, 0, 0]} />)}
    </BarChart>
  );

  return (
    <section className={styles.chartCard} aria-label={message.title}>
      <div className={styles.dataHeading}>
        <h3>{message.title}</h3>
        <span className={styles.chartKind}>{message.chartType} chart</span>
      </div>
      <div className={styles.chartCanvas}>
        <ResponsiveContainer width="100%" height="100%">{chart}</ResponsiveContainer>
      </div>
    </section>
  );
}
