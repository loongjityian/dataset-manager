export function HeaderSkeleton() {
  return (
    <div className="border-b border-line px-4 pt-4 pb-14 md:px-8 md:pt-7" aria-busy="true" aria-label="Loading">
      <div className="shimmer h-10 w-64 max-w-full rounded-md" />
      <div className="shimmer mt-4 h-3 w-96 max-w-full rounded" />
    </div>
  )
}
