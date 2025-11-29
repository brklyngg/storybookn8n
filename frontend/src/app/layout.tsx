import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Storybook Generator (n8n)",
  description: "AI-powered children's picture book generator - n8n workflow edition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50">
        {children}
      </body>
    </html>
  );
}

