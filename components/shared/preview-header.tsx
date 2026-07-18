interface PreviewHeaderProps {
  emoji: string;
  title: string;
}

export function PreviewHeader({ emoji, title }: PreviewHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-2xl">{emoji}</span>
      <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
        {title}
      </h2>
    </div>
  );
}
