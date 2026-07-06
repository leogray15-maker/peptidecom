/** Skeleton shown instantly while admin pages fetch their data. */
export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-48 rounded-lg bg-white/5" />
        <div className="mt-2 h-4 w-72 rounded-lg bg-white/5" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card h-20 !p-4" />
        ))}
      </div>
      <div className="card mt-4 h-64" />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card h-48" />
        <div className="card h-48" />
      </div>
    </div>
  );
}
