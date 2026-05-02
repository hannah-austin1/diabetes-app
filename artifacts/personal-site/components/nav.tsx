"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/diabetes", label: "Glucose" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-bg/70 border-b border-white/5">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-mono text-sm font-bold text-white hover:text-accent-blue transition-colors">
          hgjaustin
          <span className="text-accent-purple">.</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                pathname === link.href
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
