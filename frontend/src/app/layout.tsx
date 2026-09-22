import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guess The Word — 5-Letter Word Game",
  description:
    "A premium Wordle-style word guessing game. Guess the 5-letter word in 5 tries with color-coded hints.",
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
