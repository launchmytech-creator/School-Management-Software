import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import { useNotification } from '../../context/NotificationContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { feeService, type FeeDefaulter } from '../../services/feeService';
import { feeStructureService } from '../../services/feeStructureService';
import { classService } from '../../services/classService';
import type { Class } from '../../types/class';
import { AlertTriangle, Phone, User, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const FeeDefaulters: React.FC = () => {
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();
  const [loading, setLoading] = useState(true);
  const [defaulters, setDefaulters] = useState<FeeDefaulter[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [feeTypes, setFeeTypes] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [feeTypeFilter, setFeeTypeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchFeeTypes = async () => {
      try {
        const types = await feeStructureService.getUniqueFeeTypes();
        setFeeTypes(types);
      } catch {
        // Ignore error
      }
    };
    fetchFeeTypes();
  }, []);

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
      const data = await feeService.getFeeDefaulters({
        classId: selectedClass ? parseInt(selectedClass) : undefined,
        academicYearId: selectedYear?.id ? parseInt(selectedYear.id) : undefined,
      });
      setDefaulters(data);
    } catch {
      showNotification('Failed to fetch fee defaulters', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedYear, showNotification]);

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
    <AdminLayout title="Fee Defaulters">
      <div className="space-y-8 pb-12">
        <PageHeader 
          title="Fee Defaulters"
          subtitle="Students with pending fee payments"
          breadcrumb={{
            links: [
              { label: "Admin", href: "/admin/dashboard" },
              { label: "Fees", href: "/admin/fees" },
              { label: "Defaulters", active: true }
            ]
          }}
        />

        {/* Summary Cards */}
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
          <div className="bg-white rounded-xl p-6 border border-slate-100">
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
          <div className="bg-white rounded-xl p-6 border border-slate-100">
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
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700"
          >
            <option value="">All Classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
          <select
            value={feeTypeFilter}
            onChange={(e) => setFeeTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700"
          >
            <option value="">All Fee Types</option>
            {feeTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </FilterBar>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 flex items-center justify-center">
            <LoadingSpinner size="lg" message="Loading defaulters..." />
          </div>
        ) : filteredDefaulters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDefaulters.map((defaulter) => (
              <div key={defaulter.studentId} className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900">{defaulter.studentName}</h3>
                    <p className="text-sm text-slate-500">{defaulter.admissionNumber}</p>
                  </div>
                  <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-lg">
                    Due: {formatCurrency(defaulter.totalDue)}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <User className="w-4 h-4" />
                    <span>{defaulter.className}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="text-slate-400">Parent:</span>
                    <span>{defaulter.parentName}</span>
                  </div>
                  {defaulter.parentPhone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <a href={`tel:${defaulter.parentPhone}`} className="text-blue-600 hover:underline">
                        {defaulter.parentPhone}
                      </a>
                    </div>
                  )}
                </div>

                {defaulter.pendingTerms.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-2">Pending Terms:</p>
                    <div className="flex flex-wrap gap-2">
                      {defaulter.pendingTerms.map((term, index) => (
                        <span key={index} className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded">
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => showNotification('Send reminder coming soon', 'info')}
                  className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors"
                >
                  Send Reminder
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Defaulters Found</h3>
            <p className="text-slate-500">All students have cleared their fees</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default FeeDefaulters;
