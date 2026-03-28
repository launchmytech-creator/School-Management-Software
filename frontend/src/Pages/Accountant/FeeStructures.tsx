import React, { useState, useEffect, useCallback } from 'react';
import AccountantLayout from '../../layouts/AccountantLayout';
import { useNotification } from '../../context/NotificationContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { feeStructureService, type FeeStructure } from '../../services/feeStructureService';
import { classService } from '../../services/classService';
import { academicYearService } from '../../services/academicYearService';
import type { Class } from '../../types/class';
import type { AcademicYear } from '../../types/academicYear';
import { Receipt, DollarSign, Info } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import FilterBar from '../../components/common/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonTable } from '../../components/common/Skeleton';

const AccountantFeeStructures: React.FC = () => {
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();
  const [loading, setLoading] = useState(true);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const getFeeTermsLabel = (feeTerms: number | null): string => {
    switch (feeTerms) {
      case 1: return 'Yearly';
      case 2: return 'Half-yearly';
      case 4: return 'Quarterly';
      case 12: return 'Monthly';
      default: return 'N/A';
    }
  };

  const fetchClasses = useCallback(async () => {
    try {
      const data = await classService.getClasses();
      setClasses(data);
    } catch {
      showNotification('Failed to fetch classes', 'error');
    }
  }, [showNotification]);

  const fetchAcademicYears = useCallback(async () => {
    try {
      const data = await academicYearService.getAllYears();
      setAcademicYears(data);
    } catch {
      showNotification('Failed to fetch academic years', 'error');
    }
  }, [showNotification]);

  const fetchFeeStructures = useCallback(async () => {
    try {
      setLoading(true);
      const filters: {
        classId?: number;
        academicYearId?: number;
      } = {};
      
      if (selectedClass) filters.classId = parseInt(selectedClass);
      if (yearFilter) filters.academicYearId = parseInt(yearFilter);
      
      const data = await feeStructureService.getFeeStructures(filters);
      setFeeStructures(data);
    } catch {
      showNotification('Failed to fetch fee structures', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, yearFilter, showNotification]);

  useEffect(() => {
    fetchClasses();
    fetchAcademicYears();
  }, [fetchClasses, fetchAcademicYears]);

  useEffect(() => {
    fetchFeeStructures();
  }, [fetchFeeStructures]);

  const filteredStructures = feeStructures.filter(s =>
    s.feeType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedStructures = filteredStructures.reduce((acc, curr) => {
    const key = `${curr.className} - ${curr.academicYearName}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(curr);
    return acc;
  }, {} as Record<string, FeeStructure[]>);

  const totalAmount = feeStructures.reduce((sum, s) => sum + s.amount, 0);

  return (
    <AccountantLayout title="Fee Structures">
      <div className="space-y-6 pb-12">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">View Only</p>
            <p className="text-sm text-blue-700 mt-1">
              You can view fee structures here. Contact your school administrator to create or modify fee structures.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">{feeStructures.length}</p>
                <p className="text-sm text-slate-500">Total Structures</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Receipt className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-700">{Object.keys(groupedStructures).length}</p>
                <p className="text-sm text-emerald-600">Classes with Fees</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl border border-purple-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-700">{formatCurrency(totalAmount)}</p>
                <p className="text-sm text-purple-600">Total Amount</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <FilterBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onReset={() => { setSearchTerm(''); setSelectedClass(''); setYearFilter(''); }}
          searchPlaceholder="Search by fee type or class..."
        >
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 min-w-40"
          >
            <option value="">All Classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name} - {cls.section || 'A'}</option>
            ))}
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 min-w-40"
          >
            <option value="">All Years</option>
            {academicYears.map(year => (
              <option key={year.id} value={year.id}>{year.name}</option>
            ))}
          </select>
        </FilterBar>

        {loading ? (
          <SkeletonTable columns={4} rows={8} />
        ) : Object.keys(groupedStructures).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedStructures).map(([groupName, structures]) => (
              <div key={groupName}>
                <h3 className="text-lg font-bold text-slate-900 mb-4">{groupName}</h3>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fee Type</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Term</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {structures.map((structure) => (
                        <tr key={structure.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-slate-900">{structure.feeType}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-emerald-600">{formatCurrency(structure.amount)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                              {getFeeTermsLabel(structure.feeTerms)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Receipt}
            title="No fee structures found"
            description={searchTerm || selectedClass || selectedYear ? "Try adjusting your filters" : "No fee structures have been created yet"}
          />
        )}
      </div>
    </AccountantLayout>
  );
};

export default AccountantFeeStructures;
