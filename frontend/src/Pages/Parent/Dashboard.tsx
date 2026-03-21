import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';

const ParentDashboard: React.FC = () => {
  return (
    <AdminLayout title="Parent Portal">
       <div className="bg-white p-10 rounded-[40px] border border-slate-200/50 shadow-premium">
         <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight">Student Progress</h2>
         <p className="text-slate-400 text-sm mt-2 font-bold uppercase tracking-widest leading-relaxed">
           Monitor your child's attendance, grades, and school announcements.
         </p>
       </div>
    </AdminLayout>
  );
};

export default ParentDashboard;
