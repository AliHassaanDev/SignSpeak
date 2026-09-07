import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SignSpeak — Two-Way PSL Translator",
  description: "A modern two-way Pakistani Sign Language communication assistant.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
