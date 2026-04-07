import React, { useState, useEffect, useCallback } from "react";
import {
  announcementService,
  type Announcement,
} from "../../services/announcementService";
import { Megaphone, Search, Calendar, User } from "lucide-react";
import { formatDate } from "../../lib/utils";

const TeacherAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const data = await announcementService.getAnnouncements();
      setAnnouncements(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const filteredAnnouncements = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.message.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getTargetRoleLabel = (role: string | null) => {
    switch (role) {
      case "teacher":
        return "For Teachers";
      case "accountant":
        return "For Accountant";
      case "parent":
        return "For Parents";
      case "school_admin":
        return "Admin Only";
      default:
        return "All Users";
    }
  };

  const getTargetRoleColor = (role: string | null) => {
    switch (role) {
      case "teacher":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "accountant":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "parent":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
            <p className="text-sm text-slate-500 mt-1">
              Stay updated with school notifications
            </p>
          </div>

          {/* Stats Card */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl px-6 py-4 text-white shadow-lg shadow-blue-500/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Megaphone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-3xl font-bold">{announcements.length}</p>
                <p className="text-xs text-blue-100 font-medium">
                  Total Announcements
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse"
              >
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
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                      <Megaphone className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold text-slate-900">
                        {announcement.title}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full border ${getTargetRoleColor(announcement.targetRole)}`}
                      >
                        {getTargetRoleLabel(announcement.targetRole)}
                      </span>
                    </div>

                    <p className="text-slate-600 leading-relaxed mb-4">
                      {announcement.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{announcement.createdByName || "Admin"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(announcement.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-8 h-8 text-slate-400" />
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

export default TeacherAnnouncements;
