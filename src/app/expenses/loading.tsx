export default function Loading() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="flex gap-3 mb-6">
        <div className="h-9 w-36 bg-gray-200 rounded animate-pulse" />
        <div className="h-9 w-36 bg-gray-200 rounded animate-pulse" />
        <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-12 bg-gray-100 rounded animate-pulse"
          />
        ))}
      </div>
    </main>
  );
}
