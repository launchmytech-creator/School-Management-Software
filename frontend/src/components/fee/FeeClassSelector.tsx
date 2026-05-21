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
import { formatCurrency, sortByGrade } from '../../lib/utils';

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
    if (!searchTerm.trim()) return sortByGrade(allClasses);
    const search = searchTerm.toLowerCase();
    return sortByGrade(
      allClasses.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          (c.section && c.section.toLowerCase().includes(search))
      )
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

      <div className="space-y-4">
        {filteredClasses.map((cls) => {
          const stats = classStats[String(cls.id)] || { totalCollected: 0, totalPending: 0, studentCount: 0, defaulterCount: 0 };
          return (
            <div
              key={cls.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`${basePath}/${targetPath}/class/${cls.id}`)}
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      mode === 'collection' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {mode === 'collection' ? <IndianRupee className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {cls.name}
                        {cls.section && ` - Section ${cls.section}`}
                      </h3>
                      <p className="text-sm text-slate-500">
                        Section {cls.section || 'A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {mode === 'collection' ? (
                      <>
                        <div className="text-right">
                          <span className="text-xs text-slate-500 block">Collected</span>
                          <span className="text-sm font-semibold text-emerald-600">{formatCurrency(stats.totalCollected)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500 block">Pending</span>
                          <span className="text-sm font-semibold text-rose-600">{formatCurrency(stats.totalPending)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500 block">Transactions</span>
                          <span className="text-sm font-medium text-slate-600 flex items-center gap-1">
                            <IndianRupee className="w-3.5 h-3.5" />
                            {stats.studentCount}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Defaulters</span>
                        <span className={`text-sm font-semibold flex items-center gap-1 ${stats.defaulterCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          <AlertTriangle className={`w-3.5 h-3.5 ${stats.defaulterCount > 0 ? 'text-rose-400' : 'text-slate-300'}`} />
                          {stats.defaulterCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FeeClassSelector;
