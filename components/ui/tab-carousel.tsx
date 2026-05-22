"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface Tab {
  id: string;
  label: string;
  emoji: string;
  content: ReactNode;
}

interface TabCarouselProps {
  tabs: Tab[];
  className?: string;
}

export function TabCarousel({ tabs, className }: TabCarouselProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [direction, setDirection] = useState(0);

  function handleSelect(idx: number) {
    setDirection(idx > activeIdx ? 1 : -1);
    setActiveIdx(idx);
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/40 border border-border overflow-x-auto">
        {tabs.map((tab, i) => {
          const isActive = i === activeIdx;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelect(i)}
              className={cn(
                "relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-lg bg-card border border-border shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 text-base">{tab.emoji}</span>
              <span className="relative z-10 hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={tabs[activeIdx].id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {tabs[activeIdx].content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
