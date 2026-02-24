export default function Loading() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="h-10 w-40 bg-muted animate-pulse mb-2" />
      <div className="h-4 w-64 bg-muted animate-pulse mb-8" />
      <div className="border-b border-border pb-6 mb-8">
        <div className="flex gap-4">
          <div className="h-10 w-36 bg-muted animate-pulse" />
          <div className="h-10 w-36 bg-muted animate-pulse" />
          <div className="h-10 w-28 bg-muted animate-pulse" />
          <div className="h-10 w-28 bg-muted animate-pulse" />
        </div>
      </div>
      <div className="space-y-0">
        <div className="h-10 bg-muted/50 animate-pulse border-b-2 border-foreground" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-14 bg-muted/30 animate-pulse border-b border-border"
          />
        ))}
      </div>
    </main>
  );
}
