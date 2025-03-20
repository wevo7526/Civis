import { Suspense } from 'react';
import AnalyticsContent from './AnalyticsContent';
import { Card } from '@/components/ui/card';

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsLoading />}>
      <AnalyticsContent />
    </Suspense>
  );
}

function AnalyticsLoading() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-gray-500">Track event performance and impact metrics</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
              <div className="h-8 bg-gray-200 rounded animate-pulse w-32" />
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <div className="h-[400px] bg-gray-100 rounded animate-pulse" />
      </Card>
    </div>
  );
} 