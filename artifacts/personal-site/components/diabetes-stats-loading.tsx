export function DiabetesStatsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="card-glass p-8 border border-white/8">
        <div className="h-32 bg-white/5 rounded-xl" />
      </div>
      <div className="card-glass p-6 border border-white/8">
        <div className="space-y-3">
          <div className="h-4 bg-white/5 rounded w-1/3" />
          <div className="h-2 bg-white/5 rounded" />
          <div className="h-2 bg-white/5 rounded" />
          <div className="h-2 bg-white/5 rounded" />
        </div>
      </div>
    </div>
  );
}
