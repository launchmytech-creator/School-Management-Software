import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, ArrowRight, Bell } from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  message: string;
  targetRole: string | null;
  priority: string;
  createdAt: string;
}

interface AnnouncementsCardProps {
  announcements: Announcement[];
}

const timeAgo = (dateString: string): string => {
  const ms = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const priorityConfig = (priority?: string) => {
  switch (priority) {
    case 'high':   return { dot: 'bg-rose-500',  label: 'Urgent',    labelCls: 'bg-rose-50 text-rose-600 border-rose-200' };
    case 'medium': return { dot: 'bg-amber-500', label: 'Important', labelCls: 'bg-amber-50 text-amber-600 border-amber-200' };
    default:       return { dot: 'bg-blue-500',  label: 'Info',      labelCls: 'bg-blue-50 text-blue-600 border-blue-200' };
  }
};

export const AnnouncementsCard: React.FC<AnnouncementsCardProps> = ({ announcements }) => {
  const navigate = useNavigate();
  const items = announcements.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* header */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
            <Megaphone size={14} className="text-amber-500" />
          </div>
          <span className="font-bold text-slate-800 text-sm">Announcements</span>
          {items.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">
              {items.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate('/parent/announcements')}
          className="flex items-center gap-1 text-[11px] font-semibold text-blue-500 hover:text-blue-600 transition-colors"
        >
          View All <ArrowRight size={11} />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
            <Bell size={20} className="text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-400">No announcements yet</p>
          <p className="text-xs text-slate-300 mt-1">Check back later for updates</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {items.map((a, i) => {
            const cfg = priorityConfig(a.priority);
            return (
              <button
                key={a.id ?? i}
                type="button"
                onClick={() => navigate(`/parent/announcements`)}
                className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  {/* left dot */}
                  <div className="mt-1.5 shrink-0">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${cfg.labelCls}`}>
                        {cfg.label}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(a.createdAt)}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 leading-snug truncate group-hover:text-blue-600 transition-colors">
                      {a.title}
                    </p>
                    {a.message && (
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {a.message}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
