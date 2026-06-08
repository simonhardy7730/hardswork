export default function JobsLoading() {
  return (
    <div className="min-h-screen bg-[#F4F1EC] font-body">
      {/* Hero skeleton */}
      <div className="bg-[#0F0E0D] pt-[60px] pb-6">
        <div className="max-w-7xl mx-auto px-6 pt-8">
          <div className="h-12 w-80 bg-white/10 rounded-xl animate-pulse mb-6" />
          <div className="flex gap-2 mb-5">
            <div className="flex-1 h-12 bg-white/10 rounded-xl animate-pulse" />
            <div className="w-32 h-12 bg-white/10 rounded-xl animate-pulse" />
            <div className="w-32 h-12 bg-white/10 rounded-xl animate-pulse" />
            <div className="w-28 h-12 bg-brand/40 rounded-xl animate-pulse" />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 w-24 bg-white/10 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* List */}
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-ink-100 flex items-center gap-4 px-4 py-3">
                <div className="w-16 h-16 rounded-lg bg-ink-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-ink-100 rounded animate-pulse" />
                  <div className="h-3 w-64 bg-ink-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-ink-100 h-64 animate-pulse" />
            <div className="bg-white rounded-2xl border border-ink-100 h-36 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
