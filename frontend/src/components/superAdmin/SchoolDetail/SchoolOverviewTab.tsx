import React from 'react';
import type { School } from '../../../types/school';
import { PLAN_FEATURE_COMPARISON } from '../../../lib/permissions';
import SubscriptionStatusBadge from './SubscriptionStatusBadge';

interface SchoolOverviewTabProps {
  school: School;
}

const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  fee_management: 'Fee Management',
  marks_management: 'Marks Management',
  attendance: 'Attendance Tracking',
  syllabus_tracking: 'Syllabus Tracking',
  teacher_allocation: 'Teacher Allocation',
  analytics: 'Academic Analytics',
};

const SchoolOverviewTab: React.FC<SchoolOverviewTabProps> = ({ school }) => {
  const planFeatures = PLAN_FEATURE_COMPARISON[school.plan] || {};
  const isSubscriptionExpiringSoon = school.subscriptionEndDate
    ? (() => {
        const end = new Date(school.subscriptionEndDate);
        const now = new Date();
        const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 30 && daysLeft > 0;
      })()
    : false;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">School ID</p>
            <p className="text-sm font-bold text-slate-700">#{String(school.id).slice(-4).toUpperCase()}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">School Code</p>
            <p className="text-sm font-bold text-slate-700">{school.code}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
            <p className="text-sm font-bold text-slate-700">{school.email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone</p>
            <p className="text-sm font-bold text-slate-700">{school.phone || 'N/A'}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Address</p>
            <p className="text-sm font-bold text-slate-700">{school.address || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Created At</p>
            <p className="text-sm font-bold text-slate-700">{new Date(school.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      <div>
        <h4 className="text-sm font-black text-[#1E3A5F] uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#4A9FD4] text-lg">card_membership</span>
          Subscription Details
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Plan</p>
            <p className={`text-lg font-black ${
              school.plan === 'BUSINESS' ? 'text-[#1E3A5F]' : school.plan === 'PREMIUM' ? 'text-[#4A9FD4]' : 'text-slate-500'
            }`}>
              {school.plan}
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
            <SubscriptionStatusBadge status={school.subscriptionStatus} size="md" />
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fee Term</p>
            <p className="text-lg font-black text-slate-700">{school.feeTerm}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">End Date</p>
            <p className={`text-sm font-bold ${isSubscriptionExpiringSoon ? 'text-red-600' : 'text-slate-700'}`}>
              {school.subscriptionEndDate
                ? new Date(school.subscriptionEndDate).toLocaleDateString()
                : 'N/A'}
            </p>
            {isSubscriptionExpiringSoon && (
              <p className="text-[10px] font-bold text-red-500 mt-1">Expiring soon!</p>
            )}
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      <div>
        <h4 className="text-sm font-black text-[#1E3A5F] uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#4A9FD4] text-lg">groups</span>
          Statistics
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Students</p>
            <p className="text-3xl font-black text-emerald-700">{school.studentCount || 0}</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Teachers</p>
            <p className="text-3xl font-black text-blue-700">{school.teacherCount || 0}</p>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
            <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Credit Balance</p>
            <p className="text-3xl font-black text-purple-700">₹{(school.creditBalance || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      <div>
        <h4 className="text-sm font-black text-[#1E3A5F] uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#4A9FD4] text-lg">verified</span>
          Plan Features
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(planFeatures).map(([feature, enabled]) => (
            <div key={feature} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                enabled ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'
              }`}>
                <span className={`material-symbols-outlined text-sm ${enabled ? 'text-emerald-500' : 'text-slate-300'}`}>
                  {enabled ? 'check' : 'close'}
                </span>
              </div>
              <span className={`text-sm font-medium ${enabled ? 'text-slate-600' : 'text-slate-400'}`}>
                {FEATURE_DISPLAY_NAMES[feature] || feature}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SchoolOverviewTab;
