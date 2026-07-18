import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/layout/nav";
import navData from "@/data/nav.json";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: navData.metadata.title,
  description: navData.metadata.description,
};

const { footer } = navData;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} bg-background`}>
      <body className="bg-mesh antialiased font-sans">
        <Nav />
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-border py-8 mt-16 bg-card/50">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
              <span>{footer.builtWith}</span>
              <span className="inline-block hover:scale-125 transition-transform cursor-default">{footer.emoji}</span>
              <span>{footer.framework}</span>
            </div>
            <div className="text-xs text-muted-foreground/60">
              {footer.tagline}
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
