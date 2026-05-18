"use client";

export default function SkeletonLoader() {
  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-8 md:px-8">
      {/* Subject Heading Skeleton */}
      <div className="w-24 h-3 rounded skeleton mb-8" />

      {/* Paragraph 1 */}
      <div className="space-y-4 mb-8">
        <div className="w-full h-2.5 rounded skeleton opacity-100" />
        <div className="w-4/5 h-2.5 rounded skeleton opacity-90" />
        <div className="w-3/5 h-2.5 rounded skeleton opacity-80" />
      </div>

      {/* Paragraph 2 */}
      <div className="space-y-4 mb-8">
        <div className="w-full h-2.5 rounded skeleton opacity-70" />
        <div className="w-2/3 h-2.5 rounded skeleton opacity-60" />
      </div>

      {/* Paragraph 3 (shorter) */}
      <div className="space-y-4">
        <div className="w-5/6 h-2.5 rounded skeleton opacity-50" />
        <div className="w-1/2 h-2.5 rounded skeleton opacity-40" />
      </div>
    </div>
  );
}
