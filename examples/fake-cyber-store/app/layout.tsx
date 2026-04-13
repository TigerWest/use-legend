import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import Head from "next/head";

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
      <Head>
        <Script
          src="//unpkg.com/react-scan/dist/auto.global.js"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      </Head>
      <body>{children}</body>
    </html>
  );
}
