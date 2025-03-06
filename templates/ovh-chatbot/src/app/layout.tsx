import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OVH Chatbot template",
  description: "OVH Chatbot template by synaigy",
  icons: {
    icon: "/favicon.ico",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#0f1941",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full min-h-screen scroll-smooth">
      <body
        className={`${inter.variable} font-sans h-full min-h-screen antialiased flex flex-col`}
      >
        <Header />
        <main className="flex-1 flex relative overflow-hidden">{children}</main>
      </body>
    </html>
  );
}
