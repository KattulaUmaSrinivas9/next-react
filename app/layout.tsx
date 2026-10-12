import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Uma Srinivas | UI Full Stack Engineer",
  description: "Portfolio of Uma Srinivas — UI full stack engineer building thoughtful interfaces and scalable systems.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
