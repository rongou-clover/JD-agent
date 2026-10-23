import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "JD Agent",
  description: "Scrivi la job description con l'agent di Clover.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className={`${poppins.variable} h-full antialiased`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
