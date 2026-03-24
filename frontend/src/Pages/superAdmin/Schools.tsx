import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import StatCard from '../../components/dashboard/StatCard';
import { schoolService } from '../../services/schoolService';
import type { School, SchoolStats } from '../../types/school';
import SchoolDetailDrawer from '../../components/superAdmin/SchoolDetailDrawer';
import { useNotification } from '../../context/NotificationContext';

const Schools: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [allSchools, setAllSchools] = useState<School[]>([]);
  const [stats, setStats] = useState<SchoolStats | null>(null);
  
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

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

  const fetchSchools = useCallback(async () => {
    try {
      setLoading(true);
      const data = await schoolService.getSchools();
      setAllSchools(Array.isArray(data) ? data : []);
    } catch {
      showNotification('Failed to fetch schools', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredSchools = React.useMemo(() => {
    return allSchools.filter(school => {
      const matchesSearch = !search || 
        school.name.toLowerCase().includes(search.toLowerCase()) ||
        school.id.toString().toLowerCase().includes(search.toLowerCase()) ||
        (school.email && school.email.toLowerCase().includes(search.toLowerCase()));
      
      const matchesPlan = !plan || school.plan === plan;
      
      const matchesStatus = status === '' || 
        (status === 'true' && school.status === true) || 
        (status === 'false' && school.status === false);

      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [allSchools, search, plan, status]);

  const paginatedSchools = React.useMemo(() => {
    const start = (page - 1) * limit;
    return filteredSchools.slice(start, start + limit);
  }, [filteredSchools, page]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  useEffect(() => {
    schoolService.getStats()
      .then(setStats)
      .catch(() => showNotification('Failed to fetch school statistics', 'error'));
  }, [showNotification]);

  const statItems = [
    { label: 'Total Schools', value: stats?.totalSchools || 0, icon: 'apartment', color: 'bg-slate-50', iconColor: 'text-slate-600' },
    { label: 'Active', value: stats?.activeSchools || 0, icon: 'check_circle', color: 'bg-emerald-50', iconColor: 'text-emerald-500' },
    { label: 'Inactive', value: stats?.inactiveSchools || 0, icon: 'cancel', color: 'bg-red-50', iconColor: 'text-red-400' },
  ];

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSchools(paginatedSchools.map(s => s.id));
    } else {
      setSelectedSchools([]);
    }
  };

  const handleSelectSchool = (id: string) => {
    setSelectedSchools(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await schoolService.toggleSchoolStatus(id, !currentStatus);
      showNotification('School status updated successfully.', 'success');
      fetchSchools();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update status';
      showNotification(message, 'error');
    }
  };

  const handleBulkDeactivate = async () => {
    if (confirm(`Are you sure you want to deactivate ${selectedSchools.length} schools?`)) {
      try {
        await schoolService.bulkDeactivate(selectedSchools);
        showNotification(`${selectedSchools.length} schools deactivated successfully.`, 'success');
        setSelectedSchools([]);
        fetchSchools();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Bulk deactivation failed';
        showNotification(message, 'error');
      }
    }
  };

  return (
    <AdminLayout title="All Schools">
      <div className="space-y-12 pb-24">
        {/* Header with Search & Stats */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <h2 className="text-[28px] font-display font-extrabold text-[#1E3A5F] mb-1">All Schools</h2>
            <p className="text-slate-400 text-sm font-medium tracking-tight">{allSchools.length} schools registered across all regions</p>
          </div>
          <button 
            onClick={() => navigate('/super-admin/create-school')}
            className="h-12 px-8 bg-[#4A9FD4] text-white font-bold rounded-xl flex items-center gap-3 hover:bg-[#4A9FD4]/90 transition-all shadow-lg shadow-[#4A9FD4]/20 text-sm whitespace-nowrap cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Create New School
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statItems.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col xl:flex-row items-center gap-6">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              type="text" 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search schools by name, ID or principal..." 
              className="w-full pl-12 pr-6 h-12 bg-[#F8FAFC] border border-slate-100 rounded-lg outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary text-sm text-slate-700 placeholder:text-slate-400 font-medium transition-all cursor-text"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
             <select 
               value={plan}
               onChange={(e) => { setPlan(e.target.value); setPage(1); }}
               className="h-12 px-5 bg-white border border-slate-200 rounded-lg outline-none focus:border-primary text-sm text-slate-600 font-bold min-w-[140px] appearance-none cursor-pointer"
             >
               <option value="">Plan: All</option>
               <option value="BASIC">Basic</option>
               <option value="PREMIUM">Premium</option>
               <option value="BUSINESS">Business</option>
             </select>
             <select 
               value={status}
               onChange={(e) => { setStatus(e.target.value); setPage(1); }}
               className="h-12 px-5 bg-white border border-slate-200 rounded-lg outline-none focus:border-primary text-sm text-slate-600 font-bold min-w-[140px] appearance-none cursor-pointer"
             >
               <option value="">Status: All</option>
               <option value="true">Active</option>
               <option value="false">Inactive</option>
             </select>
             <button 
               onClick={() => { setSearch(''); setPlan(''); setStatus(''); setPage(1); }}
               className="text-primary text-[11px] font-black uppercase tracking-widest hover:underline px-4 cursor-pointer"
             >
               Reset Filters
             </button>
             <button className="h-12 px-6 border border-slate-200 rounded-lg flex items-center gap-2 hover:bg-slate-50 transition-all font-bold text-slate-600 text-sm cursor-pointer">
                <span className="material-symbols-outlined text-lg">download</span>
                Export CSV
             </button>
          </div>
        </div>

        {/* Schools Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px] relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-100">
                  <th className="py-5 px-6 w-12">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={paginatedSchools.length > 0 && selectedSchools.length === paginatedSchools.length}
                      className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-primary" 
                    />
                  </th>
                  <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">School ID</th>
                  <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">School Name</th>
                  <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Plan</th>
                  <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Fee Terms</th>
                  <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Academic Year</th>
                  <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Created</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedSchools.length > 0 ? paginatedSchools.map((school) => (
                  <tr key={school.id} className={`hover:bg-slate-50 transition-colors ${selectedSchools.includes(school.id) ? 'bg-blue-50/30' : ''}`}>
                    <td className="py-6 px-6">
                      <input 
                        type="checkbox" 
                        checked={selectedSchools.includes(school.id)}
                        onChange={() => handleSelectSchool(school.id)}
                        className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-primary" 
                      />
                    </td>
                    <td className="py-6 px-4 text-xs font-bold text-slate-400">#{String(school.id).slice(-4).toUpperCase()}</td>
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-display font-black text-white bg-primary shadow-sm overflow-hidden`}>
                          {school.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{school.name}</span>
                      </div>
                    </td>
                    <td className="py-6 px-4 text-center">
                      <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg tracking-widest leading-none border ${
                        school.plan === 'BUSINESS' ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' :
                        school.plan === 'PREMIUM' ? 'bg-[#4A9FD4] text-white border-[#4A9FD4]' :
                        'bg-slate-400 text-white border-slate-400'
                      }`}>
                        {school.plan}
                      </span>
                    </td>
                    <td className="py-6 px-4 text-center">
                       <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-md">{school.feeTerm}</span>
                    </td>
                    <td className="py-6 px-4 text-center text-xs font-bold text-slate-500">{school.academicYear}</td>
                    <td className="py-6 px-4">
                      <div className="flex justify-center">
                         <div 
                           onClick={() => handleToggleStatus(school.id, school.status)}
                           className={`w-10 h-5 rounded-full relative cursor-pointer flex items-center shadow-inner transition-colors duration-300 ${school.status ? 'bg-emerald-400' : 'bg-red-300'}`}
                         >
                           <div className={`w-3 h-3 bg-white rounded-full shadow absolute transition-all duration-300 transform ${school.status ? 'translate-x-6' : 'translate-x-1'}`}></div>
                         </div>
                      </div>
                    </td>
                    <td className="py-6 px-4 text-[11px] font-bold text-slate-400">{new Date(school.createdAt).toLocaleDateString()}</td>
                    <td className="py-6 px-6 text-right">
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
                )) : !loading && (
                  <tr>
                    <td colSpan={9} className="py-20 text-center text-slate-300 text-xs font-bold uppercase tracking-widest italic">
                      No matching schools found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-10 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Showing {paginatedSchools.length} of {filteredSchools.length} schools</p>
            <div className="flex items-center gap-2">
               <button 
                 disabled={page === 1}
                 onClick={() => setPage(page - 1)}
                 className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-100 text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
               >
                 <span className="material-symbols-outlined text-sm">chevron_left</span>
               </button>
               <span className="px-4 text-xs font-bold text-slate-400">Page {page} of {Math.ceil(filteredSchools.length / limit) || 1}</span>
               <button 
                 disabled={page * limit >= filteredSchools.length}
                 onClick={() => setPage(page + 1)}
                 className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-100 text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
               >
                 <span className="material-symbols-outlined text-sm">chevron_right</span>
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedSchools.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#1E3A5F] px-8 py-4 rounded-full shadow-[0_20px_50px_rgba(30,58,95,0.3)] flex items-center gap-10 animate-fade-in-up z-50 border border-white/10">
          <div className="flex items-center gap-4 text-white">
            <span className="text-xl font-black text-[#4A9FD4]">{selectedSchools.length}</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">Schools Selected</span>
          </div>
          
          <div className="h-6 w-px bg-white/10"></div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={handleBulkDeactivate}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest group cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg text-red-400 group-hover:scale-110 transition-transform">block</span>
              Deactivate Selected
            </button>
            <button className="flex items-center gap-2 text-white/80 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest group cursor-pointer">
              <span className="material-symbols-outlined text-lg text-[#4A9FD4] group-hover:scale-110 transition-transform">upload</span>
              Export Selected
            </button>
          </div>
          
          <button 
            onClick={() => setSelectedSchools([])}
            className="ml-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg text-white/40">close</span>
          </button>
        </div>
      )}

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

export default Schools;