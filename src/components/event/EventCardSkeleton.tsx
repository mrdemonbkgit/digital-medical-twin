/**
 * Loading skeleton for EventCard.
 * Matches the dimensions and layout of EventCard for seamless loading states.
 */
export function EventCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-theme-primary border-l-4 border-l-theme-tertiary bg-theme-primary">
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon placeholder */}
          <div className="flex-shrink-0">
            <div className="h-9 w-9 rounded-lg bg-theme-tertiary" />
          </div>

          {/* Content placeholder */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-2">
                {/* Title */}
                <div className="h-5 w-3/4 rounded bg-theme-tertiary" />
                {/* Type badge and date */}
                <div className="flex items-center gap-2">
                  <div className="h-4 w-20 rounded bg-theme-tertiary" />
                  <div className="h-4 w-24 rounded bg-theme-tertiary" />
                </div>
              </div>

              {/* Action buttons placeholder */}
              <div className="flex items-center gap-1">
                <div className="h-8 w-8 rounded bg-theme-tertiary" />
                <div className="h-8 w-8 rounded bg-theme-tertiary" />
                <div className="h-8 w-8 rounded bg-theme-tertiary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Multiple skeletons for loading state.
 */
export function EventCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}
