import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, IndianRupee, AlertTriangle } from 'lucide-react';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useClasses } from '../../hooks/queries/useClasses';
import { useFeeTransactions, useFeeDefaulters } from '../../hooks/queries/useFeeTransactions';
import PageHeader from '../common/PageHeader';
import { LoadingSpinner } from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import FilterBar from '../common/FilterBar';
import { formatCurrency } from '../../lib/utils';

interface FeeClassSelectorProps {
  mode: 'collection' | 'defaulters';
  layout: 'admin' | 'accountant';
}

const FeeClassSelector: React.FC<FeeClassSelectorProps> = ({ mode, layout }) => {
  const navigate = useNavigate();
  const { selectedYear } = useAcademicYear();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: allClasses = [], isLoading: loadingClasses } = useClasses(selectedYear?.id);

  const academicYearId = selectedYear?.id ? parseInt(selectedYear.id) : undefined;

  const { data: transactions = [], isLoading: loadingTransactions } = useFeeTransactions({
    academicYearId,
  });

  const { data: defaulters = [], isLoading: loadingDefaulters } = useFeeDefaulters({
    academicYearId,
  });

  const classStats = useMemo(() => {
    const stats: Record<string, { totalCollected: number; totalPending: number; studentCount: number; defaulterCount: number }> = {};

    allClasses.forEach((cls) => {
      stats[String(cls.id)] = { totalCollected: 0, totalPending: 0, studentCount: 0, defaulterCount: 0 };
    });

    transactions.forEach((tx) => {
      const key = allClasses.find((c) => c.name === tx.className)?.id;
      if (key) {
        const k = String(key);
        if (!stats[k]) stats[k] = { totalCollected: 0, totalPending: 0, studentCount: 0, defaulterCount: 0 };
        stats[k].studentCount++;
        stats[k].totalCollected += tx.amountPaid || 0;
        stats[k].totalPending += tx.amountPending || 0;
      }
    });

    defaulters.forEach((d) => {
      const key = allClasses.find((c) => c.name === d.className)?.id;
      if (key) {
        const k = String(key);
        if (stats[k]) {
          stats[k].defaulterCount++;
        }
      }
    });

    return stats;
  }, [allClasses, transactions, defaulters]);

  const filteredClasses = useMemo(() => {
    if (!searchTerm.trim()) return allClasses;
    const search = searchTerm.toLowerCase();
    return allClasses.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        (c.section && c.section.toLowerCase().includes(search))
    );
  }, [allClasses, searchTerm]);

  const basePath = layout === 'admin' ? '/admin' : '/accountant';
  const targetPath = mode === 'collection' ? 'fees' : 'fee-defaulters';

  if (loadingClasses || loadingTransactions || (mode === 'defaulters' && loadingDefaulters)) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading classes..." />
      </div>
    );
  }

  if (filteredClasses.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No classes found"
        description={searchTerm ? 'Try adjusting your search' : 'No classes available for the selected academic year'}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={mode === 'collection' ? 'Fee Collection' : 'Fee Defaulters'}
        subtitle={mode === 'collection' ? 'Select a class to manage fee payments' : 'Select a class to view fee defaulters'}
        breadcrumb={{
          links: [
            { label: 'Finance', href: `${basePath}/fees` },
            { label: mode === 'collection' ? 'Fee Collection' : 'Fee Defaulters', active: true },
          ],
        }}
      />

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onReset={() => setSearchTerm('')}
        searchPlaceholder="Search class or section..."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredClasses.map((cls) => {
          const stats = classStats[String(cls.id)] || { totalCollected: 0, totalPending: 0, studentCount: 0, defaulterCount: 0 };
          return (
            <button
              key={cls.id}
              onClick={() => navigate(`${basePath}/${targetPath}/class/${cls.id}`)}
              className="bg-white rounded-xl border border-slate-200 p-6 text-left hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-xl flex items-center justify-center transition-all ${
                    mode === 'collection'
                      ? 'bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white'
                      : 'bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white'
                  }`}>
                    {mode === 'collection' ? <IndianRupee className="size-5" /> : <AlertTriangle className="size-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{cls.name}</h3>
                    <p className="text-sm text-slate-500">Section {cls.section || 'A'}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-1">
                {mode === 'collection' ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Collected</span>
                      <span className="font-semibold text-emerald-600">{formatCurrency(stats.totalCollected)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Pending</span>
                      <span className="font-semibold text-rose-600">{formatCurrency(stats.totalPending)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 pt-1 border-t border-slate-100">
                      <IndianRupee className="size-4 text-slate-400" />
                      <span className="font-semibold">{stats.studentCount} transactions</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <AlertTriangle className="size-4 text-rose-400" />
                    <span className="font-semibold">{stats.defaulterCount} defaulters</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FeeClassSelector;
