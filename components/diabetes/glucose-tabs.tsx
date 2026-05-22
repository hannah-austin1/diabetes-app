"use client";

import { type ReactNode } from "react";
import { TabCarousel, type Tab } from "@/components/ui/tab-carousel";

interface GlucoseTabsProps {
  overview: ReactNode;
  patterns: ReactNode;
  funStats: ReactNode;
  wellness: ReactNode;
}

export function GlucoseTabs({ overview, patterns, funStats, wellness }: GlucoseTabsProps) {
  const tabs: Tab[] = [
    { id: "overview", label: "Overview", emoji: "📊", content: overview },
    { id: "patterns", label: "Patterns", emoji: "⏰", content: patterns },
    { id: "fun-stats", label: "Fun Stats", emoji: "🎲", content: funStats },
    { id: "wellness", label: "Wellness", emoji: "🧘", content: wellness },
  ];

  return <TabCarousel tabs={tabs} />;
}
