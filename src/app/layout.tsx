import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trevolk — Apple Smartphones, Accessories & Support",
  description:
    "Demo Apple storefront powered by Trevolk support automation. Ask the chat about an order, shipping, returns or products — or ask for a human and watch the handoff.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${sora.variable}`}>
      <body className="bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
