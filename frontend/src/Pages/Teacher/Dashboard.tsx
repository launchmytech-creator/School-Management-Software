import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';

const TeacherDashboard: React.FC = () => {
  return (
    <AdminLayout title="Teacher Hub">
       <div className="bg-white p-10 rounded-[40px] border border-slate-200/50 shadow-premium">
         <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight">Academic Management</h2>
         <p className="text-slate-400 text-sm mt-2 font-bold uppercase tracking-widest leading-relaxed">
           Control your classrooms, exams, and student performance.
         </p>
       </div>
    </AdminLayout>
  );
};

export default TeacherDashboard;
