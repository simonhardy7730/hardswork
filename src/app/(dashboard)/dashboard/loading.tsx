export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-ink-100 rounded-xl" />
          <div className="h-4 w-40 bg-ink-100 rounded" />
        </div>
        <div className="h-10 w-36 bg-ink-100 rounded-xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-ink-100 rounded-2xl p-5 space-y-2">
            <div className="h-8 w-12 bg-ink-100 rounded-lg" />
            <div className="h-3 w-20 bg-ink-100 rounded" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        <div className="bg-white border border-ink-100 rounded-2xl h-96" />
        <div className="space-y-4">
          <div className="bg-white border border-ink-100 rounded-2xl h-48" />
          <div className="bg-white border border-ink-100 rounded-2xl h-36" />
        </div>
      </div>
    </div>
  );
}
