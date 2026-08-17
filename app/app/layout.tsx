import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthCallbackRedirect from "../components/AuthCallbackRedirect";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crowned Victors Ministry",
  description: "Equipping the saints to walk in bold faith, spiritual authority, and kingdom purpose.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthCallbackRedirect />
        {children}
      </body>
    </html>
  );
}
