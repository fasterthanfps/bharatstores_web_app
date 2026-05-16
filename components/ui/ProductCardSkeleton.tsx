// components/ui/ProductCardSkeleton.tsx

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-masala-border animate-pulse">
      {/* Image area — matches 4:3 card ratio */}
      <div className="aspect-[4/3] bg-masala-muted" />
      {/* Info area */}
      <div className="p-3 space-y-2.5">
        <div className="h-3.5 bg-masala-muted rounded-full w-4/5" />
        <div className="h-3 bg-masala-muted rounded-full w-3/5" />
        <div className="h-3 bg-masala-muted/50 rounded-full w-2/5" />
        <div className="flex items-end justify-between mt-3">
          <div className="space-y-1">
            <div className="h-2.5 bg-masala-muted rounded-full w-16" />
            <div className="h-7 bg-masala-muted rounded-full w-20" />
            <div className="h-2.5 bg-masala-muted/60 rounded-full w-14" />
          </div>
          <div className="h-7 w-20 bg-masala-muted rounded-full" />
        </div>
        <div className="flex gap-2 pt-1">
          <div className="h-[42px] bg-masala-muted rounded-xl flex-1" />
          <div className="h-[42px] w-[42px] bg-masala-muted/60 rounded-xl flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}

// Grid of skeletons for Suspense fallbacks
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
