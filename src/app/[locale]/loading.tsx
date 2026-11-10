/**
 * Shown instantly when navigating while the next page renders on the server,
 * so clicks always get immediate feedback (Next.js prefetches this boundary).
 */
export default function Loading() {
  return (
    <div className="container-x pt-36 pb-16" aria-busy="true" aria-live="polite">
      <div className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden">
        <div className="h-full w-1/3 animate-[loading-bar_1.1s_ease-in-out_infinite] bg-accent" />
      </div>
      <div className="skeleton h-12 w-2/3 max-w-xl rounded-2xl" />
      <div className="skeleton mt-4 h-5 w-1/2 max-w-md rounded-full" />
      <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <div className="skeleton aspect-[5/6] rounded-2xl" />
            <div className="skeleton mt-4 h-4 w-3/4 rounded-full" />
            <div className="skeleton mt-2 h-4 w-1/3 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
