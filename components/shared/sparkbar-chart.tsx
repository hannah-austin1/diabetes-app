interface SparkbarItem {
  key: string;
  value: number;
  label?: string;
}

interface SparkbarChartProps {
  data: SparkbarItem[];
  color: string;
  emptyColor?: string;
  emptyOpacity?: number;
  height?: string;
  isZero?: (item: SparkbarItem) => boolean;
}

export function SparkbarChart({
  data,
  color,
  emptyColor,
  emptyOpacity = 0.3,
  height = "h-10",
  isZero,
}: SparkbarChartProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={`flex items-end gap-1 ${height}`}>
      {data.map((d) => {
        const heightPct = (d.value / max) * 100;
        const isEmpty = isZero ? isZero(d) : d.value === 0;

        return (
          <div
            key={d.key}
            className="flex-1 flex items-end"
            title={d.label}
          >
            <div
              className="w-full rounded-sm"
              style={{
                height: `${Math.max(8, heightPct)}%`,
                backgroundColor: isEmpty ? (emptyColor ?? "hsl(var(--muted))") : color,
                opacity: isEmpty ? emptyOpacity : 0.7,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
