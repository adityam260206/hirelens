export function FullScreenLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <span
        className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-brand"
        aria-label="Loading"
        role="status"
      />
    </div>
  );
}
