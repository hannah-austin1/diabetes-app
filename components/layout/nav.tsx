"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LiveGlucoseBadge } from "./live-glucose-badge";

const links = [
  { href: "/", label: "Home", emoji: "🏠" },
  { href: "/diabetes", label: "Glucose", emoji: "🎢" },
  { href: "/health", label: "Health", emoji: "🏃" },
  { href: "/finch", label: "Finch", emoji: "🐦" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-mono text-sm font-bold text-foreground hover:text-primary transition-colors flex items-center gap-2"
          >
            <motion.span
              className="text-xl"
              whileHover={{ rotate: [0, -15, 15, 0], scale: 1.2 }}
              transition={{ duration: 0.4 }}
            >
              ✨
            </motion.span>
            hgjaustin
            <span className="text-glucose-purple">.</span>
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
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <motion.span
                  className="text-base"
                  whileHover={{ scale: 1.3, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {link.emoji}
                </motion.span>
                <span className="hidden md:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
