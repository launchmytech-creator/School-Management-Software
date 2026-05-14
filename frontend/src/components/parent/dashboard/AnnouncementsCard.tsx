import React from 'react';
import { useNavigate } from 'react-router-dom';

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

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const getPriorityTag = (priority?: string): { label: string; color: string; bg: string } => {
  switch (priority) {
    case 'high':
      return { label: 'Urgent', color: 'text-rose-600', bg: 'bg-rose-100' };
    case 'medium':
      return { label: 'Important', color: 'text-amber-600', bg: 'bg-amber-100' };
    default:
      return { label: 'Update', color: 'text-blue-600', bg: 'bg-blue-100' };
  }
};

export const AnnouncementsCard: React.FC<AnnouncementsCardProps> = ({ announcements }) => {
  const navigate = useNavigate();
  const latestAnnouncements = announcements.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-lg text-amber-500"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                campaign
              </span>
            </div>
            <h3 className="font-bold text-slate-800">Latest Updates</h3>
          </div>
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
      </div>

      {latestAnnouncements.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-slate-300">
              campaign
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500">No announcements yet</p>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {latestAnnouncements.map((announcement, index) => {
            const tag = getPriorityTag(announcement.priority);
            return (
              <div
                key={announcement.id || index}
                className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => navigate(`/parent/announcements/${announcement.id}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${tag.bg} ${tag.color}`}>
                    {tag.label}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatTimeAgo(announcement.createdAt)}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">
                  {announcement.title}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {announcement.message}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};