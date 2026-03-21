import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { promotionService, type Promotion, type EligibleStudent } from '../../services/promotionService';
import { classService } from '../../services/classService';
import type { Class } from '../../types/class';
import { TrendingUp, Check, Users, ArrowRight } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { BaseModal } from '../../components/common/BaseModal';
import { Button } from '../../components/ui/button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const StudentPromotion: React.FC = () => {
  const { showNotification } = useNotification();
  const { allYears, selectedYear } = useAcademicYear();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [fromClass, setFromClass] = useState<string>('');
  const [toClass, setToClass] = useState<string>('');
  const [toAcademicYear, setToAcademicYear] = useState<string>('');
  const [eligibleStudents, setEligibleStudents] = useState<EligibleStudent[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [promoting, setPromoting] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const data = await classService.getClasses(selectedYear?.id);
      setClasses(data);
    } catch {
      showNotification('Failed to fetch classes', 'error');
    }
  }, [selectedYear, showNotification]);

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await promotionService.getPromotions({
        academicYearId: selectedYear?.id ? parseInt(selectedYear.id) : undefined,
      });
      setPromotions(data);
    } catch {
      showNotification('Failed to fetch promotions', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, showNotification]);

  const fetchEligibleStudents = useCallback(async () => {
    if (!fromClass || !toClass) return;
    
    try {
      const data = await promotionService.getEligibleStudents(
        parseInt(fromClass),
        parseInt(toClass)
      );
      setEligibleStudents(data);
      setSelectedStudents([]);
    } catch {
      showNotification('Failed to fetch eligible students', 'error');
    }
  }, [fromClass, toClass]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  useEffect(() => {
    if (fromClass && toClass) {
      fetchEligibleStudents();
    }
  }, [fromClass, toClass, fetchEligibleStudents]);

  const handlePromote = async () => {
    if (selectedStudents.length === 0) {
      showNotification('Please select at least one student', 'error');
      return;
    }

    try {
      setPromoting(true);
      await promotionService.promoteStudents({
        studentIds: selectedStudents,
        toClassId: parseInt(toClass),
        toAcademicYearId: toAcademicYear ? parseInt(toAcademicYear) : parseInt(selectedYear?.id || '0'),
      });
      showNotification(`${selectedStudents.length} students promoted successfully`, 'success');
      setShowModal(false);
      setSelectedStudents([]);
      fetchPromotions();
      fetchEligibleStudents();
    } catch {
      showNotification('Failed to promote students', 'error');
    } finally {
      setPromoting(false);
    }
  };

  const toggleStudent = (studentId: number) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleAll = () => {
    if (selectedStudents.length === eligibleStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(eligibleStudents.map(s => s.studentId));
    }
  };

  const nextYearOptions = allYears.filter(y => y.id !== selectedYear?.id);

  return (
    <AdminLayout title="Student Promotion">
      <div className="space-y-8 pb-12">
        <PageHeader 
          title="Student Promotion"
          subtitle="Promote students to the next class"
          breadcrumb={{
            links: [
              { label: "Admin", href: "/admin/dashboard" },
              { label: "Student Promotion", active: true }
            ]
          }}
        />

        {/* Promotion Controls */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Promote Students</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">From Class</label>
              <select
                value={fromClass}
                onChange={(e) => {
                  setFromClass(e.target.value);
                  setToClass('');
                }}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name} - Section {cls.section || 'A'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">To Class</label>
              <select
                value={toClass}
                onChange={(e) => setToClass(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!fromClass}
              >
                <option value="">Select Class</option>
                {classes
                  .filter(cls => cls.id !== fromClass)
                  .map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name} - Section {cls.section || 'A'}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">To Academic Year</label>
              <select
                value={toAcademicYear}
                onChange={(e) => setToAcademicYear(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Current Year</option>
                {nextYearOptions.map(year => (
                  <option key={year.id} value={year.id}>{year.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => setShowModal(true)}
                disabled={!fromClass || !toClass}
                className="w-full"
              >
                <Users className="w-4 h-4 mr-2" />
                Select Students
              </Button>
            </div>
          </div>
        </div>

        {/* Eligible Students Preview */}
        {fromClass && toClass && eligibleStudents.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-700 font-medium">
              {eligibleStudents.length} students eligible for promotion from{' '}
              {classes.find(c => c.id.toString() === fromClass)?.name} to{' '}
              {classes.find(c => c.id.toString() === toClass)?.name}
            </p>
          </div>
        )}

        {/* Promotion History */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Promotion History</h3>
          
          {loading ? (
            <div className="bg-white rounded-2xl p-12 flex items-center justify-center">
              <LoadingSpinner size="lg" message="Loading history..." />
            </div>
          ) : promotions.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase">Student</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-500 uppercase">From</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-500 uppercase">To</th>
                    <th className="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {promotions.map((promotion) => (
                    <tr key={promotion.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{promotion.studentName}</p>
                        <p className="text-sm text-slate-500">{promotion.admissionNumber}</p>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-slate-600">
                        {promotion.fromClassName}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <ArrowRight className="w-4 h-4 text-slate-400 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-slate-900">{promotion.toClassName}</span>
                        <p className="text-sm text-slate-500">{formatDate(promotion.promotedAt)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center">
              <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">No Promotions Yet</h3>
              <p className="text-slate-500">Student promotions will appear here</p>
            </div>
          )}
        </div>

        {/* Student Selection Modal */}
        <BaseModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Select Students to Promote"
          size="lg"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-600">
                {selectedStudents.length} of {eligibleStudents.length} selected
              </p>
              <button
                onClick={toggleAll}
                className="text-sm font-bold text-blue-600 hover:underline"
              >
                {selectedStudents.length === eligibleStudents.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto mb-6">
              {eligibleStudents.map((student) => (
                <label
                  key={student.studentId}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    selectedStudents.includes(student.studentId)
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.studentId)}
                    onChange={() => toggleStudent(student.studentId)}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{student.studentName}</p>
                    <p className="text-sm text-slate-500">{student.admissionNumber}</p>
                  </div>
                  <span className="text-sm text-slate-500">{student.currentClassName}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePromote}
                loading={promoting}
                disabled={selectedStudents.length === 0}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Promote {selectedStudents.length} Students
              </Button>
            </div>
          </div>
        </BaseModal>
      </div>
    </AdminLayout>
  );
};

export default StudentPromotion;
