interface SectionHeaderProps {
  statusColor?: string;
  statusLabel: string;
  dateRange?: string;
  title: string;
  description?: string;
}

export function SectionHeader({
  statusColor = "bg-glucose-green",
  statusLabel,
  dateRange,
  title,
  description,
}: SectionHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className={`w-3 h-3 rounded-full animate-pulse ${statusColor}`} />
        <span className="text-sm text-muted-foreground font-mono">
          {statusLabel}
          {dateRange && <> · {dateRange}</>}
        </span>
      </div>
      <h1 className="text-5xl font-bold gradient-text mb-3">{title}</h1>
      {description && (
        <p className="text-muted-foreground max-w-2xl">{description}</p>
      )}
    </div>
  );
}
