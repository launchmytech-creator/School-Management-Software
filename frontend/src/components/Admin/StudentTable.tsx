import React from 'react';
import { Eye, Edit2, Trash2, Search } from 'lucide-react';
import type { Student } from '../../types/student';
import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';

interface StudentTableProps {
  students: Student[];
  onView: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (id: number) => void;
}

const StudentTable: React.FC<StudentTableProps> = ({ students, onView, onEdit, onDelete }) => {
  if (students.length === 0) {
    return (
      <EmptyState 
        icon={Search}
        title="No students found"
        description="Try adjusting your filters or add a new student."
      />
    );
  }

  const getFeeStatusVariant = (status: string) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Pending': return 'danger';
      case 'Partial': return 'warning';
      default: return 'neutral';
    }
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-50">
              <th className="pl-10 pr-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Student Name</th>
              <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Class / Section</th>
              <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Parent Name</th>
              <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Fee Status</th>
              <th className="pl-6 pr-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="pl-10 pr-6 py-6">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 shadow-sm transition-transform group-hover:scale-110">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`} 
                        alt={student.fullName} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <span className="font-display font-black text-slate-900 tracking-tight block uppercase">{student.fullName}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">ID: STU-{student.id.toString().padStart(4, '0')}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6 text-center">
                  <div className="inline-flex flex-col">
                    <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{student.className}</span>
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Section {student.classSection}</span>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <span className="text-sm font-bold text-slate-500">{student.parentName}</span>
                </td>
                <td className="px-6 py-6 text-center">
                  <StatusBadge 
                    label={student.feeStatus || 'N/A'} 
                    variant={getFeeStatusVariant(student.feeStatus || '')} 
                  />
                </td>
                <td className="pl-6 pr-10 py-6">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                        onClick={() => onView(student)}
                        className="p-2.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                      >
                      <Eye className="size-5" />
                    </button>
                    <button onClick={() => onEdit(student)} className="p-2.5 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all">
                      <Edit2 className="size-4" />
                    </button>
                    <button onClick={() => onDelete(student.id)} className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentTable;
