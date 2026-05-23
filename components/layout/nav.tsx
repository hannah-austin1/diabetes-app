"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LiveGlucoseBadge } from "./live-glucose-badge";
import hannah from "@/public/hannah.png"
const links = [
  { href: "/", label: "Home", emoji: "🏠" },
  { href: "/about", label: "About", emoji: "👩‍💻" },
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
            <div className="h-10 w-10 flex items-center justify-center">
              <motion.span
                whileHover={{ rotate: [0, -15, 15, 0], scale: 1.2 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full flex items-center justify-center"
              >
                <Image
                  src={hannah}
                  alt="memoji"
                  width={100}
                  height={100}
                  className="object-contain"
                  priority
                />
              </motion.span>
            </div>
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
