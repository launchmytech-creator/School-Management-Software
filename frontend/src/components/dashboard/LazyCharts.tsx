import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const LazyAttendanceChart = lazy(() => 
  import('./AttendanceChart').then(m => ({ default: m.default }))
);

export const LazyFeeStatusChart = lazy(() => 
  import('./FeeStatusChart').then(m => ({ default: m.default }))
);

interface LazyChartProps {
  children: React.ReactNode;
  className?: string;
}

export const LazyChartWrapper: React.FC<LazyChartProps> = ({ children, className }) => (
  <Suspense
    fallback={
      <div className={className}>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm h-full flex items-center justify-center">
          <LoadingSpinner size="md" message="Loading chart..." />
        </div>
      </div>
    }
  >
    {children}
  </Suspense>
);
