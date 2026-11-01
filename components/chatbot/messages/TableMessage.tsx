"use client";

import { useMemo, useState } from "react";
import type { ChatMessage } from "../types";
import styles from "../chatbot.module.css";

type TableMessageData = Extract<ChatMessage, { type: "table" }>;

export default function TableMessage({ message }: { message: TableMessageData }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ column: string; direction: "asc" | "desc" } | null>(null);
  const visibleRows = useMemo(() => {
    const normalizedQuery = query.toLocaleLowerCase();
    const filtered = message.rows.filter((row) =>
      message.columns.some((column) => String(row[column] ?? "").toLocaleLowerCase().includes(normalizedQuery)),
    );
    if (!sort) return filtered;
    return [...filtered].sort((first, second) => {
      const left = first[sort.column] ?? "";
      const right = second[sort.column] ?? "";
      const comparison = typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [message, query, sort]);

  function toggleSort(column: string) {
    setSort((current) => ({
      column,
      direction: current?.column === column && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  return (
    <section className={styles.tableCard} aria-label={message.title}>
      <div className={styles.dataHeading}>
        <h3>{message.title}</h3>
        <label className={styles.searchBox}>
          <span className={styles.srOnly}>Search table</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search rows" type="search" />
        </label>
      </div>
      <div className={styles.tableScroll}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              {message.columns.map((column) => (
                <th key={column} scope="col" aria-sort={sort?.column === column ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}>
                  <button type="button" onClick={() => toggleSort(column)}>
                    {column}<span aria-hidden="true">{sort?.column === column ? (sort.direction === "asc" ? " ↑" : " ↓") : " ↕"}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr key={`${message.id}-${index}`}>
                {message.columns.map((column) => <td key={column}>{String(row[column] ?? "—")}</td>)}
              </tr>
            ))}
            {!visibleRows.length && <tr><td className={styles.emptyTable} colSpan={message.columns.length}>No matching rows.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className={styles.tableCount}>{visibleRows.length} of {message.rows.length} rows</p>
    </section>
  );
}
