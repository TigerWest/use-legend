import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fake Cyber Store",
  description: "A frontend-only use-legend store example.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
