import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: LucideIcon;
  color: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
      <h3 className="text-lg font-display font-bold text-slate-800 tracking-tight mb-8">Recent Activity</h3>
      
      <div className="relative space-y-8">
        {/* Timeline Path */}
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100"></div>

        {activities.map((activity) => (
          <div key={activity.id} className="relative flex items-start gap-5 pl-1">
            <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${activity.color} bg-opacity-10 text-opacity-100`}>
              <activity.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 truncate tracking-tight">{activity.title}</h4>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">{activity.description}</p>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;
