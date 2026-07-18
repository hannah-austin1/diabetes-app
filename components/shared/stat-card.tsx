"use client";

import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  emoji: string;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

export function StatCard({ emoji, label, value, sub, color = "text-primary" }: StatCardProps) {
  return (
    <Card className="hover:border-primary/30 transition-all duration-300 group">
      <CardContent className="p-5">
        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform inline-block">
          {emoji}
        </div>
        <div className={`text-2xl font-bold font-mono ${color} mb-1`}>{value}</div>
        <div className="text-xs font-semibold text-foreground mb-1">{label}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
