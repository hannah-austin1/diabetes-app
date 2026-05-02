import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";

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
    <html lang="en">
      <body className="bg-mesh noise antialiased">
        <Nav />
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-white/5 py-8 mt-16">
          <div className="max-w-5xl mx-auto px-6 text-center text-sm text-gray-600">
            Built with Next.js 15 · React Server Components · Real data from Nightscout
          </div>
        </footer>
      </body>
    </html>
  );
}
