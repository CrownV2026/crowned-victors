import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crowned Victors Ministry",
  description: "Equipping the saints to walk in bold faith, spiritual authority, and kingdom purpose.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
