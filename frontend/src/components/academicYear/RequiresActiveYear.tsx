import React from 'react';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { Link } from 'react-router-dom';
import { AlertCircle, Calendar, RefreshCw } from 'lucide-react';

interface RequiresActiveYearProps {
  children: React.ReactNode;
}

const RequiresActiveYear: React.FC<RequiresActiveYearProps> = ({ children }) => {
  const { currentYear, loading, error, refreshYears } = useAcademicYear();

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500/20 border-t-blue-500"></div>
        <p className="text-slate-400 font-medium animate-pulse">Loading academic year data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-12 text-center max-w-2xl mx-auto shadow-sm">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-display font-black text-slate-900 mb-4 tracking-tight">
            Failed to Load Academic Years
          </h2>
          <p className="text-slate-600 mb-4 leading-relaxed">
            {error}
          </p>
          <p className="text-sm text-slate-500 mb-8">
            Please try again or contact support if the problem persists.
          </p>
          <button
            onClick={() => refreshYears()}
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentYear) {
    return (
      <div className="w-full p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-12 text-center max-w-2xl mx-auto shadow-sm">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600">
            <Calendar className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-display font-black text-slate-900 mb-4 tracking-tight">
            No Active Academic Year
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            There is currently no active academic year set for the system. 
            An active year is required to manage students, fees, and other records.
          </p>
          <Link 
            to="/admin/academic-years"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            Go to Settings → Academic Years
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequiresActiveYear;
