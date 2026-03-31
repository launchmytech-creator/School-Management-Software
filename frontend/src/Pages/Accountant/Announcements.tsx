import React, { useState, useEffect, useCallback } from "react";
import AccountantLayout from "../../layouts/AccountantLayout";
import {
  announcementService,
  type Announcement,
} from "../../services/announcementService";
import { Megaphone, Search, Calendar, User } from "lucide-react";
import { formatDate } from "../../lib/utils";

const AccountantAnnouncements: React.FC = () => {
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
      case "accountant":
        return "For Me";
      case "teacher":
        return "For Teachers";
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
      case "accountant":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "teacher":
        return "bg-slate-100 text-slate-400 border-slate-200";
      case "parent":
        return "bg-slate-100 text-slate-400 border-slate-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <AccountantLayout
      title="Announcements"
      subtitle="View announcements from school administration"
    >
      <div className="space-y-6 pb-12">
        {/* Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse"
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
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                      <Megaphone className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-base font-semibold text-slate-900">
                        {announcement.title}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${getTargetRoleColor(announcement.targetRole)}`}
                      >
                        {getTargetRoleLabel(announcement.targetRole)}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed mb-3">
                      {announcement.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
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
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 mb-1">
              {searchTerm ? "No announcements found" : "No announcements yet"}
            </h3>
            <p className="text-sm text-slate-500">
              {searchTerm
                ? "Try adjusting your search terms"
                : "You will see announcements here when they are posted"}
            </p>
          </div>
        )}
      </div>
    </AccountantLayout>
  );
};

export default AccountantAnnouncements;
