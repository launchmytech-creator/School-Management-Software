import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import StatCard from '../../components/dashboard/StatCard';
import { schoolService } from '../../services/schoolService';
import { SubscriptionPieChart } from '../../components/dashboard/DashboardCharts';
import type { SchoolStats, RecentSchoolActivity, School } from '../../types/school';
import SchoolDetailDrawer from '../../components/superAdmin/SchoolDetailDrawer';
import { useNotification } from '../../context/NotificationContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [recentSchools, setRecentSchools] = useState<RecentSchoolActivity[]>([]);
  const [registeredSchools, setRegisteredSchools] = useState<School[]>([]);
  const [search, setSearch] = useState('');

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewingSchool, setViewingSchool] = useState<School | null>(null);

  const handleOpenDrawer = (school: School) => {
    setViewingSchool(school);
    setIsDrawerOpen(true);
  };

  const handleEdit = (school: School) => {
    navigate('/super-admin/create-school', { state: { school } });
  };

  const filteredSchools = React.useMemo(() => {
    return registeredSchools.filter(school => {
      const searchLower = search.toLowerCase();
      return !search || 
        school.name.toLowerCase().includes(searchLower) ||
        school.id.toString().toLowerCase().includes(searchLower) ||
        (school.plan && school.plan.toLowerCase().includes(searchLower));
    });
  }, [registeredSchools, search]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, activityData, schoolsData] = await Promise.all([
          schoolService.getStats(),
          schoolService.getRecentActivity(),
          schoolService.getSchools({ limit: 4 })
        ]);
        
        setStats(statsData);
        setRecentSchools(activityData);
        setRegisteredSchools(Array.isArray(schoolsData) ? schoolsData : []);
      } catch {
        showNotification('Failed to load dashboard statistics.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [showNotification]);

  const statItems = [
    { label: 'Total Schools', value: stats?.totalSchools || 0, icon: 'apartment', color: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Active Subs', value: stats?.activeSchools || 0, icon: 'verified', color: 'bg-emerald-50', iconColor: 'text-emerald-500' },
    { label: 'Basic Plans', value: stats?.basicPlans || 0, icon: 'credit_card', color: 'bg-orange-50', iconColor: 'text-orange-500' },
    { label: 'Premium/Business', value: (stats?.premiumPlans || 0) + (stats?.businessPlans || 0), icon: 'workspace_premium', color: 'bg-purple-50', iconColor: 'text-purple-500' },
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statItems.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Inner Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Subscription Distribution */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
            <h3 className="text-lg font-display font-bold text-slate-800 mb-6">Subscription Distribution</h3>
            <div className="flex-1">
              <SubscriptionPieChart 
                basic={stats?.basicPlans || 0}
                premium={stats?.premiumPlans || 0}
                business={stats?.businessPlans || 0}
              />
            </div>
          </div>

          {/* Recently Added Schools */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-lg font-display font-bold text-slate-800">Recently Added Schools</h3>
              <button className="text-accent text-xs font-bold hover:underline cursor-pointer">View All</button>
            </div>
            <div className="space-y-8">
              {recentSchools.length > 0 ? recentSchools.map((school) => (
                <div key={school.id} className="flex items-center justify-between group p-3 rounded-xl hover:bg-slate-50/80 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-display font-black text-white shadow-sm transition-transform group-hover:scale-110 ${
                      school.plan === 'BUSINESS' ? 'bg-[#1E3A5F]' :
                      school.plan === 'PREMIUM' ? 'bg-[#4A9FD4]' :
                      'bg-slate-400'
                    }`}>
                      {school.initials}
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

        {/* Master Table Section */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-10 pt-12">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 mb-12">
            <div>
              <h3 className="text-xl font-display font-bold text-slate-800 tracking-tight">All Registered Schools</h3>
            </div>
            
            <div className="flex gap-4 w-full lg:w-auto">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="Search schools..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="px-6 h-11 w-full lg:w-72 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent text-sm text-slate-700 placeholder:text-slate-300 transition-all font-medium bg-[#FBFBFC] cursor-text"
                />
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

          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="pb-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">School Name</th>
                <th className="pb-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Subscription Plan</th>
                <th className="pb-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Fee Terms</th>
                <th className="pb-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="pb-6 px-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSchools?.length > 0 ? filteredSchools.map((school) => (
                <tr key={school.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-7 px-4">
                    <span className="text-sm font-bold text-slate-800 tracking-tight">{school.name}</span>
                  </td>
                  <td className="py-7 px-4 text-center">
                    <span className={`text-[9px] font-black px-4 py-1.5 rounded-lg tracking-widest uppercase inline-block ${
                      school.plan === 'BUSINESS' ? 'bg-[#F3E8FF] text-[#A855F7]' :
                      school.plan === 'PREMIUM' ? 'bg-[#DBEAFE] text-[#3B82F6]' :
                      'bg-[#E0F2FE] text-[#60A5FA]'
                    }`}>
                      {school.plan}
                    </span>
                  </td>
                  <td className="py-7 px-4 text-center text-xs font-bold text-slate-400 tracking-tight">{school.feeTerm} / {school.academicYear}</td>
                  <td className="py-7 px-4">
                    <div className="flex justify-center">
                      <div className={`w-12 h-6 rounded-full relative cursor-pointer flex items-center shadow-inner transition-colors duration-300 ${school.status ? 'bg-emerald-400' : 'bg-red-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow absolute transition-all duration-300 transform ${school.status ? 'translate-x-7' : 'translate-x-1'}`}></div>
                      </div>
                    </div>
                  </td>
                   <td className="py-7 px-4">
                     <div className="flex justify-end gap-3 text-slate-300">
                        <button 
                          onClick={() => handleOpenDrawer(school)}
                          className="hover:text-primary transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        <button 
                          onClick={() => handleEdit(school)}
                          className="hover:text-slate-500 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                     </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-300 text-xs font-bold uppercase tracking-widest italic">
                    No registered schools found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Section placeholder */}
          <div className="mt-10 pt-10 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Showing {filteredSchools?.length || 0} matching schools</p>
          </div>
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
