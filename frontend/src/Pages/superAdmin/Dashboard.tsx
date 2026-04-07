import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import AdminStatCard from '../../components/dashboard/AdminStatCard';
import { SubscriptionPieChart } from '../../components/dashboard/DashboardCharts';
import type { School } from '../../types/school';
import SchoolDetailDrawer from '../../components/superAdmin/SchoolDetailDrawer';
import { useSchoolStats, useRecentSchools } from '../../hooks/queries/useSchools';
import { Building2, BadgeCheck, CreditCard, Crown, Gem } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: schools = [], stats, isLoading: loading } = useSchoolStats();
  const { data: recentSchools = [] } = useRecentSchools(5);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewingSchool, setViewingSchool] = useState<School | null>(null);

  const handleOpenDrawer = (school: School) => {
    setViewingSchool(school);
    setIsDrawerOpen(true);
  };

  const handleEdit = (school: School) => {
    navigate('/super-admin/create-school', { state: { school } });
  };

  const statItems = [
    { label: 'Total Schools', value: stats.total, icon: Building2, variant: 'blue' as const, onClick: () => navigate('/super-admin/schools') },
    { label: 'Active Subs', value: stats.active, icon: BadgeCheck, variant: 'emerald' as const, onClick: () => navigate('/super-admin/schools?status=true') },
    { label: 'Basic Plans', value: stats.basicPlans, icon: CreditCard, variant: 'amber' as const, onClick: () => navigate('/super-admin/schools?plan=BASIC') },
    { label: 'Premium Plans', value: stats.premiumPlans, icon: Crown, variant: 'rose' as const, onClick: () => navigate('/super-admin/schools?plan=PREMIUM') },
    { label: 'Business Plans', value: stats.businessPlans, icon: Gem, variant: 'default' as const, onClick: () => navigate('/super-admin/schools?plan=BUSINESS') },
  ];

  if (loading) {
    return (
      <AdminLayout title="Super Admin Panel">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Platform Data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Super Admin Panel">
      <div className="space-y-10 pb-10">
        {/* Header Section */}
        <div>
          <h2 className="text-[28px] font-display font-extrabold text-[#1E3A5F] mb-1">Platform Overview</h2>
          <p className="text-slate-400 text-sm font-medium tracking-tight">Real-time statistics across all managed school instances.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {statItems.map((stat) => (
            <AdminStatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Inner Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Subscription Distribution */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
            <h3 className="text-lg font-display font-bold text-slate-800 mb-6">Subscription Distribution</h3>
            <div className="flex-1">
              <SubscriptionPieChart 
                basic={stats.basicPlans}
                premium={stats.premiumPlans}
                business={stats.businessPlans}
              />
            </div>
          </div>

          {/* Recently Added Schools */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-lg font-display font-bold text-slate-800">Recently Added Schools</h3>
              <button 
                onClick={() => navigate('/super-admin/schools')}
                className="text-accent text-xs font-bold hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>
            <div className="space-y-8">
              {recentSchools.length > 0 ? recentSchools.map((school) => (
                <div 
                  key={school.id} 
                  className="flex items-center justify-between group p-3 rounded-xl hover:bg-slate-50/80 transition-all duration-300 cursor-pointer"
                  onClick={() => handleOpenDrawer(school)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-display font-black text-white shadow-sm transition-transform group-hover:scale-110 ${
                      school.plan === 'BUSINESS' ? 'bg-[#1E3A5F]' :
                      school.plan === 'PREMIUM' ? 'bg-[#4A9FD4]' :
                      'bg-slate-400'
                    }`}>
                      {school.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{school.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                        {new Date(school.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[9px] font-black px-3 py-1 rounded-lg tracking-widest uppercase border ${
                      school.plan === 'BUSINESS' ? 'bg-[#F3E8FF] text-[#A855F7] border-[#A855F7]/20' :
                      school.plan === 'PREMIUM' ? 'bg-[#DBEAFE] text-[#3B82F6] border-[#3B82F6]/20' :
                      'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                      {school.plan}
                    </span>
                    <span className="text-[10px] text-slate-300 font-bold italic opacity-0 group-hover:opacity-100 transition-opacity">View Details</span>
                  </div>
                </div>
              )) : (
                <div className="flex-1 flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest italic">
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </div>

        {/* All Registered Schools */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-8 pb-0">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
              <div>
                <h3 className="text-xl font-display font-bold text-slate-800 tracking-tight">All Registered Schools</h3>
                <p className="text-slate-400 text-sm mt-1">{stats.total} schools registered</p>
              </div>
              
              <button 
                onClick={() => navigate('/super-admin/create-school')}
                className="h-11 px-6 bg-[#1E3A5F] text-white font-bold rounded-xl flex items-center gap-2 hover:bg-[#1E3A5F]/90 transition-all shadow-md shadow-slate-200 text-sm whitespace-nowrap cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Add School
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto mt-6">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-y border-slate-100">
                  <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">School</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Plan</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Fee Terms</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Academic Year</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {schools.slice(0, 5).map((school) => (
                  <tr 
                    key={school.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => handleOpenDrawer(school)}
                  >
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-display font-black text-white shadow-sm ${school.plan === 'BUSINESS' ? 'bg-[#1E3A5F]' : school.plan === 'PREMIUM' ? 'bg-[#4A9FD4]' : 'bg-slate-400'}`}>
                          {school.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">{school.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{school.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-4 text-center">
                      <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg tracking-widest leading-none border ${
                        school.plan === 'BUSINESS' ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' :
                        school.plan === 'PREMIUM' ? 'bg-[#4A9FD4] text-white border-[#4A9FD4]' :
                        'bg-slate-400 text-white border-slate-400'
                      }`}>
                        {school.plan}
                      </span>
                    </td>
                    <td className="py-5 px-4 text-center">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-md">{school.feeTerm}</span>
                    </td>
                    <td className="py-5 px-4 text-center text-xs font-bold text-slate-500">{school.academicYear}</td>
                    <td className="py-5 px-4">
                      <div className="flex justify-center">
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full ${
                          school.status 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-red-50 text-red-400'
                        }`}>
                          {school.status ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-8 text-[11px] font-bold text-slate-400">
                      {new Date(school.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {schools.length > 5 && (
            <div className="p-6 border-t border-slate-100 text-center">
              <button 
                onClick={() => navigate('/super-admin/schools')}
                className="text-primary text-xs font-bold hover:underline cursor-pointer"
              >
                View All {stats.total} Schools →
              </button>
            </div>
          )}
        </div>
      </div>

      <SchoolDetailDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onEdit={(school) => {
          setIsDrawerOpen(false);
          handleEdit(school);
        }}
        school={viewingSchool} 
      />
    </AdminLayout>
  );
};

export default Dashboard;
