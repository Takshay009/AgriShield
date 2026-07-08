import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AgriShield | Precision Web3 Agriculture & ZKP Insurance",
  description: "Data-driven Web3 Agricultural Insurance & ResNet18 AI Vision",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-full flex flex-col antialiased`}>{children}</body>
    </html>
  );
}
