import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/layout/nav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "hgjaustin — Personal Site",
  description: "Developer, T1D warrior, building cool stuff.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-mesh antialiased font-sans">
        <Nav />
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-border py-8 mt-16">
          <div className="max-w-5xl mx-auto px-6 text-center text-sm text-muted-foreground">
            Built with Next.js 15 · React Server Components · Real data from Nightscout
          </div>
        </footer>
      </body>
    </html>
  );
}
