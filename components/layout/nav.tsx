"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LiveGlucoseBadge } from "./live-glucose-badge";

const links = [
  { href: "/", label: "Home" },
  { href: "/diabetes", label: "Glucose" },
  { href: "/health", label: "Health" },
  { href: "/finch", label: "Finch" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="font-mono text-sm font-semibold text-foreground hover:text-primary transition-colors"
          >
            hgjaustin<span className="text-primary">.</span>
          </Link>
          <LiveGlucoseBadge />
        </div>

        <div className="flex items-center gap-1">
          {links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
