import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Announcement {
  id: number;
  title: string;
  message: string;
  targetRole: string | null;
  createdAt: string;
}

interface AnnouncementsListProps {
  announcements: Announcement[];
}

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const AnnouncementsList: React.FC<AnnouncementsListProps> = ({ announcements }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">Announcements</h3>
        <button
          onClick={() => navigate('/parent/announcements')}
          className="text-xs font-semibold text-[#4A9FD4] hover:underline flex items-center gap-1"
        >
          View All
          <span className="material-symbols-outlined text-[14px]">
            arrow_forward
          </span>
        </button>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-6">
          <span className="material-symbols-outlined text-4xl text-slate-200 block mb-2">
            campaign
          </span>
          <p className="text-sm text-slate-400">No announcements</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.slice(0, 4).map((ann) => (
            <div
              key={ann.id}
              className="border-l-4 border-amber-400 pl-4 py-1"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {ann.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                    {ann.message}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap flex-shrink-0">
                  {timeAgo(ann.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};