import React, { useState } from "react";
import { Search, Calendar, User } from "lucide-react";
import { formatDate } from "../../lib/utils";
import { useAnnouncements } from "../../hooks/queries";
import { default as PageHeader } from "../../components/common/PageHeader";

/** Parent Announcements Page
 * 
 * Displays school-wide announcements.
 * Filterable by search term.
 * Shows target role badges (teacher/parent/admin).
 */
const ParentAnnouncements: React.FC = () => {
  const { data: announcements = [], isLoading } = useAnnouncements();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAnnouncements = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.message.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getTargetRoleLabel = (role: string | null) => {
    switch (role) {
      case "teacher":
        return "Teachers";
      case "accountant":
        return "Accountant";
      case "parent":
        return "Parents";
      case "school_admin":
        return "Admin";
      default:
        return "All";
    }
  };

  const getTargetRoleColor = (role: string | null) => {
    switch (role) {
      case "teacher":
        return "bg-blue-100 text-blue-700";
      case "accountant":
        return "bg-emerald-100 text-emerald-700";
      case "parent":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between gap-4">
        <PageHeader
          title="Announcements"
          subtitle="Stay updated with school notifications"
          breadcrumb={{
            links: [
              { label: 'Dashboard', href: '/parent/dashboard' },
              { label: 'Announcements', active: true },
            ],
          }}
        />

        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-8 py-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-yellow-600" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
            </div>
            <div>
              <p className="text-3xl font-black text-yellow-700">{announcements.length}</p>
              <p className="text-xs font-medium text-yellow-600">Total Announcements</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search announcements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A9FD4]/30 focus:border-[#4A9FD4] transition-all"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-100 p-6 animate-pulse">
              <div className="h-6 bg-slate-200 rounded-xl w-1/3 mb-4"></div>
              <div className="h-4 bg-slate-100 rounded-lg w-full mb-2"></div>
              <div className="h-4 bg-slate-100 rounded-lg w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredAnnouncements.length > 0 ? (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white rounded-3xl border border-slate-100 p-6 hover:shadow-md hover:border-[#4A9FD4]/20 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#4A9FD4]/10 rounded-2xl flex items-center justify-center text-[#4A9FD4] flex-shrink-0">
<span className="material-symbols-outlined text-yellow-600" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        {announcement.title}
                      </h3>
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${getTargetRoleColor(announcement.targetRole)}`}
                      >
                        {getTargetRoleLabel(announcement.targetRole)}
                      </span>
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                      {announcement.message}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        <span>{announcement.createdByName || "Admin"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(announcement.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-slate-400" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            {searchTerm ? "No announcements found" : "No announcements yet"}
          </h3>
          <p className="text-slate-500 text-sm">
            {searchTerm
              ? "Try adjusting your search terms"
              : "You will see announcements here when they are posted"}
          </p>
        </div>
      )}
    </div>
  );
};

export default ParentAnnouncements;