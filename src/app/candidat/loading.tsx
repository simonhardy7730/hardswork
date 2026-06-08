export default function CandidatLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-ink-100 rounded-xl" />
          <div className="h-4 w-44 bg-ink-100 rounded" />
        </div>
        <div className="h-10 w-36 bg-ink-100 rounded-xl" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-ink-100 rounded-2xl p-4 text-center space-y-2">
            <div className="h-8 w-10 bg-ink-100 rounded-lg mx-auto" />
            <div className="h-3 w-20 bg-ink-100 rounded mx-auto" />
          </div>
        ))}
      </div>
      {/* Content */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-5">
        <div className="bg-white border border-ink-100 rounded-2xl h-80" />
        <div className="space-y-4">
          <div className="bg-white border border-ink-100 rounded-2xl h-44" />
          <div className="bg-white border border-ink-100 rounded-2xl h-48" />
        </div>
      </div>
    </div>
  );
}
