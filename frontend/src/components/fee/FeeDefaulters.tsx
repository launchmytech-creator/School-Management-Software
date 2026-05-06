import React, { useState } from 'react';
import PageHeader from '../common/PageHeader';
import FilterBar from '../common/FilterBar';
import EmptyState from '../common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { useFeeDefaultersPage } from '../../hooks/useFeeDefaultersPage';
import { useAuth } from '../../context/AuthContext';
import { parentService } from '../../services/parentService';
import { notificationService } from '../../services/notificationService';
import { AlertTriangle, Phone, AlertCircle, Send } from 'lucide-react';
import { formatCurrency, getLocalDateString } from '../../lib/utils';
import { SkeletonTable } from '../common/Skeleton';
import { BaseModal } from '../modals/BaseModal';
import { Button } from '../ui/button';
import type { FeeDefaulter } from '../../services/feeService';

const FeeDefaulters: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedDefaulter, setSelectedDefaulter] = useState<FeeDefaulter | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [parentLookupLoading, setParentLookupLoading] = useState(false);

  const {
    classes,
    filteredDefaulters,
    isLoading,
    totalDue,
    withContactCount,
    selectedClass,
    setSelectedClass,
    searchTerm,
    setSearchTerm,
  } = useFeeDefaultersPage();

  const handleSendReminder = (defaulter: FeeDefaulter) => {
    setSelectedDefaulter(defaulter);
    setShowReminderModal(true);
  };

  const findParentByStudent = async (studentId: number): Promise<number | null> => {
    try {
      const parents = await parentService.getParents();
      for (const parent of parents) {
        try {
          const children = await parentService.getParentChildren(parent.id);
          if (children.some(c => c.id === studentId)) {
            return parent.id;
          }
        } catch {
          continue;
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  const sendReminder = async () => {
    if (!selectedDefaulter) return;
    
    if (!selectedDefaulter.parentEmail && !selectedDefaulter.parentPhone) {
      showNotification('No contact information available for this parent', 'error');
      return;
    }
    
    try {
      setSendingReminder(true);
      setParentLookupLoading(true);
      
      const parentId = await findParentByStudent(selectedDefaulter.studentId);
      
      if (!parentId) {
        showNotification('No parent account linked to this student. Please contact administrator to link parent account.', 'error');
        return;
      }
      
      await notificationService.sendFeeReminder({
        parentId,
        studentName: selectedDefaulter.studentName,
        amountDue: formatCurrency(selectedDefaulter.totalDue),
        dueDate: getLocalDateString(),
      });
      showNotification('Fee reminder sent successfully', 'success');
      setShowReminderModal(false);
    } catch (error) {
      console.error('Failed to send reminder:', error);
      showNotification('Failed to send reminder. Please try again or contact administrator.', 'error');
    } finally {
      setSendingReminder(false);
      setParentLookupLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Fee Defaulters"
        subtitle="Students with pending fee payments"
        breadcrumb={{
          links: [
            { label: user?.role === 'admin' ? "Dashboard" : "Dashboard", href: `/${user?.role}/dashboard` },
            { label: "Finance", href: `/${user?.role}/fee-defaulters` },
            { label: "Fee Defaulters", active: true }
          ]
        }}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-rose-500 to-rose-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold">{filteredDefaulters.length}</p>
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
              <p className="text-2xl font-bold text-slate-900">{withContactCount}</p>
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

      {isLoading ? (
        <SkeletonTable columns={5} rows={6} />
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
                  <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
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
                    <td className="px-6 py-4 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendReminder(defaulter)}
                        className="gap-1.5 border-amber-500 text-amber-600 hover:bg-amber-50"
                        disabled={!defaulter.parentEmail && !defaulter.parentPhone}
                      >
                        <Send className="w-3 h-3" />
                        {defaulter.parentEmail || defaulter.parentPhone ? 'Remind' : 'No Contact'}
                      </Button>
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

      <BaseModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        title="Send Fee Reminder"
        size="md"
      >
        {selectedDefaulter && (
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Student</p>
                  <p className="font-semibold text-slate-900">{selectedDefaulter.studentName}</p>
                </div>
                <div>
                  <p className="text-slate-500">Class</p>
                  <p className="font-semibold text-slate-900">{selectedDefaulter.className}</p>
                </div>
                <div>
                  <p className="text-slate-500">Parent</p>
                  <p className="font-semibold text-slate-900">{selectedDefaulter.parentName}</p>
                </div>
                <div>
                  <p className="text-slate-500">Contact</p>
                  <p className="font-semibold text-slate-900">
                    {selectedDefaulter.parentPhone || selectedDefaulter.parentEmail || 'N/A'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500">Amount Due</p>
                  <p className="font-bold text-rose-600 text-lg">
                    {formatCurrency(selectedDefaulter.totalDue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <p className="text-sm text-amber-800">
                A fee reminder notification will be sent to the parent&apos;s email address.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowReminderModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={sendReminder} 
                loading={sendingReminder || parentLookupLoading} 
                className="flex-1 bg-amber-600 hover:bg-amber-700"
                disabled={!selectedDefaulter?.parentEmail && !selectedDefaulter?.parentPhone}
              >
                {parentLookupLoading ? 'Finding Parent...' : 'Send Reminder'}
              </Button>
            </div>
          </div>
        )}
      </BaseModal>
    </div>
  );
};

export default FeeDefaulters;
