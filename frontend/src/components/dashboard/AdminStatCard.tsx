import React from 'react';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';

interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  color: string;
}

const AdminStatCard: React.FC<AdminStatCardProps> = ({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  trendType = 'neutral',
  color 
}) => {
  const trendColor = trendType === 'positive' ? 'text-emerald-500 bg-emerald-50/50' : trendType === 'negative' ? 'text-rose-500 bg-rose-50/50' : 'text-slate-400 bg-slate-50';
  const TrendIcon = trendType === 'positive' ? TrendingUp : trendType === 'negative' ? TrendingDown : Info;

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-500 group">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{label}</p>
          <p className="text-3xl font-display font-black text-slate-900 tracking-tight leading-none">{value}</p>
        </div>
        <div className={`p-3.5 rounded-2xl ${color} bg-opacity-10 text-opacity-100 transition-transform group-hover:scale-110 duration-500`}>
          <Icon className="size-6" />
        </div>
      </div>
      
      {trend && (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${trendColor} w-fit transition-colors`}>
          <TrendIcon className="size-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest">{trend}</span>
        </div>
      )}
    </div>
  );
};

export default AdminStatCard;
