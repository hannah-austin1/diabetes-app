import { Card, CardContent } from "@/components/ui/card";

export function DiabetesStatsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <Card>
        <CardContent className="p-8">
          <div className="h-32 bg-secondary rounded-xl" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="h-4 bg-secondary rounded w-1/3" />
          <div className="h-2 bg-secondary rounded" />
          <div className="h-2 bg-secondary rounded" />
          <div className="h-2 bg-secondary rounded" />
        </CardContent>
      </Card>
    </div>
  );
}
