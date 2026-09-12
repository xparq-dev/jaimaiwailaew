export default function Loading() {
  return (
    <div aria-busy="true" aria-label="กำลังโหลด" className="space-y-5">
      <div className="bg-muted h-7 w-32 animate-pulse rounded-lg" />
      <div className="bg-muted h-12 max-w-xl animate-pulse rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-muted h-40 animate-pulse rounded-2xl" />
        <div className="bg-muted h-40 animate-pulse rounded-2xl" />
      </div>
      <span className="sr-only">กำลังโหลดเนื้อหา</span>
    </div>
  );
}
