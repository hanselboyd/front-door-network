import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Front Door Network | AI Cinema",
  description: "The front door to AI cinema. Original films, emerging creators and AI-native storytelling.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
