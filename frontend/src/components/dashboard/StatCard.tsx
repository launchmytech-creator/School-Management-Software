import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string; // This will pass bg-blue-50/10 etc for icon box
  iconColor: string; // This will pass text-blue-500 etc for icon
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, iconColor }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-lg transition-all duration-300">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${color}`}>
        <span className={`material-symbols-outlined ${iconColor} text-2xl`}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-display font-black text-slate-800 leading-none">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
