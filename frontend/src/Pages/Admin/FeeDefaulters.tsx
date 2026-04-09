import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import { useNotification } from '../../context/NotificationContext';
import { useFeeDefaultersPage } from '../../hooks/useFeeDefaultersPage';
import { parentService } from '../../services/parentService';
import { notificationService } from '../../services/notificationService';
import { AlertTriangle, Phone, User, AlertCircle, Send } from 'lucide-react';
import { formatCurrency, getLocalDateString } from '../../lib/utils';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { BaseModal } from '../../components/common/BaseModal';
import { Button } from '../../components/ui/button';
import type { FeeDefaulter } from '../../services/feeService';

const FeeDefaulters: React.FC = () => {
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
        parentId: parentId,
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
    <>
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
        </FilterBar>

        {isLoading ? (
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

                <Button
                  onClick={() => handleSendReminder(defaulter)}
                  className="mt-4 w-full gap-2 bg-amber-600 hover:bg-amber-700"
                  disabled={!defaulter.parentEmail && !defaulter.parentPhone}
                >
                  <Send className="w-4 h-4" />
                  {defaulter.parentEmail || defaulter.parentPhone ? 'Send Reminder' : 'No Contact'}
                </Button>
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
                A fee reminder notification will be sent to the parent's email address.
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
    </>
  );
};

export default FeeDefaulters;
