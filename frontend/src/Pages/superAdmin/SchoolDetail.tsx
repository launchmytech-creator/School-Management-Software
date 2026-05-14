import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { useSchoolDetail, useSchoolAdmin, useAvailablePlansWithPricing, useSubscriptionHistory } from '../../hooks/queries/useSchools';
import SchoolOverviewTab from '../../components/superAdmin/SchoolDetail/SchoolOverviewTab';
import SubscriptionTab from '../../components/superAdmin/SchoolDetail/SubscriptionTab';
import PaymentHistoryTab from '../../components/superAdmin/SchoolDetail/PaymentHistoryTab';
import SchoolAdminTab from '../../components/superAdmin/SchoolDetail/SchoolAdminTab';
import type { SchoolAdmin } from '../../types/school';

type TabKey = 'overview' | 'subscription' | 'payments' | 'admin';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: 'info' },
  { key: 'subscription', label: 'Subscription', icon: 'card_membership' },
  { key: 'payments', label: 'Payment History', icon: 'receipt_long' },
  { key: 'admin', label: 'School Admin', icon: 'admin_panel_settings' },
];

const SchoolDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [schoolAdmin, setSchoolAdmin] = useState<SchoolAdmin | null>(null);

  const { data: school, isLoading: schoolLoading, refetch: refetchSchool } = useSchoolDetail(id || '');
  const { data: plans = [], isLoading: plansLoading } = useAvailablePlansWithPricing();
  const { data: payments = [], isLoading: paymentsLoading } = useSubscriptionHistory(id || '');
  const { data: admin, isLoading: adminLoading } = useSchoolAdmin(id || '');

  useEffect(() => {
    if (admin) {
      setSchoolAdmin(admin);
    }
  }, [admin]);

  if (!id) {
    navigate('/super-admin/schools');
    return null;
  }

  if (schoolLoading) {
    return (
      <MainLayout title="School Details">
        <div className="flex justify-center py-32">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!school) {
    return (
      <MainLayout title="School Not Found">
        <div className="text-center py-32">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">error_outline</span>
          <h2 className="text-2xl font-display font-bold text-slate-700 mb-2">School Not Found</h2>
          <p className="text-slate-400 mb-6">The school you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/super-admin/schools')}
            className="h-12 px-8 bg-[#4A9FD4] text-white font-bold rounded-xl hover:bg-[#4A9FD4]/90 transition-all cursor-pointer"
          >
            Back to Schools
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={school.name}>
      <div className="space-y-8 pb-24">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/super-admin/schools')}
              className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-slate-500">arrow_back</span>
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-[28px] font-display font-extrabold text-[#1E3A5F]">{school.name}</h2>
                <span className={`text-[10px] font-black px-3 py-1 rounded-lg tracking-widest uppercase border ${
                  school.plan === 'BUSINESS'
                    ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                    : school.plan === 'PREMIUM'
                      ? 'bg-[#4A9FD4] text-white border-[#4A9FD4]'
                      : 'bg-slate-400 text-white border-slate-400'
                }`}>
                  {school.plan}
                </span>
              </div>
              <p className="text-slate-400 text-sm font-medium">
                School ID: #{String(school.id).slice(-4).toUpperCase()} &middot; {school.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/super-admin/create-school', { state: { school } })}
            className="h-12 px-6 rounded-xl border border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
            Edit School
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="border-b border-slate-100">
            <div className="flex overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all whitespace-nowrap border-b-2 cursor-pointer ${
                    activeTab === tab.key
                      ? 'border-[#4A9FD4] text-[#4A9FD4]'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'overview' && <SchoolOverviewTab school={school} />}

            {activeTab === 'subscription' && !plansLoading && (
              <SubscriptionTab
                school={school}
                plans={plans}
                onSchoolUpdated={() => {
                  refetchSchool();
                }}
              />
            )}
            {activeTab === 'subscription' && plansLoading && (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            )}

            {activeTab === 'payments' && (
              <PaymentHistoryTab payments={payments} isLoading={paymentsLoading} />
            )}

            {activeTab === 'admin' && (
              <SchoolAdminTab admin={schoolAdmin} isLoading={adminLoading} />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SchoolDetail;
