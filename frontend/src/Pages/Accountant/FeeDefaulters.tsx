import React, { useState, useEffect, useCallback } from 'react';
import AccountantLayout from '../../layouts/AccountantLayout';
import FilterBar from '../../components/common/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { feeService, type FeeDefaulter } from '../../services/feeService';
import { classService } from '../../services/classService';
import type { Class } from '../../types/class';
import { AlertTriangle, Phone, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { SkeletonTable } from '../../components/common/Skeleton';

const AccountantFeeDefaulters: React.FC = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [defaulters, setDefaulters] = useState<FeeDefaulter[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClasses = useCallback(async () => {
    try {
      const data = await classService.getClasses();
      setClasses(data);
    } catch {
      showNotification('Failed to fetch classes', 'error');
    }
  }, [showNotification]);

  const fetchDefaulters = useCallback(async () => {
    try {
      setLoading(true);
      const data = await feeService.getFeeDefaulters(
        selectedClass ? parseInt(selectedClass) : undefined
      );
      setDefaulters(data);
    } catch {
      showNotification('Failed to fetch fee defaulters', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, showNotification]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchDefaulters();
  }, [fetchDefaulters]);

  const totalDue = defaulters.reduce((sum, d) => sum + d.totalDue, 0);

  const filteredDefaulters = defaulters.filter(d =>
    d.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.parentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AccountantLayout title="Fee Defaulters">
      <div className="space-y-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-3xl font-bold">{defaulters.length}</p>
                <p className="text-rose-100">Total Defaulters</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-50 rounded-xl">
                <AlertCircle className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalDue)}</p>
                <p className="text-sm text-slate-500">Total Amount Due</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-xl">
                <Phone className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {defaulters.filter(d => d.parentPhone).length}
                </p>
                <p className="text-sm text-slate-500">With Contact Info</p>
              </div>
            </div>
          </div>
        </div>

        <FilterBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onReset={() => { setSearchTerm(''); setSelectedClass(''); }}
          searchPlaceholder="Search student, parent..."
        >
          <div className="flex items-center gap-3">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
        </FilterBar>

        {loading ? (
          <SkeletonTable columns={4} rows={6} />
        ) : filteredDefaulters.length > 0 ? (
          <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Parent</th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Amount Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDefaulters.map((defaulter) => (
                    <tr key={defaulter.studentId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-rose-100 flex items-center justify-center">
                            <span className="text-rose-600 font-bold text-sm">
                              {defaulter.studentName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{defaulter.studentName}</p>
                            <p className="text-xs text-slate-500">{defaulter.admissionNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{defaulter.className}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">{defaulter.parentName}</div>
                        {defaulter.parentPhone && (
                          <a href={`tel:${defaulter.parentPhone}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {defaulter.parentPhone}
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-lg">
                          {formatCurrency(defaulter.totalDue)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={AlertCircle}
            title="No defaulters found"
            description="All students have cleared their fees"
          />
        )}
      </div>
    </AccountantLayout>
  );
};

export default AccountantFeeDefaulters;
